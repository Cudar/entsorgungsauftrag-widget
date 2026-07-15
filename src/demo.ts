import './index';

const output = document.getElementById('output');
const form = document.querySelector('entsorgungsauftrag-form');

form?.addEventListener('entsorgungsauftrag:submit', (event) => {
  output!.textContent = JSON.stringify((event as CustomEvent).detail, null, 2);
  output?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
