import { z } from 'zod';
import { WASTE_KEYS } from './data/waste-keys';

const wasteKeyCodes = WASTE_KEYS.map((entry) => entry.code) as [string, ...string[]];

export const addressSchema = z.object({
  street: z.string().trim().min(3, 'Straße und Hausnummer sind erforderlich'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'PLZ muss 5-stellig sein'),
  city: z.string().trim().min(2, 'Ort ist erforderlich'),
  country: z.literal('DE'),
});

export const productSchema = z.object({
  wasteKeyNumber: z.enum(wasteKeyCodes, {
    errorMap: () => ({ message: 'Bitte Abfallschlüsselnummer wählen' }),
  }),
  quantityLiters: z
    .number({ invalid_type_error: 'Menge muss eine Zahl sein' })
    .positive('Menge muss größer als 0 sein'),
});

export const customerStepSchema = z.object({
  isExistingCustomer: z.boolean(),
  companyName: z.string().trim().min(2, 'Firma ist erforderlich'),
  vatId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? '')
    .refine(
      (value) => value === '' || /^DE\d{9}$/.test(value.replace(/\s/g, '').toUpperCase()),
      'USt-IdNr. muss im Format DE123456789 vorliegen',
    ),
  customerNumber: z.string().trim().optional(),
  firstName: z.string().trim().min(2, 'Vorname ist erforderlich'),
  lastName: z.string().trim().min(2, 'Nachname ist erforderlich'),
  email: z.string().trim().email('Gültige E-Mail-Adresse erforderlich'),
  phone: z.string().trim().min(6, 'Telefonnummer ist erforderlich'),
  contactPerson: z.string().trim().optional(),
});

export const addressStepSchema = z
  .object({
    billingAddress: addressSchema,
    differentPickupAddress: z.boolean(),
    pickupAddress: addressSchema.partial().optional(),
    reachableWith20mHose: z.boolean({
      required_error: 'Bitte angeben, ob die Abholstelle mit 20 m Schlauch erreichbar ist',
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.differentPickupAddress) return;

    const result = addressSchema.safeParse(data.pickupAddress);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ['pickupAddress', ...(issue.path ?? [])],
        });
      });
    }
  });

export const productsStepSchema = z.object({
  products: z.array(productSchema).min(1, 'Mindestens ein Produkt erforderlich'),
});

export const submitStepSchema = z.object({
  remarks: z.string().trim().optional(),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Datenschutzerklärung muss bestätigt werden' }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'AGB müssen akzeptiert werden' }),
  }),
  website: z.literal('').optional(),
});

export const entsorgungsauftragSchema = customerStepSchema
  .merge(
    z.object({
      billingAddress: addressSchema,
      differentPickupAddress: z.boolean(),
      pickupAddress: addressSchema.optional(),
      reachableWith20mHose: z.boolean(),
      products: z.array(productSchema).min(1),
      remarks: z.string().optional(),
      privacyAccepted: z.literal(true),
      termsAccepted: z.literal(true),
    }),
  )
  .superRefine((data, ctx) => {
    if (data.differentPickupAddress) {
      const result = addressSchema.safeParse(data.pickupAddress);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ['pickupAddress', ...(issue.path ?? [])],
          });
        });
      }
    }
  });

export type CustomerStepData = z.infer<typeof customerStepSchema>;
export type AddressStepData = z.infer<typeof addressStepSchema>;
export type ProductsStepData = z.infer<typeof productsStepSchema>;
export type SubmitStepData = z.infer<typeof submitStepSchema>;
export type EntsorgungsauftragData = z.infer<typeof entsorgungsauftragSchema>;

export type EntsorgungsauftragDraft = Omit<
  EntsorgungsauftragData,
  'privacyAccepted' | 'termsAccepted'
> & {
  privacyAccepted: boolean;
  termsAccepted: boolean;
};

export interface EntsorgungsauftragPayload {
  formType: 'entsorgungsauftrag';
  customer: {
    isExistingCustomer: boolean;
    customerNumber: string | null;
    company: {
      name: string;
      vatId: string | null;
      vatIdValid: boolean | null;
    };
    contact: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      contactPerson: string | null;
    };
  };
  billingAddress: z.infer<typeof addressSchema>;
  pickupAddress: {
    differentFromBilling: boolean;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: 'DE';
    reachableWith20mHose: boolean;
  };
  products: Array<{
    wasteKeyNumber: string;
    wasteKeyLabel: string;
    quantityLiters: number;
  }>;
  remarks: string | null;
  consent: {
    privacyAccepted: boolean;
    termsAccepted: boolean;
  };
  meta: {
    submittedAt: string;
    locale: string;
  };
}

export function toPayload(
  data: EntsorgungsauftragData,
  locale: string,
  wasteKeyLabels: Record<string, string>,
): EntsorgungsauftragPayload {
  const pickup = data.differentPickupAddress ? data.pickupAddress! : data.billingAddress;

  return {
    formType: 'entsorgungsauftrag',
    customer: {
      isExistingCustomer: data.isExistingCustomer,
      customerNumber: data.customerNumber?.trim() ? data.customerNumber.trim() : null,
      company: {
        name: data.companyName,
        vatId: data.vatId?.trim() ? data.vatId.trim().toUpperCase() : null,
        vatIdValid: null,
      },
      contact: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        contactPerson: data.contactPerson?.trim() ? data.contactPerson.trim() : null,
      },
    },
    billingAddress: data.billingAddress,
    pickupAddress: {
      differentFromBilling: data.differentPickupAddress,
      street: pickup.street,
      postalCode: pickup.postalCode,
      city: pickup.city,
      country: 'DE',
      reachableWith20mHose: data.reachableWith20mHose,
    },
    products: data.products.map((product) => ({
      wasteKeyNumber: product.wasteKeyNumber,
      wasteKeyLabel: wasteKeyLabels[product.wasteKeyNumber] ?? product.wasteKeyNumber,
      quantityLiters: product.quantityLiters,
    })),
    remarks: data.remarks?.trim() ? data.remarks.trim() : null,
    consent: {
      privacyAccepted: data.privacyAccepted,
      termsAccepted: data.termsAccepted,
    },
    meta: {
      submittedAt: new Date().toISOString(),
      locale,
    },
  };
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!messages[key]) {
      messages[key] = issue.message;
    }
  }
  return messages;
}
