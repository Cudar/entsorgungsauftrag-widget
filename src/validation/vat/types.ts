export interface VatValidationResult {
  valid: boolean;
  messages: string[];
}

export interface VatValidator {
  validate(vatId: string, country: string): Promise<VatValidationResult>;
}
