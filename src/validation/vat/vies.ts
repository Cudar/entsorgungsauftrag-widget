import type { VatValidationResult, VatValidator } from './types';
import { LocalVatValidator } from './local';

export interface ViesVatValidatorOptions {
  apiUrl: string;
}

export class ViesVatValidator implements VatValidator {
  private readonly localValidator = new LocalVatValidator();

  constructor(private readonly options: ViesVatValidatorOptions) {}

  async validate(vatId: string, country: string): Promise<VatValidationResult> {
    const localResult = await this.localValidator.validate(vatId, country);
    if (!localResult.valid || !vatId.trim()) {
      return localResult;
    }

    try {
      const response = await fetch(this.options.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatId, country }),
      });

      if (!response.ok) {
        throw new Error(`VIES proxy responded with ${response.status}`);
      }

      return (await response.json()) as VatValidationResult;
    } catch {
      return {
        valid: false,
        messages: ['USt-IdNr.-Prüfung derzeit nicht verfügbar'],
      };
    }
  }
}

export function createVatValidator(mode: 'local' | 'vies', apiUrl?: string): VatValidator {
  if (mode === 'vies' && apiUrl) {
    return new ViesVatValidator({ apiUrl });
  }

  return new LocalVatValidator();
}
