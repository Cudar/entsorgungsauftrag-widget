export interface AddressInput {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface AddressValidationResult {
  valid: boolean;
  normalized?: AddressInput;
  messages: string[];
}

export interface AddressValidator {
  validate(address: AddressInput): Promise<AddressValidationResult>;
}
