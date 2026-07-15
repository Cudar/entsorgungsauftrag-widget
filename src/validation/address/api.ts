import type { AddressInput, AddressValidationResult, AddressValidator } from './types';
import { LocalAddressValidator } from './local';
import { OpenPlzAddressValidator } from './openplz';

export type AddressValidationMode = 'local' | 'openplz' | 'api';

export interface ApiAddressValidatorOptions {
  apiUrl: string;
  fallbackToLocal?: boolean;
}

export class ApiAddressValidator implements AddressValidator {
  private readonly localValidator = new LocalAddressValidator();

  constructor(private readonly options: ApiAddressValidatorOptions) {}

  async validate(address: AddressInput): Promise<AddressValidationResult> {
    const localResult = await this.localValidator.validate(address);
    if (!localResult.valid) {
      return localResult;
    }

    try {
      const response = await fetch(this.options.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localResult.normalized ?? address),
      });

      if (!response.ok) {
        throw new Error(`Address API responded with ${response.status}`);
      }

      return (await response.json()) as AddressValidationResult;
    } catch {
      if (this.options.fallbackToLocal ?? true) {
        return localResult;
      }

      return {
        valid: false,
        messages: ['Adressvalidierung derzeit nicht verfügbar'],
      };
    }
  }
}

export function createAddressValidator(mode: AddressValidationMode, apiUrl?: string): AddressValidator {
  if (mode === 'api' && apiUrl) {
    return new ApiAddressValidator({ apiUrl });
  }

  if (mode === 'openplz') {
    return new OpenPlzAddressValidator({ baseUrl: apiUrl });
  }

  return new LocalAddressValidator();
}
