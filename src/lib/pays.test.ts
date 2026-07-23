import { describe, expect, it } from 'vitest';
import {
  PAYS,
  TOUS_REGIMES,
  estClePays,
  pays,
  regime,
  regimeCorrespondant,
  regimeParDefaut,
} from './pays';
import { BORNES, DEFAUTS, simuler } from './fire';
import { LANGUES } from './i18n';

describe('catalogue of tax regimes', () => {
  it('gives every regime a unique key', () => {
    const cles = TOUS_REGIMES.map((r) => r.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('stays within the bounds of the tax field', () => {
    for (const r of TOUS_REGIMES) {
      expect(r.imposition).toBeGreaterThanOrEqual(BORNES.imposition.min);
      expect(r.imposition).toBeLessThanOrEqual(BORNES.imposition.max);
    }
  });

  it('documents every regime — composition and caveat — in each language', () => {
    for (const r of TOUS_REGIMES) {
      for (const langue of LANGUES) {
        expect(r.composition[langue].length).toBeGreaterThan(20);
        expect(r.reserve[langue].length).toBeGreaterThan(20);
        expect(r.libelle[langue]).not.toBe('');
        expect(r.libelleCourt[langue]).not.toBe('');
      }
    }
  });

  it('translates every country and justifies its starting values', () => {
    for (const p of PAYS) {
      for (const langue of LANGUES) {
        expect(p.libelle[langue]).not.toBe('');
        expect(p.justification[langue].length).toBeGreaterThan(40);
        expect(p.noteInflation[langue].length).toBeGreaterThan(10);
      }
    }
  });

  it('offers starting values that are plausible and specific to each country', () => {
    for (const p of PAYS) {
      expect(p.defauts.retrait).toBeGreaterThan(0);
      expect(p.defauts.retrait).toBeLessThanOrEqual(BORNES.retrait.max);
      expect(p.defauts.rendement).toBeLessThanOrEqual(BORNES.rendement.max);
      expect(p.defauts.inflation).toBeLessThanOrEqual(BORNES.inflation.max);
    }
    // Japan is the counter-example to the 4% rule: its starting rate has to
    // stay below the one chosen for France.
    expect(pays('japon').defauts.retrait).toBeLessThan(pays('france').defauts.retrait);
  });

  it('carries the expected rates', () => {
    // 2026 flat tax: 12.8% income tax + 18.6% social levies.
    expect(regime('fr-cto')?.imposition).toBeCloseTo(0.314, 10);
    // PEA after five years: social levies only.
    expect(regime('fr-pea')?.imposition).toBeCloseTo(0.186, 10);
    // Life insurance after eight years: 7.5% + 17.2%, not raised in 2026.
    expect(regime('fr-av')?.imposition).toBeCloseTo(0.247, 10);
    // Japan: 15% × the 1.021 reconstruction surtax, plus 5% local tax.
    expect(regime('jp-tokutei')?.imposition).toBeCloseTo(0.15 * 1.021 + 0.05, 10);
    expect(regime('jp-nisa')?.imposition).toBe(0);
  });

  it('ties every regime to its country', () => {
    for (const p of PAYS) {
      for (const r of p.regimes) expect(r.pays).toBe(p.cle);
    }
  });
});

describe('lookup', () => {
  it('recognises valid country keys', () => {
    expect(estClePays('france')).toBe(true);
    expect(estClePays('japon')).toBe(true);
    expect(estClePays('atlantide')).toBe(false);
    expect(estClePays(undefined)).toBe(false);
  });

  it('falls back to the first country for an unknown key', () => {
    // @ts-expect-error deliberately invalid key
    expect(pays('atlantide').cle).toBe('france');
  });

  it('offers a default regime per country', () => {
    expect(regimeParDefaut('france').cle).toBe('fr-cto');
    expect(regimeParDefaut('japon').cle).toBe('jp-tokutei');
  });

  it('finds the regime matching a rate', () => {
    expect(regimeCorrespondant('france', 0.314)?.cle).toBe('fr-cto');
    expect(regimeCorrespondant('japon', 0.20315)?.cle).toBe('jp-tokutei');
    expect(regimeCorrespondant('japon', 0)?.cle).toBe('jp-nisa');
  });

  it('searches only within the country in force', () => {
    // The PEA rate means nothing to a Japanese resident.
    expect(regimeCorrespondant('japon', 0.186)).toBeNull();
  });

  it('tolerates the rounding of a round trip through the URL', () => {
    expect(regimeCorrespondant('japon', 20.315 / 100)?.cle).toBe('jp-tokutei');
    expect(regimeCorrespondant('france', 31.4 / 100)?.cle).toBe('fr-cto');
  });

  it('does not recognise a freely typed rate', () => {
    expect(regimeCorrespondant('france', 0.3)).toBeNull();
    expect(regimeCorrespondant('france', 0.32)).toBeNull();
  });
});

describe('effect on the simulation', () => {
  // Withdrawal pinned at 4%: the amounts expected below then read directly,
  // without depending on the starting rate chosen for France.
  const base = { ...DEFAUTS, patrimoine: 1_000_000, retrait: 0.04 };

  it('ranks the regimes from the lowest income to the highest', () => {
    const revenus = TOUS_REGIMES.map((r) => ({
      cle: r.cle,
      net: simuler({ ...base, imposition: r.imposition }).revenuNetAnnuel,
    }));
    const trie = [...revenus].sort((a, b) => a.net - b.net).map((x) => x.cle);
    expect(trie).toEqual(['fr-cto', 'fr-av', 'jp-tokutei', 'fr-pea', 'jp-nisa']);
  });

  it('puts a figure on the gap between the French flat tax and the Japanese NISA', () => {
    const flatTax = simuler({ ...base, imposition: 0.314 }).revenuNetAnnuel;
    const nisa = simuler({ ...base, imposition: 0 }).revenuNetAnnuel;
    // €40,000 of gross withdrawal: the flat tax takes €12,560 of it.
    expect(nisa - flatTax).toBeCloseTo(12_560, 6);
  });
});
