import { WASTE_KEYS, formatWasteKeyOption, findWasteKeyByCode } from './data/waste-keys';
import {
  addressStepSchema,
  customerStepSchema,
  formatZodErrors,
  productsStepSchema,
  submitStepSchema,
  toPayload,
  type EntsorgungsauftragDraft,
} from './schema';
import { createAddressValidator } from './validation/address/api';
import { createVatValidator } from './validation/vat/vies';
import { formStyles } from './styles/form-styles';

const STEP_LABELS = ['Kundendaten', 'Adressen', 'Produkte', 'Absenden'];

interface ProductEntry {
  wasteKeyNumber: string;
  quantityLiters: string;
}

interface FormState {
  step: number;
  submitted: boolean;
  isExistingCustomer: boolean | null;
  companyName: string;
  vatId: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactPerson: string;
  billingStreet: string;
  billingPostalCode: string;
  billingCity: string;
  differentPickupAddress: boolean;
  pickupStreet: string;
  pickupPostalCode: string;
  pickupCity: string;
  reachableWith20mHose: boolean | null;
  products: ProductEntry[];
  wasteSearch: string[];
  wasteListOpen: boolean[];
  remarks: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
  website: string;
  errors: Record<string, string>;
}

function emptyProduct(): ProductEntry {
  return { wasteKeyNumber: '', quantityLiters: '' };
}

function initialState(): FormState {
  return {
    step: 0,
    submitted: false,
    isExistingCustomer: null,
    companyName: '',
    vatId: '',
    customerNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    contactPerson: '',
    billingStreet: '',
    billingPostalCode: '',
    billingCity: '',
    differentPickupAddress: false,
    pickupStreet: '',
    pickupPostalCode: '',
    pickupCity: '',
    reachableWith20mHose: null,
    products: [emptyProduct()],
    wasteSearch: [''],
    wasteListOpen: [false],
    remarks: '',
    privacyAccepted: false,
    termsAccepted: false,
    website: '',
    errors: {},
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fieldError(errors: Record<string, string>, key: string): string {
  return errors[key] ? `<span class="error" id="error-${escapeHtml(key)}">${escapeHtml(errors[key])}</span>` : '';
}

export class EntsorgungsauftragForm extends HTMLElement {
  private state: FormState = initialState();

  static get observedAttributes(): string[] {
    return [
      'locale',
      'address-validation',
      'address-api-url',
      'vat-validation',
      'vat-api-url',
      'privacy-url',
      'terms-url',
    ];
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    document.addEventListener('click', this.handleOutsideClick, true);
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private get locale(): string {
    return this.getAttribute('locale') ?? 'de';
  }

  private get privacyUrl(): string {
    return this.getAttribute('privacy-url') ?? '#';
  }

  private get termsUrl(): string {
    return this.getAttribute('terms-url') ?? '#';
  }

  private get addressValidator() {
    const mode = this.getAttribute('address-validation') === 'api' ? 'api' : 'local';
    const apiUrl = this.getAttribute('address-api-url') ?? undefined;
    return createAddressValidator(mode, apiUrl);
  }

  private get vatValidator() {
    const mode = this.getAttribute('vat-validation') === 'vies' ? 'vies' : 'local';
    const apiUrl = this.getAttribute('vat-api-url') ?? undefined;
    return createVatValidator(mode, apiUrl);
  }

  private setState(patch: Partial<FormState>, options: { render?: boolean } = { render: true }): void {
    this.state = { ...this.state, ...patch };
    if (options.render !== false) {
      this.render();
    }
  }

  private syncState(patch: Partial<FormState>): void {
    this.state = { ...this.state, ...patch };
  }

  private clearFieldErrorUi(target: HTMLInputElement | HTMLTextAreaElement): void {
    const describedBy = target.getAttribute('aria-describedby');
    if (describedBy) {
      this.shadowRoot?.getElementById(describedBy)?.remove();
    }
    target.removeAttribute('aria-invalid');
    target.removeAttribute('aria-describedby');
  }

  private render(): void {
    if (!this.shadowRoot) return;

    const active = this.shadowRoot.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    const focusSelector = this.getFocusSelector(active);
    const selectionStart = active?.selectionStart ?? null;
    const selectionEnd = active?.selectionEnd ?? null;

    const { step, submitted } = this.state;

    this.shadowRoot.innerHTML = `
      <style>${formStyles}</style>
      <div class="form-shell">
        <h2>Entsorgungsauftrag</h2>
        <p class="subtitle">B2B-Auftrag zur Altölentsorgung</p>
        ${submitted ? this.renderSuccess() : `${this.renderSteps()}${this.renderStepContent()}${this.renderActions()}`}
      </div>
    `;

    this.bindEvents();
    this.restoreFocus(focusSelector, selectionStart, selectionEnd);
  }

  private getFocusSelector(element: Element | null): string | null {
    if (!element) return null;
    if (element.id) return `#${CSS.escape(element.id)}`;
    const name = element.getAttribute('name');
    if (name) return `[name="${CSS.escape(name)}"]`;
    return null;
  }

  private restoreFocus(
    selector: string | null,
    selectionStart: number | null,
    selectionEnd: number | null,
  ): void {
    if (!selector || !this.shadowRoot) return;

    const element = this.shadowRoot.querySelector(selector);
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;

    element.focus();
    if (selectionStart !== null && selectionEnd !== null && typeof element.setSelectionRange === 'function') {
      element.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  private renderSteps(): string {
    return `
      <div class="steps" aria-label="Formularschritte">
        ${STEP_LABELS.map((label, index) => {
          const className =
            index === this.state.step ? 'active' : index < this.state.step ? 'done' : '';
          return `<div class="step-indicator ${className}">${index + 1}. ${label}</div>`;
        }).join('')}
      </div>
    `;
  }

  private renderStepContent(): string {
    switch (this.state.step) {
      case 0:
        return this.renderCustomerStep();
      case 1:
        return this.renderAddressStep();
      case 2:
        return this.renderProductsStep();
      case 3:
        return this.renderSummaryStep();
      default:
        return '';
    }
  }

  private renderCustomerStep(): string {
    const { errors } = this.state;
    return `
      <fieldset>
        <legend>Kundendaten</legend>
        <div class="field-grid">
          <div class="field">
            <span class="field-label required">Bestandskunde</span>
            <div class="radio-group">
              <label><input type="radio" name="isExistingCustomer" value="true" ${this.state.isExistingCustomer === true ? 'checked' : ''} /> Ja</label>
              <label><input type="radio" name="isExistingCustomer" value="false" ${this.state.isExistingCustomer === false ? 'checked' : ''} /> Nein</label>
            </div>
            ${fieldError(errors, 'isExistingCustomer')}
          </div>

          <div class="field">
            <label class="required" for="companyName">Firma</label>
            <input id="companyName" name="companyName" type="text" value="${escapeHtml(this.state.companyName)}" aria-invalid="${errors.companyName ? 'true' : 'false'}" aria-describedby="${errors.companyName ? 'error-companyName' : ''}" />
            ${fieldError(errors, 'companyName')}
          </div>

          <div class="field-grid two-col">
            <div class="field">
              <label for="vatId">Umsatzsteuer-ID</label>
              <input id="vatId" name="vatId" type="text" placeholder="DE123456789" value="${escapeHtml(this.state.vatId)}" aria-invalid="${errors.vatId ? 'true' : 'false'}" aria-describedby="${errors.vatId ? 'error-vatId' : ''}" />
              ${fieldError(errors, 'vatId')}
            </div>
            <div class="field">
              <label for="customerNumber">Kundennummer ${this.state.isExistingCustomer ? '(empfohlen)' : '(wenn bekannt)'}</label>
              <input id="customerNumber" name="customerNumber" type="text" value="${escapeHtml(this.state.customerNumber)}" />
            </div>
          </div>

          <div class="field-grid two-col">
            <div class="field">
              <label class="required" for="firstName">Vorname</label>
              <input id="firstName" name="firstName" type="text" value="${escapeHtml(this.state.firstName)}" aria-invalid="${errors.firstName ? 'true' : 'false'}" aria-describedby="${errors.firstName ? 'error-firstName' : ''}" />
              ${fieldError(errors, 'firstName')}
            </div>
            <div class="field">
              <label class="required" for="lastName">Nachname</label>
              <input id="lastName" name="lastName" type="text" value="${escapeHtml(this.state.lastName)}" aria-invalid="${errors.lastName ? 'true' : 'false'}" aria-describedby="${errors.lastName ? 'error-lastName' : ''}" />
              ${fieldError(errors, 'lastName')}
            </div>
          </div>

          <div class="field-grid two-col">
            <div class="field">
              <label class="required" for="email">E-Mail</label>
              <input id="email" name="email" type="email" value="${escapeHtml(this.state.email)}" aria-invalid="${errors.email ? 'true' : 'false'}" aria-describedby="${errors.email ? 'error-email' : ''}" />
              ${fieldError(errors, 'email')}
            </div>
            <div class="field">
              <label class="required" for="phone">Telefonnummer</label>
              <input id="phone" name="phone" type="tel" placeholder="z. B. 05177 85858" value="${escapeHtml(this.state.phone)}" aria-invalid="${errors.phone ? 'true' : 'false'}" aria-describedby="${errors.phone ? 'error-phone' : ''}" />
              ${fieldError(errors, 'phone')}
            </div>
          </div>

          <div class="field">
            <label for="contactPerson">Ansprechpartner (optional)</label>
            <input id="contactPerson" name="contactPerson" type="text" value="${escapeHtml(this.state.contactPerson)}" />
            <span class="hint">Nur ausfüllen, wenn vor Ort eine andere Person als Ansprechpartner fungiert.</span>
          </div>
        </div>
      </fieldset>
    `;
  }

  private renderAddressStep(): string {
    const { errors } = this.state;
    return `
      <fieldset>
        <legend>Adressen</legend>
        <div class="field-grid">
          <div class="section-divider">Rechnungsadresse</div>
          <div class="field">
            <label class="required" for="billingStreet">Straße + Nr.</label>
            <input id="billingStreet" name="billingStreet" type="text" value="${escapeHtml(this.state.billingStreet)}" aria-invalid="${errors['billingAddress.street'] ? 'true' : 'false'}" />
            ${fieldError(errors, 'billingAddress.street')}
          </div>
          <div class="field-grid two-col">
            <div class="field">
              <label class="required" for="billingPostalCode">PLZ</label>
              <input id="billingPostalCode" name="billingPostalCode" type="text" inputmode="numeric" value="${escapeHtml(this.state.billingPostalCode)}" aria-invalid="${errors['billingAddress.postalCode'] ? 'true' : 'false'}" />
              ${fieldError(errors, 'billingAddress.postalCode')}
            </div>
            <div class="field">
              <label class="required" for="billingCity">Ort</label>
              <input id="billingCity" name="billingCity" type="text" value="${escapeHtml(this.state.billingCity)}" aria-invalid="${errors['billingAddress.city'] ? 'true' : 'false'}" />
              ${fieldError(errors, 'billingAddress.city')}
            </div>
          </div>

          <div class="checkbox-field">
            <label>
              <input type="checkbox" name="differentPickupAddress" ${this.state.differentPickupAddress ? 'checked' : ''} />
              Abholadresse weicht von Rechnungsadresse ab
            </label>
          </div>

          ${
            this.state.differentPickupAddress
              ? `
            <div class="section-divider">Abholadresse</div>
            <div class="field">
              <label class="required" for="pickupStreet">Straße + Nr. (Abholung)</label>
              <input id="pickupStreet" name="pickupStreet" type="text" value="${escapeHtml(this.state.pickupStreet)}" aria-invalid="${errors['pickupAddress.street'] ? 'true' : 'false'}" />
              ${fieldError(errors, 'pickupAddress.street')}
            </div>
            <div class="field-grid two-col">
              <div class="field">
                <label class="required" for="pickupPostalCode">PLZ (Abholung)</label>
                <input id="pickupPostalCode" name="pickupPostalCode" type="text" inputmode="numeric" value="${escapeHtml(this.state.pickupPostalCode)}" aria-invalid="${errors['pickupAddress.postalCode'] ? 'true' : 'false'}" />
                ${fieldError(errors, 'pickupAddress.postalCode')}
              </div>
              <div class="field">
                <label class="required" for="pickupCity">Ort (Abholung)</label>
                <input id="pickupCity" name="pickupCity" type="text" value="${escapeHtml(this.state.pickupCity)}" aria-invalid="${errors['pickupAddress.city'] ? 'true' : 'false'}" />
                ${fieldError(errors, 'pickupAddress.city')}
              </div>
            </div>
          `
              : ''
          }

          <div class="field">
            <span class="field-label required">Mit einer Schlauchlänge von 20 m erreichbar</span>
            <div class="radio-group">
              <label><input type="radio" name="reachableWith20mHose" value="true" ${this.state.reachableWith20mHose === true ? 'checked' : ''} /> Ja</label>
              <label><input type="radio" name="reachableWith20mHose" value="false" ${this.state.reachableWith20mHose === false ? 'checked' : ''} /> Nein</label>
            </div>
            <span class="hint">Das Entsorgungsfahrzeug muss die Abstellfläche mit 20 m Schlauch erreichen können.</span>
            ${fieldError(errors, 'reachableWith20mHose')}
          </div>
        </div>
      </fieldset>
    `;
  }

  private renderWasteCombobox(index: number): string {
    const search = this.state.wasteSearch[index] ?? '';
    const selected = this.state.products[index]?.wasteKeyNumber ?? '';
    const selectedLabel = selected ? formatWasteKeyOption(findWasteKeyByCode(selected)!) : '';
    const displayValue = this.state.wasteListOpen[index] ? search : selectedLabel || search;
    const query = search.trim().toLowerCase();

    const filtered = WASTE_KEYS.filter((entry) => {
      if (!query) return true;
      const haystack = formatWasteKeyOption(entry).toLowerCase();
      return haystack.includes(query) || entry.code.replace(/\s/g, '').includes(query.replace(/\s/g, ''));
    });

    const groups = ['Altöl', 'Emulsion'] as const;
    const wasteKeyErrorKey = `products.${index}.wasteKeyNumber`;

    return `
      <div class="combobox" data-combobox="${index}">
        <label class="required">Abfallschlüsselnummer</label>
        <input
          type="text"
          name="wasteSearch-${index}"
          data-waste-search="${index}"
          autocomplete="off"
          placeholder="Suchen nach Code oder Bezeichnung …"
          value="${escapeHtml(displayValue)}"
          aria-invalid="${this.state.errors[wasteKeyErrorKey] ? 'true' : 'false'}"
          aria-expanded="${this.state.wasteListOpen[index] ? 'true' : 'false'}"
        />
        <input type="hidden" name="wasteKeyNumber-${index}" value="${escapeHtml(selected)}" />
        ${
          this.state.wasteListOpen[index]
            ? `
          <ul class="combobox-list" role="listbox">
            ${groups
              .map((category) => {
                const items = filtered.filter((entry) => entry.category === category);
                if (items.length === 0) return '';
                return `
                  <li class="category">${category}</li>
                  ${items
                    .map(
                      (entry) => `
                    <li role="option" data-waste-option="${index}" data-code="${entry.code}" aria-selected="${selected === entry.code ? 'true' : 'false'}">
                      ${escapeHtml(formatWasteKeyOption(entry))}
                    </li>
                  `,
                    )
                    .join('')}
                `;
              })
              .join('')}
          </ul>
        `
            : ''
        }
        ${fieldError(this.state.errors, `products.${index}.wasteKeyNumber`)}
      </div>
    `;
  }

  private renderProductsStep(): string {
    const { errors } = this.state;

    return `
      <fieldset>
        <legend>Produkte</legend>
        ${this.state.products
          .map((product, index) => {
            const quantityErrorKey = `products.${index}.quantityLiters`;
            return `
          <div class="product-block" data-product-index="${index}">
            <div class="product-header">
              <span>Produkt ${index + 1}</span>
              ${
                this.state.products.length > 1
                  ? `<button type="button" class="link" data-remove-product="${index}">Entfernen</button>`
                  : ''
              }
            </div>
            <div class="field-grid">
              ${this.renderWasteCombobox(index)}
              <div class="field">
                <label class="required" for="quantityLiters-${index}">Menge in Liter</label>
                <input id="quantityLiters-${index}" name="quantityLiters-${index}" type="number" min="1" step="1" value="${escapeHtml(product.quantityLiters)}" aria-invalid="${errors[quantityErrorKey] ? 'true' : 'false'}" />
                ${fieldError(errors, quantityErrorKey)}
              </div>
            </div>
          </div>
        `;
          })
          .join('')}
        <button type="button" class="secondary" data-add-product>+ Weiteres Produkt hinzufügen</button>
        ${fieldError(errors, 'products')}
      </fieldset>
    `;
  }

  private renderSummaryStep(): string {
    const data = this.collectFormData();
    const pickup = data.differentPickupAddress ? data.pickupAddress! : data.billingAddress;

    return `
      <fieldset>
        <legend>Zusammenfassung &amp; Absenden</legend>

        <div class="summary-block">
          <h3>Kundendaten</h3>
          <dl>
            <div class="summary-row"><dt>Bestandskunde</dt><dd>${data.isExistingCustomer ? 'Ja' : 'Nein'}</dd></div>
            <div class="summary-row"><dt>Firma</dt><dd>${escapeHtml(data.companyName)}</dd></div>
            ${data.vatId ? `<div class="summary-row"><dt>USt-IdNr.</dt><dd>${escapeHtml(data.vatId)}</dd></div>` : ''}
            ${data.customerNumber ? `<div class="summary-row"><dt>Kundennummer</dt><dd>${escapeHtml(data.customerNumber)}</dd></div>` : ''}
            <div class="summary-row"><dt>Kontakt</dt><dd>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</dd></div>
            <div class="summary-row"><dt>E-Mail</dt><dd>${escapeHtml(data.email)}</dd></div>
            <div class="summary-row"><dt>Telefon</dt><dd>${escapeHtml(data.phone)}</dd></div>
            ${data.contactPerson ? `<div class="summary-row"><dt>Ansprechpartner</dt><dd>${escapeHtml(data.contactPerson)}</dd></div>` : ''}
          </dl>
        </div>

        <div class="summary-block">
          <h3>Adressen</h3>
          <dl>
            <div class="summary-row"><dt>Rechnung</dt><dd>${escapeHtml(data.billingAddress.street)}, ${escapeHtml(data.billingAddress.postalCode)} ${escapeHtml(data.billingAddress.city)}</dd></div>
            <div class="summary-row"><dt>Abholung</dt><dd>${data.differentPickupAddress ? `${escapeHtml(pickup.street)}, ${escapeHtml(pickup.postalCode)} ${escapeHtml(pickup.city)}` : 'Entspricht Rechnungsadresse'}</dd></div>
            <div class="summary-row"><dt>20 m Schlauch</dt><dd>${data.reachableWith20mHose ? 'Ja' : 'Nein'}</dd></div>
          </dl>
        </div>

        <div class="summary-block">
          <h3>Produkte</h3>
          ${data.products
            .map((product, index) => {
              const wasteKey = findWasteKeyByCode(product.wasteKeyNumber);
              return `<p><strong>Produkt ${index + 1}:</strong> ${escapeHtml(wasteKey ? formatWasteKeyOption(wasteKey) : product.wasteKeyNumber)} – ${product.quantityLiters} Liter</p>`;
            })
            .join('')}
        </div>

        <div class="field">
          <label for="remarks">Bemerkungen</label>
          <textarea id="remarks" name="remarks" rows="4">${escapeHtml(this.state.remarks)}</textarea>
        </div>

        <div class="field checkbox-field">
          <label>
            <input type="checkbox" name="privacyAccepted" ${this.state.privacyAccepted ? 'checked' : ''} />
            Die <a href="${escapeHtml(this.privacyUrl)}" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a> habe ich zur Kenntnis genommen.
          </label>
          ${fieldError(this.state.errors, 'privacyAccepted')}
        </div>

        <div class="field checkbox-field">
          <label>
            <input type="checkbox" name="termsAccepted" ${this.state.termsAccepted ? 'checked' : ''} />
            Ich akzeptiere die <a href="${escapeHtml(this.termsUrl)}" target="_blank" rel="noopener noreferrer">Geschäftsbedingungen Entsorgungsleistungen</a>.
          </label>
          ${fieldError(this.state.errors, 'termsAccepted')}
        </div>

        <div class="honeypot" aria-hidden="true">
          <label for="website">Bitte dieses Feld NICHT ausfüllen</label>
          <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" value="${escapeHtml(this.state.website)}" />
        </div>
      </fieldset>
    `;
  }

  private renderActions(): string {
    return `
      <div class="actions">
        <div>
          ${this.state.step > 0 ? '<button type="button" class="secondary" data-action="back">Zurück</button>' : ''}
        </div>
        <div>
          ${
            this.state.step < 3
              ? '<button type="button" class="primary" data-action="next">Weiter</button>'
              : '<button type="button" class="primary" data-action="submit">Auftrag absenden</button>'
          }
        </div>
      </div>
    `;
  }

  private renderSuccess(): string {
    return `
      <div class="success">
        <strong>Vielen Dank!</strong> Ihre Angaben wurden erfasst. Das JSON wurde per Event <code>entsorgungsauftrag:submit</code> bereitgestellt.
      </div>
    `;
  }

  private bindEvents(): void {
    const root = this.shadowRoot!;
    root.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      this.setState({ step: this.state.step - 1, errors: {} });
    });

    root.querySelector('[data-action="next"]')?.addEventListener('click', () => {
      void this.handleNext();
    });

    root.querySelector('[data-action="submit"]')?.addEventListener('click', () => {
      void this.handleSubmit();
    });

    root.querySelector('[data-add-product]')?.addEventListener('click', () => {
      this.setState({
        products: [...this.state.products, emptyProduct()],
        wasteSearch: [...this.state.wasteSearch, ''],
        wasteListOpen: [...this.state.wasteListOpen, false],
      });
    });

    root.querySelectorAll('[data-remove-product]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number((button as HTMLElement).dataset.removeProduct);
        this.setState({
          products: this.state.products.filter((_, i) => i !== index),
          wasteSearch: this.state.wasteSearch.filter((_, i) => i !== index),
          wasteListOpen: this.state.wasteListOpen.filter((_, i) => i !== index),
        });
      });
    });

    root.querySelectorAll('input, textarea, select').forEach((element) => {
      element.addEventListener('input', (event) => this.handleInput(event));
      element.addEventListener('change', (event) => this.handleInput(event));
    });

    root.querySelectorAll('[data-waste-option]').forEach((element) => {
      element.addEventListener('click', () => {
        const index = Number((element as HTMLElement).dataset.wasteOption);
        const code = (element as HTMLElement).dataset.code ?? '';
        const wasteKey = findWasteKeyByCode(code);
        const products = [...this.state.products];
        products[index] = { ...products[index], wasteKeyNumber: code };
        const wasteSearch = [...this.state.wasteSearch];
        wasteSearch[index] = wasteKey ? formatWasteKeyOption(wasteKey) : code;
        const wasteListOpen = [...this.state.wasteListOpen];
        wasteListOpen[index] = false;
        this.setState({ products, wasteSearch, wasteListOpen });
      });
    });

    root.querySelectorAll('[data-waste-search]').forEach((element) => {
      element.addEventListener('focus', () => {
        const index = Number((element as HTMLElement).dataset.wasteSearch);
        const wasteListOpen = [...this.state.wasteListOpen];
        wasteListOpen[index] = true;
        this.setState({ wasteListOpen });
      });
    });
  }

  private handleOutsideClick = (event: Event): void => {
    if (!this.shadowRoot) return;
    const target = event.target as Node;
    if (this.shadowRoot.contains(target)) return;
    if (this.state.wasteListOpen.some(Boolean)) {
      this.setState({ wasteListOpen: this.state.wasteListOpen.map(() => false) });
    }
  };

  disconnectedCallback(): void {
    document.removeEventListener('click', this.handleOutsideClick, true);
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    const patch: Partial<FormState> = { errors: { ...this.state.errors } };

    const clearError = (key: string) => {
      delete patch.errors![key];
    };

    if (name === 'isExistingCustomer') {
      this.setState({ isExistingCustomer: value === 'true', errors: patch.errors });
      return;
    }

    if (name === 'reachableWith20mHose') {
      this.setState({ reachableWith20mHose: value === 'true', errors: patch.errors });
      return;
    }

    if (name === 'differentPickupAddress') {
      this.setState({ differentPickupAddress: (target as HTMLInputElement).checked });
      return;
    }

    if (name === 'privacyAccepted' || name === 'termsAccepted') {
      this.setState({
        [name]: (target as HTMLInputElement).checked,
        errors: patch.errors,
      } as Partial<FormState>);
      return;
    }

    if (name.startsWith('wasteSearch-')) {
      const index = Number(name.split('-')[1]);
      const wasteSearch = [...this.state.wasteSearch];
      wasteSearch[index] = value;
      const wasteListOpen = [...this.state.wasteListOpen];
      wasteListOpen[index] = true;
      const products = [...this.state.products];
      products[index] = { ...products[index], wasteKeyNumber: '' };
      clearError(`products.${index}.wasteKeyNumber`);
      this.setState({ wasteSearch, wasteListOpen, products, errors: patch.errors });
      return;
    }

    if (name.startsWith('quantityLiters-')) {
      const index = Number(name.split('-')[1]);
      const products = [...this.state.products];
      products[index] = { ...products[index], quantityLiters: value };
      clearError(`products.${index}.quantityLiters`);
      this.clearFieldErrorUi(target);
      this.syncState({ products, errors: patch.errors });
      return;
    }

    const fieldMap: Record<string, keyof FormState> = {
      companyName: 'companyName',
      vatId: 'vatId',
      customerNumber: 'customerNumber',
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      phone: 'phone',
      contactPerson: 'contactPerson',
      billingStreet: 'billingStreet',
      billingPostalCode: 'billingPostalCode',
      billingCity: 'billingCity',
      pickupStreet: 'pickupStreet',
      pickupPostalCode: 'pickupPostalCode',
      pickupCity: 'pickupCity',
      remarks: 'remarks',
      website: 'website',
    };

    if (fieldMap[name]) {
      clearError(name);
      this.clearFieldErrorUi(target);
      this.syncState({
        [fieldMap[name]]: type === 'checkbox' ? (target as HTMLInputElement).checked : value,
        errors: patch.errors,
      });
    }
  }

  private collectFormData(): EntsorgungsauftragDraft {
    const products = this.state.products.map((product) => ({
      wasteKeyNumber: product.wasteKeyNumber,
      quantityLiters: Number(product.quantityLiters),
    }));

    return {
      isExistingCustomer: this.state.isExistingCustomer ?? false,
      companyName: this.state.companyName,
      vatId: this.state.vatId,
      customerNumber: this.state.customerNumber,
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      email: this.state.email,
      phone: this.state.phone,
      contactPerson: this.state.contactPerson,
      billingAddress: {
        street: this.state.billingStreet,
        postalCode: this.state.billingPostalCode,
        city: this.state.billingCity,
        country: 'DE',
      },
      differentPickupAddress: this.state.differentPickupAddress,
      pickupAddress: this.state.differentPickupAddress
        ? {
            street: this.state.pickupStreet,
            postalCode: this.state.pickupPostalCode,
            city: this.state.pickupCity,
            country: 'DE',
          }
        : undefined,
      reachableWith20mHose: this.state.reachableWith20mHose ?? false,
      products,
      remarks: this.state.remarks,
      privacyAccepted: this.state.privacyAccepted,
      termsAccepted: this.state.termsAccepted,
    };
  }

  private async handleNext(): Promise<void> {
    const errors = await this.validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    this.setState({ step: this.state.step + 1, errors: {} });
  }

  private async validateCurrentStep(): Promise<Record<string, string>> {
    const data = this.collectFormData();

    if (this.state.step === 0) {
      if (this.state.isExistingCustomer === null) {
        return { isExistingCustomer: 'Bitte angeben, ob Sie Bestandskunde sind' };
      }

      const result = customerStepSchema.safeParse({
        ...data,
        isExistingCustomer: this.state.isExistingCustomer,
      });

      if (!result.success) {
        return formatZodErrors(result.error);
      }

      const vatResult = await this.vatValidator.validate(data.vatId ?? '', 'DE');
      if (!vatResult.valid) {
        return { vatId: vatResult.messages[0] ?? 'USt-IdNr. ungültig' };
      }

      return {};
    }

    if (this.state.step === 1) {
      const result = addressStepSchema.safeParse({
        billingAddress: data.billingAddress,
        differentPickupAddress: data.differentPickupAddress,
        pickupAddress: data.pickupAddress,
        reachableWith20mHose: data.reachableWith20mHose,
      });

      if (!result.success) {
        return formatZodErrors(result.error);
      }

      const billingValidation = await this.addressValidator.validate(data.billingAddress);
      if (!billingValidation.valid) {
        return { 'billingAddress.street': billingValidation.messages[0] ?? 'Rechnungsadresse ungültig' };
      }

      if (data.differentPickupAddress && data.pickupAddress) {
        const pickupValidation = await this.addressValidator.validate(data.pickupAddress);
        if (!pickupValidation.valid) {
          return { 'pickupAddress.street': pickupValidation.messages[0] ?? 'Abholadresse ungültig' };
        }
      }

      return {};
    }

    if (this.state.step === 2) {
      const result = productsStepSchema.safeParse({ products: data.products });
      if (!result.success) {
        return formatZodErrors(result.error);
      }
      return {};
    }

    return {};
  }

  private async handleSubmit(): Promise<void> {
    if (this.state.website.trim()) {
      return;
    }

    const stepErrors = await this.validateCurrentStep();
    const submitResult = submitStepSchema.safeParse({
      remarks: this.state.remarks,
      privacyAccepted: this.state.privacyAccepted,
      termsAccepted: this.state.termsAccepted,
      website: this.state.website,
    });

    const errors = {
      ...stepErrors,
      ...(submitResult.success ? {} : formatZodErrors(submitResult.error)),
    };

    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    const data = this.collectFormData();
    const wasteKeyLabels = Object.fromEntries(
      data.products.map((product) => {
        const wasteKey = findWasteKeyByCode(product.wasteKeyNumber);
        return [product.wasteKeyNumber, wasteKey ? formatWasteKeyOption(wasteKey) : product.wasteKeyNumber];
      }),
    );

    const payload = toPayload(
      { ...data, privacyAccepted: true, termsAccepted: true },
      this.locale,
      wasteKeyLabels,
    );

    this.dispatchEvent(
      new CustomEvent('entsorgungsauftrag:submit', {
        detail: payload,
        bubbles: true,
        composed: true,
      }),
    );

    this.setState({ submitted: true, errors: {} });
  }
}

if (!customElements.get('entsorgungsauftrag-form')) {
  customElements.define('entsorgungsauftrag-form', EntsorgungsauftragForm);
}
