import { getTerm } from './extraction';
import { TERM_DEFINITIONS } from './terms';
import type { OfferRecord, TermKey } from '../types';

export interface ComparisonRow {
  key: TermKey;
  label: string;
  a: string;
  b: string;
  comparable: boolean;
}

function displayValue(offer: OfferRecord, key: TermKey): string {
  const term = getTerm(offer.terms, key);
  if (!term || term.rejected || term.status === 'unknown' || !term.value.trim()) {
    return 'Unknown — not established';
  }
  return term.value;
}

export function compareOffers(a: OfferRecord, b: OfferRecord): ComparisonRow[] {
  if (a.id === b.id) throw new Error('Choose two different offers to compare.');
  return TERM_DEFINITIONS.map(({ key, label }) => {
    const valueA = displayValue(a, key);
    const valueB = displayValue(b, key);
    return {
      key,
      label,
      a: valueA,
      b: valueB,
      comparable: !valueA.startsWith('Unknown') && !valueB.startsWith('Unknown'),
    };
  });
}
