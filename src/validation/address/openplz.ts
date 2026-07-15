import type { AddressField, AddressInput, AddressValidationResult, AddressValidator } from './types';
import { LocalAddressValidator } from './local';

const DEFAULT_BASE_URL = 'https://openplzapi.org';

interface OpenPlzLocality {
  postalCode: string;
  name: string;
}

interface OpenPlzStreet {
  name: string;
  postalCode: string;
  locality: string;
}

export interface OpenPlzAddressValidatorOptions {
  baseUrl?: string;
  fallbackToLocal?: boolean;
}

function parseStreetLine(streetLine: string): { name: string; houseNumber?: string } {
  const trimmed = streetLine.trim();
  const match = trimmed.match(/^(.+?)\s+(\d+\s?[a-zA-Z]?)$/);

  if (match) {
    return { name: match[1].trim(), houseNumber: match[2].replace(/\s/g, '') };
  }

  return { name: trimmed };
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .replace(/strasse/g, 'str')
    .replace(/straße/g, 'str');
}

function streetNamesMatch(input: string, candidate: string): boolean {
  const normalizedInput = normalizeName(input);
  const normalizedCandidate = normalizeName(candidate);

  if (!normalizedInput || !normalizedCandidate) {
    return false;
  }

  if (normalizedInput === normalizedCandidate) {
    return true;
  }

  return (
    normalizedInput.startsWith(normalizedCandidate) ||
    normalizedCandidate.startsWith(normalizedInput)
  );
}

function localityMatches(inputCity: string, apiLocality: string): boolean {
  return normalizeName(inputCity) === normalizeName(apiLocality);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildStreetSearchPrefix(streetName: string): string | null {
  const normalized = normalizeName(streetName).replace(/[^a-z0-9]/g, '');
  if (normalized.length < 3) {
    return null;
  }

  return normalized.slice(0, Math.min(12, normalized.length));
}

function buildSuggestion(
  address: AddressInput,
  streetName: string,
  houseNumber: string | undefined,
  locality: OpenPlzLocality,
  street?: OpenPlzStreet,
): AddressInput {
  const resolvedStreet = street
    ? `${street.name}${houseNumber ? ` ${houseNumber}` : ''}`
    : address.street;

  return {
    street: resolvedStreet,
    postalCode: locality.postalCode,
    city: locality.name,
    country: address.country,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`OpenPLZ API responded with ${response.status}`);
  }

  return (await response.json()) as T;
}

export class OpenPlzAddressValidator implements AddressValidator {
  private readonly localValidator = new LocalAddressValidator();
  private readonly baseUrl: string;

  constructor(private readonly options: OpenPlzAddressValidatorOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  private async fetchLocalities(postalCode: string): Promise<OpenPlzLocality[]> {
    const params = new URLSearchParams({ postalCode });
    return fetchJson<OpenPlzLocality[]>(`${this.baseUrl}/de/Localities?${params.toString()}`);
  }

  private async fetchStreets(
    postalCode: string,
    locality: string,
    streetPrefix: string,
  ): Promise<OpenPlzStreet[]> {
    const params = new URLSearchParams({
      name: `^${escapeRegex(streetPrefix)}`,
      postalCode,
      locality: `^${escapeRegex(locality)}$`,
    });

    return fetchJson<OpenPlzStreet[]>(`${this.baseUrl}/de/Streets?${params.toString()}`);
  }

  async validate(address: AddressInput): Promise<AddressValidationResult> {
    const localResult = await this.localValidator.validate(address);
    if (!localResult.valid) {
      return localResult;
    }

    const normalized = localResult.normalized ?? address;
    const { street, postalCode, city } = normalized;
    const parsedStreet = parseStreetLine(street);

    if (!parsedStreet.houseNumber) {
      return {
        valid: false,
        messages: ['Bitte Straße und Hausnummer angeben'],
        normalized,
        invalidFields: ['street'],
      };
    }

    try {
      const localities = await this.fetchLocalities(postalCode);
      const matchingLocality = localities.find((entry) => localityMatches(city, entry.name));

      if (!matchingLocality) {
        const suggestedLocality = localities[0];

        return {
          valid: false,
          messages: ['PLZ und Ort stimmen nicht überein'],
          normalized,
          invalidFields: ['postalCode', 'city'],
          suggestion: suggestedLocality
            ? buildSuggestion(normalized, parsedStreet.name, parsedStreet.houseNumber, suggestedLocality)
            : undefined,
        };
      }

      const streetPrefix = buildStreetSearchPrefix(parsedStreet.name);
      if (!streetPrefix) {
        return {
          valid: false,
          messages: ['Straße und Hausnummer sind erforderlich'],
          normalized,
          invalidFields: ['street'],
        };
      }

      const streets = await this.fetchStreets(postalCode, matchingLocality.name, streetPrefix);
      const matchingStreet = streets.find((entry) => streetNamesMatch(parsedStreet.name, entry.name));

      if (!matchingStreet) {
        const suggestedStreet = streets[0];

        return {
          valid: false,
          messages: ['Straße wurde in dieser PLZ nicht gefunden'],
          normalized,
          invalidFields: ['street'],
          suggestion: suggestedStreet
            ? buildSuggestion(
                normalized,
                parsedStreet.name,
                parsedStreet.houseNumber,
                matchingLocality,
                suggestedStreet,
              )
            : undefined,
        };
      }

      return {
        valid: true,
        normalized: {
          street: `${matchingStreet.name} ${parsedStreet.houseNumber}`,
          postalCode: matchingLocality.postalCode,
          city: matchingLocality.name,
          country: normalized.country,
        },
        messages: [],
      };
    } catch {
      if (this.options.fallbackToLocal ?? true) {
        return localResult;
      }

      return {
        valid: false,
        messages: ['Adressvalidierung derzeit nicht verfügbar'],
        normalized,
      };
    }
  }
}
