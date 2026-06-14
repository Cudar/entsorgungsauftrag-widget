export type WasteKeyCategory = 'Altöl' | 'Emulsion';

export interface WasteKey {
  code: string;
  category: WasteKeyCategory;
  label: string;
}

export const WASTE_KEYS: WasteKey[] = [
  {
    code: '13 01 10',
    category: 'Altöl',
    label: 'nichtchlorierte Hydrauliköle auf Mineralölbasis',
  },
  {
    code: '13 02 05',
    category: 'Altöl',
    label: 'nichtchlorierte Maschinen-, Getriebe- und Schmieröle auf Mineralölbasis',
  },
  {
    code: '13 02 06',
    category: 'Altöl',
    label: 'synthetische Maschinen-, Getriebe- und Schmieröle',
  },
  {
    code: '13 02 08',
    category: 'Altöl',
    label: 'andere Maschinen-, Getriebe- und Schmieröle',
  },
  {
    code: '13 03 07',
    category: 'Altöl',
    label: 'nichtchlorierte Isolier- und Wärmeübertragungsöle auf Mineralölbasis',
  },
  {
    code: '12 01 09',
    category: 'Emulsion',
    label: 'halogenfreie Bearbeitungsemulsionen und -lösungen',
  },
  {
    code: '13 01 05',
    category: 'Emulsion',
    label: 'nichtchlorierte Emulsionen',
  },
  {
    code: '13 05 07',
    category: 'Emulsion',
    label: 'öliges Wasser aus Öl-/Wasserabscheidern',
  },
  {
    code: '13 08 02',
    category: 'Emulsion',
    label: 'andere Emulsionen',
  },
  {
    code: '16 07 08',
    category: 'Emulsion',
    label: 'ölhaltige Abfälle',
  },
];

export function formatWasteKeyOption(wasteKey: WasteKey): string {
  return `${wasteKey.category} - ${wasteKey.code} - ${wasteKey.label}`;
}

export function findWasteKeyByCode(code: string): WasteKey | undefined {
  return WASTE_KEYS.find((entry) => entry.code === code);
}
