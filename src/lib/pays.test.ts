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

describe('catalogue des régimes', () => {
  it('donne une clé unique à chaque régime', () => {
    const cles = TOUS_REGIMES.map((r) => r.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('reste dans les bornes de saisie de l’imposition', () => {
    for (const r of TOUS_REGIMES) {
      expect(r.imposition).toBeGreaterThanOrEqual(BORNES.imposition.min);
      expect(r.imposition).toBeLessThanOrEqual(BORNES.imposition.max);
    }
  });

  it('documente chaque régime : composition et réserve, dans chaque langue', () => {
    for (const r of TOUS_REGIMES) {
      for (const langue of LANGUES) {
        expect(r.composition[langue].length).toBeGreaterThan(20);
        expect(r.reserve[langue].length).toBeGreaterThan(20);
        expect(r.libelle[langue]).not.toBe('');
        expect(r.libelleCourt[langue]).not.toBe('');
      }
    }
  });

  it('traduit chaque pays et justifie ses valeurs de départ', () => {
    for (const p of PAYS) {
      for (const langue of LANGUES) {
        expect(p.libelle[langue]).not.toBe('');
        expect(p.justification[langue].length).toBeGreaterThan(40);
        expect(p.noteInflation[langue].length).toBeGreaterThan(10);
      }
    }
  });

  it('propose des valeurs de départ plausibles et propres à chaque pays', () => {
    for (const p of PAYS) {
      expect(p.defauts.retrait).toBeGreaterThan(0);
      expect(p.defauts.retrait).toBeLessThanOrEqual(BORNES.retrait.max);
      expect(p.defauts.rendement).toBeLessThanOrEqual(BORNES.rendement.max);
      expect(p.defauts.inflation).toBeLessThanOrEqual(BORNES.inflation.max);
    }
    // Le Japon est le contre-exemple de la règle des 4 % : son taux de départ
    // doit rester en dessous de celui retenu pour la France.
    expect(pays('japon').defauts.retrait).toBeLessThan(pays('france').defauts.retrait);
  });

  it('porte les taux attendus', () => {
    // Flat tax 2026 : 12,8 % d'IR + 18,6 % de prélèvements sociaux.
    expect(regime('fr-cto')?.imposition).toBeCloseTo(0.314, 10);
    // PEA après cinq ans : prélèvements sociaux seuls.
    expect(regime('fr-pea')?.imposition).toBeCloseTo(0.186, 10);
    // Assurance-vie après huit ans : 7,5 % + 17,2 %, taux non relevé en 2026.
    expect(regime('fr-av')?.imposition).toBeCloseTo(0.247, 10);
    // Japon : 15 % × 1,021 de surtaxe de reconstruction, plus 5 % de taxe locale.
    expect(regime('jp-tokutei')?.imposition).toBeCloseTo(0.15 * 1.021 + 0.05, 10);
    expect(regime('jp-nisa')?.imposition).toBe(0);
  });

  it('rattache chaque régime à son pays', () => {
    for (const p of PAYS) {
      for (const r of p.regimes) expect(r.pays).toBe(p.cle);
    }
  });
});

describe('recherche', () => {
  it('reconnaît les clés de pays valides', () => {
    expect(estClePays('france')).toBe(true);
    expect(estClePays('japon')).toBe(true);
    expect(estClePays('atlantide')).toBe(false);
    expect(estClePays(undefined)).toBe(false);
  });

  it('retombe sur le premier pays pour une clé inconnue', () => {
    // @ts-expect-error clé volontairement invalide
    expect(pays('atlantide').cle).toBe('france');
  });

  it('propose un régime par défaut par pays', () => {
    expect(regimeParDefaut('france').cle).toBe('fr-cto');
    expect(regimeParDefaut('japon').cle).toBe('jp-tokutei');
  });

  it('retrouve le régime correspondant à un taux', () => {
    expect(regimeCorrespondant('france', 0.314)?.cle).toBe('fr-cto');
    expect(regimeCorrespondant('japon', 0.20315)?.cle).toBe('jp-tokutei');
    expect(regimeCorrespondant('japon', 0)?.cle).toBe('jp-nisa');
  });

  it('ne cherche que dans le pays retenu', () => {
    // Le taux du PEA n'a pas de sens pour un résident japonais.
    expect(regimeCorrespondant('japon', 0.186)).toBeNull();
  });

  it('tolère l’arrondi d’un aller-retour par l’adresse', () => {
    expect(regimeCorrespondant('japon', 20.315 / 100)?.cle).toBe('jp-tokutei');
    expect(regimeCorrespondant('france', 31.4 / 100)?.cle).toBe('fr-cto');
  });

  it('ne reconnaît pas un taux librement saisi', () => {
    expect(regimeCorrespondant('france', 0.3)).toBeNull();
    expect(regimeCorrespondant('france', 0.32)).toBeNull();
  });
});

describe('effet sur la simulation', () => {
  // Retrait fixé à 4 % : les montants attendus ci-dessous se lisent alors
  // directement, sans dépendre du taux de départ retenu pour la France.
  const base = { ...DEFAUTS, patrimoine: 1_000_000, retrait: 0.04 };

  it('classe les enveloppes du revenu le plus faible au plus élevé', () => {
    const revenus = TOUS_REGIMES.map((r) => ({
      cle: r.cle,
      net: simuler({ ...base, imposition: r.imposition }).revenuNetAnnuel,
    }));
    const trie = [...revenus].sort((a, b) => a.net - b.net).map((x) => x.cle);
    expect(trie).toEqual(['fr-cto', 'fr-av', 'jp-tokutei', 'fr-pea', 'jp-nisa']);
  });

  it('chiffre l’écart entre la flat tax française et le NISA japonais', () => {
    const flatTax = simuler({ ...base, imposition: 0.314 }).revenuNetAnnuel;
    const nisa = simuler({ ...base, imposition: 0 }).revenuNetAnnuel;
    // 40 000 € de retrait brut : la flat tax en prélève 12 560 €.
    expect(nisa - flatTax).toBeCloseTo(12_560, 6);
  });
});
