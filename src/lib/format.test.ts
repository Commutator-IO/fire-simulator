import { describe, expect, it } from 'vitest';
import { formats } from './format';
import { LANGUES } from './i18n';

const fr = formats('fr');
const en = formats('en');

describe('amounts', () => {
  it('follows the conventions of each language', () => {
    // Non-breaking space and trailing symbol in French, leading symbol and
    // comma thousands separator in English.
    expect(fr.eur(500_000)).toMatch(/^500.000\s?€$/u);
    expect(en.eur(500_000)).toBe('€500,000');
  });

  it('rounds to the euro', () => {
    for (const langue of LANGUES) {
      expect(formats(langue).eur(1234.6)).toContain('1');
      expect(formats(langue).eur(1234.6)).not.toContain(',6');
    }
  });

  it('shortens large amounts into the reader’s own unit', () => {
    expect(fr.eurCompact(1_200_000)).toMatch(/1,2\s?M/u);
    expect(en.eurCompact(1_200_000)).toMatch(/1\.2m/u);
  });
});

describe('rates', () => {
  it('drops needless zeros and keeps the decimals that matter', () => {
    // Non-breaking space before the sign, as French typography wants it: the
    // percent sign must never wrap onto the next line by itself.
    expect(fr.tauxPct(0.314)).toBe('31,4\u00a0%');
    expect(fr.tauxPct(0.20315)).toBe('20,315\u00a0%');
    expect(fr.tauxPct(0)).toBe('0\u00a0%');
    // English closes the sign up against the number.
    expect(en.tauxPct(0.20315)).toBe('20.315%');
  });

  it('pads the decimals when a column has to line up', () => {
    expect(fr.pct(0.05, 1)).toMatch(/^5,0\s?%$/u);
    expect(en.pct(0.05, 1)).toBe('5.0%');
  });
});

describe('percentage points', () => {
  it('pluralises according to the language', () => {
    expect(fr.points(0.01)).toBe('1 point');
    expect(fr.points(0.03)).toBe('3 points');
    // French pluralises from two, English from anything that is not one.
    expect(fr.points(0.015)).toBe('1,5 point');
    expect(en.points(0.015)).toBe('1.5 points');
    expect(en.points(0.01)).toBe('1 point');
  });

  it('uses the real minus sign', () => {
    for (const langue of LANGUES) {
      expect(formats(langue).points(-0.01)).toContain('−');
      expect(formats(langue).points(-0.01)).not.toContain('-');
    }
  });
});

describe('robustness', () => {
  it('never lets NaN or Infinity through', () => {
    for (const langue of LANGUES) {
      const f = formats(langue);
      for (const rendu of [f.eur, f.num, f.eurCompact, f.tauxPct, f.points, f.eurSigne]) {
        for (const valeur of [Number.NaN, Number.POSITIVE_INFINITY, -Infinity]) {
          expect(rendu(valeur)).not.toMatch(/NaN|∞|Infinity/);
        }
      }
    }
  });

  it('returns the same object for a given language', () => {
    // Intl formatters are costly to build and act as a hook dependency: their
    // identity has to stay stable from one render to the next.
    expect(formats('fr')).toBe(fr);
  });

  it('exposes the expected decimal separator', () => {
    expect(fr.separateurDecimal).toBe(',');
    expect(en.separateurDecimal).toBe('.');
  });
});
