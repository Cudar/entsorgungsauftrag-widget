export interface AddressInput {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export type AddressField = 'street' | 'postalCode' | 'city';

export interface AddressValidationResult {
  valid: boolean;
  normalized?: AddressInput;
  messages: string[];
  invalidFields?: AddressField[];
  suggestion?: AddressInput;
}

export interface AddressValidator {
  validate(address: AddressInput): Promise<AddressValidationResult>;
}
