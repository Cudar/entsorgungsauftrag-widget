import type { AddressField, AddressInput, AddressValidationResult, AddressValidator } from './types';

export class LocalAddressValidator implements AddressValidator {
  async validate(address: AddressInput): Promise<AddressValidationResult> {
    const messages: string[] = [];
    const invalidFields: AddressField[] = [];
    const street = address.street.trim();
    const postalCode = address.postalCode.trim();
    const city = address.city.trim();
    const country = address.country.trim().toUpperCase();

    if (street.length < 3) {
      messages.push('Straße und Hausnummer sind erforderlich');
      invalidFields.push('street');
    }

    if (country === 'DE' && !/^\d{5}$/.test(postalCode)) {
      messages.push('PLZ muss 5-stellig sein');
      invalidFields.push('postalCode');
    }

    if (city.length < 2) {
      messages.push('Ort ist erforderlich');
      invalidFields.push('city');
    }

    return {
      valid: messages.length === 0,
      normalized: {
        street,
        postalCode,
        city,
        country,
      },
      messages,
      invalidFields: invalidFields.length > 0 ? invalidFields : undefined,
    };
  }
}
