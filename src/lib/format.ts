import { ETIQUETTES_LANGUES, type Langue } from './i18n';

/**
 * Number formatting, bound to the interface language.
 *
 * Amounts stay in euros whatever the language — the simulator compares tax
 * regimes, not currencies — but everything else about how a figure is written
 * moves: the thousands separator, the position of the currency sign, the space
 * before a percent sign, and the unit a large amount is shortened to.
 *
 * Every formatter is built once per language and reused, both because building
 * an `Intl.NumberFormat` is not free and because a stable object lets the hook
 * that exposes it stay dependency-friendly.
 */

export type Formats = {
  /** BCP 47 tag, for the rare spot that needs to format something itself. */
  etiquette: string;
  /** "," in French, "." in English. */
  separateurDecimal: string;
  /** Whole euros, rounded. */
  eur: (v: number) => string;
  /** A plain number, no unit. */
  num: (v: number) => string;
  /** Shortened amount for chart axes. */
  eurCompact: (v: number) => string;
  /** A rate, padded to a fixed number of decimals so columns line up. */
  pct: (v: number, decimales?: number) => string;
  /** A tax rate, without trailing zeros: "31,4 %", "20,315 %", "0 %". */
  tauxPct: (v: number) => string;
  /** A gap between two rates, in percentage points. */
  points: (v: number) => string;
  /** Signed amount, with the typographic minus. */
  eurSigne: (v: number) => string;
};

const fini = (v: number) => (Number.isFinite(v) ? v : 0);

function construire(langue: Langue): Formats {
  const etiquette = ETIQUETTES_LANGUES[langue];
  const devise: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR' };

  const euro = new Intl.NumberFormat(etiquette, {
    ...devise,
    maximumFractionDigits: 0,
  });
  const nombre = new Intl.NumberFormat(etiquette, { maximumFractionDigits: 0 });
  // Compact notation already knows that French shortens to k and M and English
  // to k and m — no need to reinvent any of it.
  const compact = new Intl.NumberFormat(etiquette, {
    ...devise,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const troisDecimales = new Intl.NumberFormat(etiquette, { maximumFractionDigits: 3 });

  const eur = (v: number) => euro.format(Math.round(fini(v)));

  const points = (v: number) => {
    const valeur = fini(v) * 100;
    const rendu = troisDecimales
      .format(valeur)
      // The hyphen-minus is a typographic accident in a figure; everything
      // else on the page uses the real minus sign.
      .replace('-', '−');
    // French pluralises from two, English from anything that is not one.
    const pluriel = langue === 'fr' ? Math.abs(valeur) >= 2 : Math.abs(valeur) !== 1;
    return `${rendu} point${pluriel ? 's' : ''}`;
  };

  return {
    etiquette,
    separateurDecimal:
      troisDecimales.formatToParts(1.1).find((p) => p.type === 'decimal')?.value ?? '.',
    eur,
    num: (v) => nombre.format(fini(v)),
    eurCompact: (v) => compact.format(Math.round(fini(v))),
    pct: (v, decimales = 1) =>
      new Intl.NumberFormat(etiquette, {
        style: 'percent',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      }).format(fini(v)),
    // French puts a space before the sign, English does not.
    tauxPct: (v) =>
      `${troisDecimales.format(fini(v) * 100)}${langue === 'fr' ? ' %' : '%'}`,
    points,
    eurSigne: (v) => `${v < 0 ? '−' : '+'} ${eur(Math.abs(v))}`,
  };
}

const memoire = new Map<Langue, Formats>();

export function formats(langue: Langue): Formats {
  const connu = memoire.get(langue);
  if (connu) return connu;
  const construits = construire(langue);
  memoire.set(langue, construits);
  return construits;
}
