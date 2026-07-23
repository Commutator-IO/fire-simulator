import { describe, expect, it } from 'vitest';
import {
  BORNES,
  DEFAUTS,
  borner,
  patrimoineRequis,
  projeter,
  scenarios,
  simuler,
  type Hypotheses,
} from './fire';

/**
 * Invariants of the calculation engine.
 *
 * The other file pins down chosen examples — the worked example of the brief,
 * the edge cases of section 8. This one states what has to hold for *every*
 * input: the accounting identity of a year, the closed forms the two withdrawal
 * modes reduce to, what monotonically follows what. Those catch a class of
 * mistake a table of examples never does, because a wrong formula can happen to
 * agree on the three values someone thought to write down.
 */

const BASE: Hypotheses = { ...DEFAUTS, patrimoine: 500_000 };

const sur = (h: Partial<Hypotheses> = {}): Hypotheses => ({ ...BASE, ...h });

/** A spread of plans wide enough that an invariant has somewhere to fail. */
const GRILLE: Hypotheses[] = [];
for (const rendement of [-0.1, 0, 0.03, 0.07, 0.2]) {
  for (const retrait of [0, 0.02, 0.05, 0.12, 0.2]) {
    for (const inflation of [-0.02, 0, 0.02, 0.1]) {
      for (const modeRetrait of ['indexe', 'proportionnel'] as const) {
        GRILLE.push(sur({ rendement, retrait, inflation, modeRetrait, horizon: 25 }));
      }
    }
  }
}

// ---------------------------------------------------------------------------

describe('accounting identity of a year', () => {
  it('closes on every year of every plan', () => {
    for (const h of GRILLE) {
      for (const a of projeter(h).annees) {
        // What comes in, what goes out, what is left. If this ever fails, the
        // chart and the table are telling two different stories.
        expect(a.capitalFin).toBeCloseTo(a.capitalDebut + a.rendement - a.retraitBrut, 6);
      }
    }
  });

  it('carries the capital from one year to the next without loss', () => {
    for (const h of GRILLE) {
      const annees = projeter(h).annees;
      for (let i = 1; i < annees.length; i++) {
        expect(annees[i].capitalDebut).toBeCloseTo(annees[i - 1].capitalFin, 6);
      }
    }
  });

  it('splits every withdrawal into tax and net income', () => {
    for (const h of GRILLE) {
      for (const a of projeter(h).annees) {
        expect(a.impots).toBeCloseTo(a.retraitBrut * h.imposition, 6);
        expect(a.retraitNet).toBeCloseTo(a.retraitBrut - a.impots, 6);
      }
    }
  });

  it('never withdraws more than is there, nor lets the capital go negative', () => {
    for (const h of GRILLE) {
      for (const a of projeter(h).annees) {
        expect(a.retraitBrut).toBeGreaterThanOrEqual(0);
        expect(a.retraitBrut).toBeLessThanOrEqual(a.capitalDebut + a.rendement + 1e-6);
        expect(a.capitalFin).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('restates every year in year-zero euros with the same deflator', () => {
    for (const h of GRILLE) {
      for (const a of projeter(h).annees) {
        const deflateur = (1 + h.inflation) ** a.annee;
        expect(a.capitalFinReel).toBeCloseTo(a.capitalFin / deflateur, 6);
        expect(a.retraitNetReel).toBeCloseTo(a.retraitNet / deflateur, 6);
      }
    }
  });
});

describe('what the tax does, and does not, move', () => {
  // Stated in the interface because it is genuinely counter-intuitive, and
  // therefore worth locking down: what leaves the portfolio is the gross
  // withdrawal, so the tax rate cannot bend a capital curve. It is the reason
  // the country comparison has to differ by more than its tax rates.
  it('leaves the capital trajectory untouched', () => {
    const sansImpot = projeter(sur({ imposition: 0 })).annees.map((a) => a.capitalFin);
    const impotMaximal = projeter(sur({ imposition: BORNES.imposition.max })).annees.map(
      (a) => a.capitalFin,
    );
    expect(impotMaximal).toEqual(sansImpot);
  });

  it('takes its share of the income, and nothing else', () => {
    const brut = simuler(sur({ imposition: 0 }));
    const taxe = simuler(sur({ imposition: 0.25 }));
    expect(taxe.retraitBrut).toBeCloseTo(brut.retraitBrut, 6);
    expect(taxe.revenuNetAnnuel).toBeCloseTo(brut.revenuNetAnnuel * 0.75, 6);
  });
});

describe('monotonicity', () => {
  const capitalFinalPour = (h: Partial<Hypotheses>) => projeter(sur(h)).capitalFinal;

  it('leaves less capital the more is withdrawn', () => {
    let precedent = Number.POSITIVE_INFINITY;
    for (const retrait of [0, 0.02, 0.04, 0.06, 0.1, 0.2]) {
      const final = capitalFinalPour({ retrait });
      expect(final).toBeLessThanOrEqual(precedent + 1e-6);
      precedent = final;
    }
  });

  it('leaves more capital the more it earns', () => {
    let precedent = -1;
    for (const rendement of [-0.1, -0.02, 0, 0.05, 0.12, 0.2]) {
      const final = capitalFinalPour({ rendement });
      expect(final).toBeGreaterThanOrEqual(precedent - 1e-6);
      precedent = final;
    }
  });

  it('brings the depletion forward as the withdrawal grows', () => {
    const anneeDe = (retrait: number) =>
      projeter(sur({ retrait, rendement: 0, inflation: 0, horizon: 60 })).anneeEpuisement ??
      Number.POSITIVE_INFINITY;
    expect(anneeDe(0.05)).toBeGreaterThan(anneeDe(0.1));
    expect(anneeDe(0.1)).toBeGreaterThan(anneeDe(0.2));
  });

  it('orders the three compared scenarios at every year, not just at the end', () => {
    const [pessimiste, central, optimiste] = scenarios(sur({ horizon: 40 }));
    for (let i = 0; i < central.projection.annees.length; i++) {
      expect(pessimiste.projection.annees[i].capitalFin).toBeLessThanOrEqual(
        central.projection.annees[i].capitalFin + 1e-6,
      );
      expect(central.projection.annees[i].capitalFin).toBeLessThanOrEqual(
        optimiste.projection.annees[i].capitalFin + 1e-6,
      );
    }
  });
});

describe('closed forms the two modes reduce to', () => {
  it('decays geometrically in proportional mode', () => {
    const h = sur({
      modeRetrait: 'proportionnel',
      rendement: 0.05,
      retrait: 0.04,
      horizon: 15,
    });
    // Each year: capital × (1 + Y) × (1 − Z), the return being credited first.
    for (const a of projeter(h).annees) {
      expect(a.capitalFin).toBeCloseTo(h.patrimoine * (1.05 * 0.96) ** a.annee, 4);
    }
  });

  it('draws down in a straight line at a flat return and no inflation', () => {
    const h = sur({ modeRetrait: 'indexe', rendement: 0, inflation: 0, retrait: 0.04, horizon: 20 });
    for (const a of projeter(h).annees) {
      expect(a.capitalFin).toBeCloseTo(h.patrimoine * (1 - 0.04 * a.annee), 6);
    }
  });

  it('holds the capital exactly flat when the return matches the withdrawal', () => {
    const h = sur({ rendement: 0.04, retrait: 0.04, inflation: 0, horizon: 30 });
    for (const a of projeter(h).annees) {
      expect(a.capitalFin).toBeCloseTo(h.patrimoine, 6);
    }
  });

  it('shrinks the withdrawal year after year when prices fall', () => {
    const { annees } = projeter(sur({ inflation: -0.02, retrait: 0.04, horizon: 10 }));
    for (let i = 1; i < annees.length; i++) {
      expect(annees[i].retraitBrut).toBeLessThan(annees[i - 1].retraitBrut);
      // Deflation works the other way round on the restated figures.
      expect(annees[i].capitalFinReel).toBeGreaterThan(annees[i].capitalFin);
    }
  });
});

describe('the depletion year', () => {
  // €20,000 a year out of €100,000 at a flat return, uprated by 2% inflation:
  // four full years, then a fifth that can only serve what is left. Without the
  // inflation the capital would land on exactly zero, and the partial year —
  // the interesting one — would never happen.
  const h = sur({
    patrimoine: 100_000,
    rendement: 0,
    retrait: 0.2,
    inflation: 0.02,
    horizon: 10,
  });

  it('serves what remains rather than refusing the year outright', () => {
    const { annees } = projeter(h);
    const servi = annees.slice(0, 4).reduce((somme, a) => somme + a.retraitBrut, 0);
    const souhaite = 20_000 * 1.02 ** 4;

    expect(annees[4].retraitBrut).toBeCloseTo(100_000 - servi, 6);
    expect(annees[4].retraitBrut).toBeGreaterThan(0);
    expect(annees[4].retraitBrut).toBeLessThan(souhaite);
    expect(annees[4].capitalFin).toBeCloseTo(0, 6);
  });

  it('is the first year the plan cannot be honoured in full', () => {
    const p = projeter(h);
    expect(p.anneeEpuisement).toBe(5);
    expect(p.anneesTenues).toBe(4);
    // Nothing at all comes out afterwards.
    for (const a of p.annees.slice(5)) expect(a.retraitBrut).toBe(0);
  });

  it('counts one fewer year served than the year it breaks, always', () => {
    for (const h of GRILLE) {
      const p = projeter(h);
      expect(p.anneesTenues).toBe(
        p.anneeEpuisement === null ? borner(h).horizon : p.anneeEpuisement - 1,
      );
    }
  });
});

describe('agreement between the two entry points', () => {
  it('gives the first year the same figures as the projection, in indexed mode', () => {
    const h = sur({ retrait: 0.035, rendement: 0.05 });
    const r = simuler(h);
    const [premiere] = projeter(h).annees;
    expect(premiere.retraitBrut).toBeCloseTo(r.retraitBrut, 6);
    expect(premiere.impots).toBeCloseTo(r.impots, 6);
    expect(premiere.retraitNet).toBeCloseTo(r.revenuNetAnnuel, 6);
    expect(premiere.rendement).toBeCloseTo(r.rendementGenere, 6);
    expect(premiere.capitalFin - premiere.capitalDebut).toBeCloseTo(r.variationCapital, 6);
  });

  it('parts from it in proportional mode, the return being credited first', () => {
    const h = sur({ modeRetrait: 'proportionnel', retrait: 0.04, rendement: 0.05 });
    const [premiere] = projeter(h).annees;
    expect(premiere.retraitBrut).toBeCloseTo(simuler(h).retraitBrut * 1.05, 6);
  });
});

describe('reverse calculation', () => {
  it('inverts the forward calculation over a spread of plans', () => {
    for (const depenses of [12_000, 30_000, 120_000]) {
      for (const retrait of [0.02, 0.035, 0.05, 0.1]) {
        for (const imposition of [0, 0.186, 0.314, 0.6]) {
          const requis = patrimoineRequis(depenses, retrait, imposition);
          expect(requis).not.toBeNull();
          const r = simuler(sur({ patrimoine: requis!, retrait, imposition }));
          expect(r.revenuNetAnnuel).toBeCloseTo(depenses, 4);
        }
      }
    }
  });

  it('needs more capital the heavier the tax', () => {
    const requis = (imposition: number) => patrimoineRequis(30_000, 0.04, imposition)!;
    expect(requis(0.314)).toBeGreaterThan(requis(0.20315));
    expect(requis(0.20315)).toBeGreaterThan(requis(0));
  });
});

describe('bounding', () => {
  it('is idempotent', () => {
    const brut = sur({
      patrimoine: -50,
      rendement: 3,
      retrait: -1,
      imposition: 5,
      inflation: 9,
      horizon: 500,
      dureeExigee: 999,
    });
    const une = borner(brut);
    expect(borner(une)).toEqual(une);
  });

  it('raises a horizon below the floor instead of returning nothing', () => {
    const p = projeter(sur({ horizon: 1 }));
    expect(p.annees).toHaveLength(BORNES.horizon.min);
  });

  it('never lets the required duration outrun the horizon', () => {
    for (const horizon of [5, 12, 40, 60]) {
      const h = borner(sur({ horizon, dureeExigee: 60 }));
      expect(h.dureeExigee).toBeLessThanOrEqual(h.horizon);
    }
  });
});

describe('purity', () => {
  it('leaves its input untouched', () => {
    const h = sur({ retrait: 0.06, imposition: 0.42 });
    const copie = { ...h };
    simuler(h);
    projeter(h);
    scenarios(h);
    expect(h).toEqual(copie);
  });

  it('answers the same thing twice', () => {
    for (const h of GRILLE.slice(0, 20)) {
      expect(simuler(h)).toEqual(simuler(h));
      expect(projeter(h)).toEqual(projeter(h));
    }
  });
});

describe('purchasing power', () => {
  it('holds the net income flat in real terms in indexed mode', () => {
    const { annees } = projeter(sur({ retrait: 0.03, inflation: 0.02, horizon: 20 }));
    for (const a of annees) {
      expect(a.retraitNetReel).toBeCloseTo(annees[0].retraitNetReel, 4);
    }
  });

  it('preserves in real terms exactly on the Z = Y − i line', () => {
    expect(simuler(sur({ rendement: 0.05, inflation: 0.02, retrait: 0.03 })).preserveEnReel)
      .toBe(true);
    expect(simuler(sur({ rendement: 0.05, inflation: 0.02, retrait: 0.031 })).preserveEnReel)
      .toBe(false);
  });
});
