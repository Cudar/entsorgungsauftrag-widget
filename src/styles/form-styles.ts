export const formStyles = `
  :host {
    display: block;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #1a1a1a;
    --eaf-primary: #005a8c;
    --eaf-primary-hover: #004870;
    --eaf-border: #d0d7de;
    --eaf-error: #b42318;
    --eaf-bg-muted: #f6f8fa;
    --eaf-radius: 8px;
  }

  *, *::before, *::after { box-sizing: border-box; }

  .form-shell {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem;
    border: 1px solid var(--eaf-border);
    border-radius: var(--eaf-radius);
    background: #fff;
  }

  h2 {
    margin: 0 0 0.25rem;
    font-size: 1.5rem;
  }

  .subtitle {
    margin: 0 0 1.5rem;
    color: #57606a;
    font-size: 0.95rem;
  }

  .steps {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .step-indicator {
    flex: 1;
    min-width: 120px;
    padding: 0.5rem 0.75rem;
    border-radius: var(--eaf-radius);
    background: var(--eaf-bg-muted);
    font-size: 0.85rem;
    text-align: center;
    color: #57606a;
  }

  .step-indicator.active {
    background: var(--eaf-primary);
    color: #fff;
    font-weight: 600;
  }

  .step-indicator.done {
    background: #ddf4ff;
    color: var(--eaf-primary);
  }

  fieldset {
    border: none;
    margin: 0;
    padding: 0;
  }

  legend {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    padding: 0;
  }

  .field-grid {
    display: grid;
    gap: 1rem;
  }

  .field-grid.two-col {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 600px) {
    .field-grid.two-col {
      grid-template-columns: 1fr;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field label,
  .field .field-label {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .required::after {
    content: ' *';
    color: var(--eaf-error);
  }

  input[type='text'],
  input[type='email'],
  input[type='tel'],
  input[type='number'],
  textarea,
  select {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--eaf-border);
    border-radius: 6px;
    font: inherit;
    background: #fff;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: 2px solid #84caff;
    outline-offset: 0;
    border-color: var(--eaf-primary);
  }

  input[aria-invalid='true'],
  textarea[aria-invalid='true'],
  select[aria-invalid='true'] {
    border-color: var(--eaf-error);
  }

  .error {
    color: var(--eaf-error);
    font-size: 0.85rem;
  }

  .hint {
    color: #57606a;
    font-size: 0.85rem;
  }

  .radio-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .radio-group label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 400;
    cursor: pointer;
  }

  .checkbox-field label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-weight: 400;
    cursor: pointer;
  }

  .checkbox-field input {
    margin-top: 0.2rem;
  }

  .section-divider {
    margin: 1.5rem 0 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--eaf-border);
    font-weight: 600;
  }

  .product-block {
    padding: 1rem;
    border: 1px solid var(--eaf-border);
    border-radius: var(--eaf-radius);
    background: var(--eaf-bg-muted);
    margin-bottom: 1rem;
  }

  .product-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  .combobox {
    position: relative;
  }

  .combobox-list {
    position: absolute;
    z-index: 10;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 220px;
    overflow-y: auto;
    margin: 0;
    padding: 0.25rem 0;
    list-style: none;
    background: #fff;
    border: 1px solid var(--eaf-border);
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .combobox-list li {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
  }

  .combobox-list li:hover,
  .combobox-list li[aria-selected='true'] {
    background: #ddf4ff;
  }

  .combobox-list .category {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #57606a;
    text-transform: uppercase;
    cursor: default;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
  }

  button {
    font: inherit;
    cursor: pointer;
    border-radius: 6px;
    padding: 0.625rem 1.25rem;
    border: 1px solid transparent;
  }

  button.primary {
    background: var(--eaf-primary);
    color: #fff;
  }

  button.primary:hover {
    background: var(--eaf-primary-hover);
  }

  button.secondary {
    background: #fff;
    border-color: var(--eaf-border);
    color: #1a1a1a;
  }

  button.secondary:hover {
    background: var(--eaf-bg-muted);
  }

  button.link {
    background: none;
    border: none;
    color: var(--eaf-primary);
    padding: 0;
    text-decoration: underline;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .summary-block {
    padding: 1rem;
    background: var(--eaf-bg-muted);
    border-radius: var(--eaf-radius);
    margin-bottom: 1rem;
  }

  .summary-block h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
  }

  .summary-row {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
    font-size: 0.9rem;
  }

  .summary-row dt {
    color: #57606a;
    margin: 0;
  }

  .summary-row dd {
    margin: 0;
  }

  .honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .success {
    padding: 1rem;
    background: #ecfdf3;
    border: 1px solid #abefc6;
    border-radius: var(--eaf-radius);
    color: #067647;
  }
`;
