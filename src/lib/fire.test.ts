import { describe, expect, it } from 'vitest';
import {
  BORNES,
  DEFAUTS,
  borner,
  patrimoineRequis,
  projeter,
  scenarios,
  simuler,
  verdictDe,
  type Hypotheses,
} from './fire';

/**
 * Les valeurs de l'exemple chiffré de la spécification, posées explicitement.
 *
 * Elles ne sont plus celles du simulateur au démarrage — les valeurs de départ
 * viennent désormais du pays de résidence — et c'est précisément pour cela
 * qu'elles sont écrites ici : le critère d'acceptation porte sur ces entrées-là,
 * pas sur les valeurs par défaut du jour.
 */
const BASE: Hypotheses = {
  ...DEFAUTS,
  patrimoine: 1_000_000,
  rendement: 0.05,
  retrait: 0.04,
  imposition: 0.3,
};

const sim = (sur: Partial<Hypotheses> = {}) => simuler({ ...BASE, ...sur });

// ---------------------------------------------------------------------------

describe('calculs de la première année', () => {
  // Critère d'acceptation nº 1 de la spécification.
  it("reproduit l'exemple chiffré du brief", () => {
    const r = sim();
    expect(r.retraitBrut).toBeCloseTo(40_000, 6);
    expect(r.impots).toBeCloseTo(12_000, 6);
    expect(r.revenuNetAnnuel).toBeCloseTo(28_000, 6);
    expect(r.revenuNetMensuel).toBeCloseTo(2_333.33, 2);
    expect(r.rendementGenere).toBeCloseTo(50_000, 6);
    expect(r.variationCapital).toBeCloseTo(10_000, 6);
    expect(r.verdict).toBe('preserve');
    expect(r.marge).toBeCloseTo(0.01, 10);
  });

  it('proportionne le revenu au patrimoine', () => {
    expect(sim({ patrimoine: 500_000 }).revenuNetAnnuel).toBeCloseTo(14_000, 6);
    expect(sim({ patrimoine: 2_000_000 }).revenuNetAnnuel).toBeCloseTo(56_000, 6);
  });

  it("laisse le revenu net égal au retrait brut quand l'imposition est nulle", () => {
    const r = sim({ imposition: 0 });
    expect(r.impots).toBe(0);
    expect(r.revenuNetAnnuel).toBeCloseTo(r.retraitBrut, 6);
  });
});

describe('verdict', () => {
  // Critère d'acceptation nº 2.
  it('signale le capital entamé et son montant dès que Z > Y', () => {
    const r = sim({ retrait: 0.06 });
    expect(r.verdict).toBe('entame');
    expect(r.variationCapital).toBeCloseTo(-10_000, 6);
  });

  it('distingue le cas limite Z = Y', () => {
    expect(sim({ retrait: 0.05 }).verdict).toBe('limite');
    expect(sim({ retrait: 0.05 }).variationCapital).toBeCloseTo(0, 6);
  });

  it('mesure la marge en points, inflation comprise', () => {
    const r = sim();
    expect(r.marge).toBeCloseTo(0.01, 10);
    // 4 % > 5 % − 2 % : préservé en euros, pas en pouvoir d'achat.
    expect(r.margeReelle).toBeCloseTo(-0.01, 10);
    expect(r.preserveEnReel).toBe(false);
    expect(sim({ retrait: 0.02 }).preserveEnReel).toBe(true);
  });
});

// Section 8 de la spécification : aucun de ces cas ne doit produire NaN,
// Infinity ni erreur.
describe('cas limites', () => {
  it('sans patrimoine, répond « non » sans diviser par zéro', () => {
    const r = sim({ patrimoine: 0 });
    expect(r.verdict).toBe('sans-patrimoine');
    expect(r.revenuNetAnnuel).toBe(0);
    expect(r.revenuNetMensuel).toBe(0);
    expect(r.variationCapital).toBe(0);
  });

  it('sans retrait, préserve le capital par définition', () => {
    const r = sim({ retrait: 0 });
    expect(r.verdict).toBe('preserve');
    expect(r.revenuNetAnnuel).toBe(0);
    expect(r.preserveEnReel).toBe(true);
  });

  it('accepte un rendement négatif et bascule le verdict dès qu’on retire', () => {
    expect(sim({ rendement: -0.05 }).verdict).toBe('entame');
    expect(sim({ rendement: -0.05, retrait: 0 }).verdict).toBe('preserve');
  });

  it('borne les saisies hors limites au lieu de propager la valeur', () => {
    const h = borner({
      ...BASE,
      patrimoine: -1,
      rendement: 5,
      retrait: -3,
      imposition: 0.9,
      inflation: 1,
      horizon: 500,
    });
    expect(h.patrimoine).toBe(BORNES.patrimoine.min);
    expect(h.rendement).toBe(BORNES.rendement.max);
    expect(h.retrait).toBe(BORNES.retrait.min);
    expect(h.imposition).toBe(BORNES.imposition.max);
    expect(h.inflation).toBe(BORNES.inflation.max);
    expect(h.horizon).toBe(BORNES.horizon.max);
  });

  it('ramène un pays inconnu au pays par défaut', () => {
    // @ts-expect-error clé volontairement invalide, comme peut en fournir l'URL
    expect(borner({ ...BASE, pays: 'atlantide' }).pays).toBe(DEFAUTS.pays);
    expect(borner({ ...BASE, pays: 'japon' }).pays).toBe('japon');
  });

  it('remplace une valeur non numérique par la borne basse', () => {
    const h = borner({ ...BASE, patrimoine: Number.NaN, rendement: Number.POSITIVE_INFINITY });
    expect(h.patrimoine).toBe(0);
    expect(h.rendement).toBe(BORNES.rendement.min);
  });

  // Critère d'acceptation nº 4.
  it('ne produit jamais NaN ni Infinity, quelles que soient les combinaisons', () => {
    const valeurs = [0, 1, 100_000_000];
    for (const patrimoine of valeurs) {
      for (const rendement of [-0.1, 0, 0.2]) {
        for (const retrait of [0, 0.04, 0.2]) {
          for (const imposition of [0, 0.6]) {
            for (const inflation of [-0.02, 0.1]) {
              const h = { ...BASE, patrimoine, rendement, retrait, imposition, inflation };
              const nombres = [
                ...Object.values(simuler(h)),
                ...projeter(h).annees.flatMap((a) => Object.values(a)),
              ].filter((v) => typeof v === 'number');
              expect(nombres.every(Number.isFinite)).toBe(true);
            }
          }
        }
      }
    }
  });
});

describe('projection', () => {
  it('applique le rendement avant le retrait de la même année', () => {
    const [premiere] = projeter({
      ...BASE,
      inflation: 0,
      horizon: 5,
    }).annees;
    expect(premiere.capitalDebut).toBe(1_000_000);
    expect(premiere.rendement).toBeCloseTo(50_000, 6);
    expect(premiere.retraitBrut).toBeCloseTo(40_000, 6);
    expect(premiere.capitalFin).toBeCloseTo(1_010_000, 6);
  });

  it('revalorise le retrait de l’inflation en mode indexé', () => {
    const { annees } = projeter({ ...BASE, horizon: 3 });
    expect(annees[0].retraitBrut).toBeCloseTo(40_000, 6);
    expect(annees[1].retraitBrut).toBeCloseTo(40_800, 6);
    expect(annees[2].retraitBrut).toBeCloseTo(41_616, 6);
  });

  it('recalcule le retrait sur le capital courant en mode proportionnel', () => {
    const { annees } = projeter({
      ...BASE,
      modeRetrait: 'proportionnel',
      inflation: 0,
      horizon: 2,
    });
    expect(annees[0].retraitBrut).toBeCloseTo(1_050_000 * 0.04, 6);
    expect(annees[1].retraitBrut).toBeCloseTo(annees[1].capitalDebut * 1.05 * 0.04, 6);
  });

  it('déflate le capital et le revenu en euros constants', () => {
    const { annees } = projeter({ ...BASE, horizon: 2 });
    expect(annees[0].capitalFinReel).toBeCloseTo(annees[0].capitalFin / 1.02, 6);
    expect(annees[1].capitalFinReel).toBeCloseTo(annees[1].capitalFin / 1.02 ** 2, 6);
    // Le pouvoir d'achat du retrait indexé est constant par construction.
    expect(annees[1].retraitNetReel).toBeCloseTo(annees[0].retraitNetReel, 6);
  });

  it('date l’épuisement et arrête le capital à zéro', () => {
    const p = projeter({
      ...BASE,
      patrimoine: 200_000,
      rendement: 0,
      retrait: 0.2,
      inflation: 0,
      horizon: 10,
    });
    // 40 000 € par an sur 200 000 € : la sixième année ne peut plus être servie.
    expect(p.anneeEpuisement).toBe(6);
    expect(p.capitalFinal).toBe(0);
    expect(p.annees.every((a) => a.capitalFin >= 0)).toBe(true);
    expect(p.annees[5].retraitBrut).toBe(0);
  });

  it('n’épuise jamais le capital en mode proportionnel', () => {
    const p = projeter({
      ...BASE,
      rendement: -0.1,
      retrait: 0.2,
      modeRetrait: 'proportionnel',
      horizon: 60,
    });
    expect(p.anneeEpuisement).toBeNull();
    expect(p.capitalFinal).toBeGreaterThan(0);
  });

  it('produit autant de lignes que l’horizon', () => {
    expect(projeter({ ...BASE, horizon: 12 }).annees).toHaveLength(12);
    expect(projeter({ ...BASE, horizon: 5 }).annees.at(-1)?.annee).toBe(5);
  });
});

describe('scénarios comparés', () => {
  it('encadre le scénario central de ± 2 points', () => {
    const [pessimiste, central, optimiste] = scenarios(BASE);
    expect(pessimiste.rendement).toBeCloseTo(0.03, 10);
    expect(central.rendement).toBeCloseTo(0.05, 10);
    expect(optimiste.rendement).toBeCloseTo(0.07, 10);
    expect(pessimiste.projection.capitalFinal).toBeLessThan(
      central.projection.capitalFinal,
    );
    expect(optimiste.projection.capitalFinal).toBeGreaterThan(
      central.projection.capitalFinal,
    );
  });

  it('annonce le rendement réellement utilisé quand la borne écrête', () => {
    const [pessimiste] = scenarios({ ...BASE, rendement: BORNES.rendement.min });
    expect(pessimiste.rendement).toBe(BORNES.rendement.min);
  });
});

describe('calcul inverse', () => {
  it('donne le patrimoine nécessaire pour financer un train de vie', () => {
    // 30 000 € nets à 4 % de retrait et 30 % d'impôts.
    expect(patrimoineRequis(30_000, 0.04, 0.3)).toBeCloseTo(1_071_428.57, 2);
  });

  it('renonce quand aucun patrimoine fini ne convient', () => {
    expect(patrimoineRequis(30_000, 0, 0.3)).toBeNull();
    expect(patrimoineRequis(30_000, 0.04, 1)).toBeNull();
    expect(patrimoineRequis(0, 0.04, 0.3)).toBeNull();
  });

  it('boucle avec le calcul direct', () => {
    const requis = patrimoineRequis(30_000, 0.04, 0.3);
    expect(requis).not.toBeNull();
    expect(sim({ patrimoine: requis!, depensesCibles: 30_000 }).revenuNetAnnuel).toBeCloseTo(
      30_000,
      6,
    );
  });
});

describe('comparaison au train de vie', () => {
  it('chiffre l’écart quand les dépenses sont renseignées', () => {
    expect(sim({ depensesCibles: 24_000 }).ecartDepenses).toBeCloseTo(4_000, 6);
    expect(sim({ depensesCibles: 36_000 }).ecartDepenses).toBeCloseTo(-8_000, 6);
  });

  it('ne compare rien tant que les dépenses ne sont pas saisies', () => {
    expect(sim().ecartDepenses).toBeNull();
    expect(sim().patrimoineRequis).toBeNull();
  });
});

describe('verdictDe', () => {
  it('range les cas dans l’ordre attendu', () => {
    const h = (sur: Partial<Hypotheses>) => verdictDe({ ...BASE, ...sur });
    expect(h({ patrimoine: 0, retrait: 0 })).toBe('sans-patrimoine');
    expect(h({ retrait: 0 })).toBe('preserve');
    expect(h({ retrait: 0.04, rendement: 0.05 })).toBe('preserve');
    expect(h({ retrait: 0.05, rendement: 0.05 })).toBe('limite');
    expect(h({ retrait: 0.05, rendement: 0.04 })).toBe('entame');
  });
});
