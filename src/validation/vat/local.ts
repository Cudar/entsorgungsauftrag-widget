import type { VatValidationResult, VatValidator } from './types';

export class LocalVatValidator implements VatValidator {
  async validate(vatId: string, country: string): Promise<VatValidationResult> {
    const normalized = vatId.replace(/\s/g, '').toUpperCase();

    if (!normalized) {
      return { valid: true, messages: [] };
    }

    if (country === 'DE' && !/^DE\d{9}$/.test(normalized)) {
      return {
        valid: false,
        messages: ['USt-IdNr. muss im Format DE123456789 vorliegen'],
      };
    }

    return { valid: true, messages: [] };
  }
}
