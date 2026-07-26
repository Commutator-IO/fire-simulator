import { describe, expect, it } from 'vitest';
import {
  BORNES,
  DEFAUTS,
  borner,
  cotisationCapitalAnnuelle,
  estimationRente,
  niveauDe,
  patrimoineRequis,
  projeter,
  scenarios,
  scenariosPays,
  simuler,
  verdictDe,
  type Hypotheses,
} from './fire';
import { PAYS, pays, regimeParDefaut } from './pays';

/**
 * The values of the worked example in the specification, stated explicitly.
 *
 * They are no longer what the simulator starts on — the starting values now come
 * from the country of residence — and that is exactly why they are written out
 * here: the acceptance criterion is about those inputs, not about whatever the
 * defaults happen to be today.
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

describe('first-year figures', () => {
  // Acceptance criterion no. 1 of the specification.
  it('reproduces the worked example of the brief', () => {
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

  it('scales the income with the capital', () => {
    expect(sim({ patrimoine: 500_000 }).revenuNetAnnuel).toBeCloseTo(14_000, 6);
    expect(sim({ patrimoine: 2_000_000 }).revenuNetAnnuel).toBeCloseTo(56_000, 6);
  });

  it('leaves net income equal to the gross withdrawal when tax is nil', () => {
    const r = sim({ imposition: 0 });
    expect(r.impots).toBe(0);
    expect(r.revenuNetAnnuel).toBeCloseTo(r.retraitBrut, 6);
  });
});

describe('verdict', () => {
  // Acceptance criterion no. 2.
  it('reports the capital being eaten into, and by how much, as soon as Z > Y', () => {
    const r = sim({ retrait: 0.06 });
    expect(r.verdict).toBe('entame');
    expect(r.variationCapital).toBeCloseTo(-10_000, 6);
  });

  it('tells the borderline case Z = Y apart', () => {
    expect(sim({ retrait: 0.05 }).verdict).toBe('limite');
    expect(sim({ retrait: 0.05 }).variationCapital).toBeCloseTo(0, 6);
  });

  it('measures the margin in points, inflation included', () => {
    const r = sim();
    expect(r.marge).toBeCloseTo(0.01, 10);
    // 4% > 5% − 2%: preserved in euros, not in purchasing power.
    expect(r.margeReelle).toBeCloseTo(-0.01, 10);
    expect(r.preserveEnReel).toBe(false);
    expect(sim({ retrait: 0.02 }).preserveEnReel).toBe(true);
  });
});

// Section 8 of the specification: none of these cases may produce NaN,
// Infinity or an error.
describe('edge cases', () => {
  it('answers no without dividing by zero when there is no capital', () => {
    const r = sim({ patrimoine: 0 });
    expect(r.verdict).toBe('sans-patrimoine');
    expect(r.revenuNetAnnuel).toBe(0);
    expect(r.revenuNetMensuel).toBe(0);
    expect(r.variationCapital).toBe(0);
  });

  it('preserves the capital by definition when nothing is withdrawn', () => {
    const r = sim({ retrait: 0 });
    expect(r.verdict).toBe('preserve');
    expect(r.revenuNetAnnuel).toBe(0);
    expect(r.preserveEnReel).toBe(true);
  });

  it('accepts a negative return and flips the verdict as soon as anything is withdrawn', () => {
    expect(sim({ rendement: -0.05 }).verdict).toBe('entame');
    expect(sim({ rendement: -0.05, retrait: 0 }).verdict).toBe('preserve');
  });

  it('clamps out-of-bounds entries instead of passing them on', () => {
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

  it('brings an unknown country back to the default one', () => {
    // @ts-expect-error deliberately invalid key, of the kind the URL can supply
    expect(borner({ ...BASE, pays: 'atlantide' }).pays).toBe(DEFAUTS.pays);
    expect(borner({ ...BASE, pays: 'japon' }).pays).toBe('japon');
  });

  it('replaces a non-numeric value with the lower bound', () => {
    const h = borner({ ...BASE, patrimoine: Number.NaN, rendement: Number.POSITIVE_INFINITY });
    expect(h.patrimoine).toBe(0);
    expect(h.rendement).toBe(BORNES.rendement.min);
  });

  // Acceptance criterion no. 4.
  it('never produces NaN or Infinity, whatever the combination', () => {
    const valeurs = [0, 1, 100_000_000];
    for (const patrimoine of valeurs) {
      for (const rendement of [-0.1, 0, 0.2]) {
        for (const retrait of [0, 0.04, 0.2]) {
          for (const imposition of [0, 0.6]) {
            for (const inflation of [-0.02, 0.1]) {
              for (const anneesCotisees of [0, 30, 50]) {
                for (const salaireMoyen of [0, 60_000]) {
                  const h = {
                    ...BASE,
                    patrimoine,
                    rendement,
                    retrait,
                    imposition,
                    inflation,
                    anneesCotisees,
                    anneesAvantRetraite: 10,
                    salaireMoyen,
                    cotisationCapital: 0.065,
                  };
                  const nombres = [
                    ...Object.values(simuler(h)),
                    ...Object.values(estimationRente(h)),
                    ...projeter(h).annees.flatMap((a) => Object.values(a)),
                  ].filter((v) => typeof v === 'number');
                  expect(nombres.every(Number.isFinite)).toBe(true);
                }
              }
            }
          }
        }
      }
    }
  });
});

describe('a future pension', () => {
  it('is nothing until contributed years are given', () => {
    const e = estimationRente({ ...BASE, anneesCotisees: 0, salaireMoyen: 40_000 });
    expect(e.brutAnnuel).toBe(0);
    expect(e.netAnnuel).toBe(0);
  });

  it('prorates and applies a décote for missing quarters in France', () => {
    const e = estimationRente({
      ...BASE,
      pays: 'france',
      anneesCotisees: 27,
      anneesAvantRetraite: 14,
      salaireMoyen: 40_000,
    });
    // 27 of the 43 required years.
    expect(e.delai).toBe(14);
    expect(e.proratisation).toBeCloseTo(27 / 43, 6);
    // 16 years short is 64 quarters, but the décote is capped by the 12 quarters
    // to the full-rate age: 12 × 1.25 % = 15 %.
    expect(e.decote).toBeCloseTo(0.15, 6);
    expect(e.pleineBrute).toBeCloseTo(20_000, 6); // 50 % of the salary
    expect(e.brutAnnuel).toBeCloseTo(20_000 * (27 / 43) * 0.85, 4);
    expect(e.netAnnuel).toBeCloseTo(e.brutAnnuel * 0.9, 6);
  });

  it('reaches the full rate for a complete career', () => {
    const e = estimationRente({
      ...BASE,
      pays: 'france',
      anneesCotisees: 43,
      salaireMoyen: 40_000,
    });
    expect(e.proratisation).toBe(1);
    expect(e.decote).toBe(0);
    expect(e.brutAnnuel).toBeCloseTo(20_000, 6);
  });

  it('falls back to the country-average full pension without a salary', () => {
    const e = estimationRente({ ...BASE, pays: 'france', anneesCotisees: 30, salaireMoyen: 0 });
    expect(e.pleineBrute).toBe(pays('france').retraite.renteReferenceBrute);
  });

  it('applies no décote where the system has none (Japan)', () => {
    const e = estimationRente({
      ...BASE,
      pays: 'japon',
      anneesCotisees: 27,
      salaireMoyen: 40_000,
    });
    expect(e.decote).toBe(0);
    expect(e.proratisation).toBeCloseTo(27 / 40, 6);
  });

  it('pays nothing before the legal age, then the net pension after it', () => {
    const p = projeter({
      ...BASE,
      anneesCotisees: 30,
      anneesAvantRetraite: 14,
      salaireMoyen: 40_000,
    });
    expect(p.annees[13].rente).toBe(0); // year 14, still the gap
    expect(p.annees[14].rente).toBeGreaterThan(0); // year 15, pension started
  });

  it('spares the capital in indexed mode, pushing back depletion', () => {
    const base = { ...BASE, patrimoine: 250_000, retrait: 0.07, horizon: 60, imposition: 0.2 };
    const sans = projeter({ ...base, anneesCotisees: 0 });
    const avec = projeter({
      ...base,
      anneesCotisees: 22,
      anneesAvantRetraite: 19,
      salaireMoyen: 50_000,
    });
    expect(sans.anneeEpuisement).not.toBeNull();
    expect(avec.capitalFinal).toBeGreaterThanOrEqual(sans.capitalFinal);
    expect(avec.anneesTenues).toBeGreaterThan(sans.anneesTenues);
  });

  it('levies the health contribution only until the pension starts', () => {
    const h = {
      ...BASE,
      anneesCotisees: 30,
      anneesAvantRetraite: 5,
      salaireMoyen: 40_000,
      cotisationCapital: 0.065,
    };
    const p = projeter(h);
    expect(p.annees[0].csm).toBeGreaterThan(0); // still living off capital
    expect(p.annees[5].csm).toBe(0); // pension drawn, exempt
  });

  it('exempts capital income below the country allowance', () => {
    // A small return stays under the French abattement, so nothing is due.
    expect(cotisationCapitalAnnuelle(10_000, 0.065, 'france')).toBe(0);
    // Above it, only the excess is charged.
    expect(cotisationCapitalAnnuelle(33_550, 0.065, 'france')).toBeCloseTo(650, 6);
  });

  it('charges nothing when the rate is left at zero', () => {
    expect(cotisationCapitalAnnuelle(100_000, 0, 'france')).toBe(0);
    const p = projeter({ ...BASE, cotisationCapital: 0 });
    expect(p.annees.every((a) => a.csm === 0)).toBe(true);
  });

  it('counts an already-drawn pension in the first year, but not during the gap', () => {
    // Already at the legal age (no years before it) → counted in year one.
    expect(
      sim({ anneesCotisees: 43, anneesAvantRetraite: 0, salaireMoyen: 40_000 }).renteAnnuelle,
    ).toBeGreaterThan(0);
    // Still years away → the first year runs on capital alone.
    expect(
      sim({ anneesCotisees: 27, anneesAvantRetraite: 14, salaireMoyen: 40_000 }).renteAnnuelle,
    ).toBe(0);
  });
});

describe('projection', () => {
  it('credits the return before the withdrawal of the same year', () => {
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

  it('uprates the withdrawal with inflation in indexed mode', () => {
    const { annees } = projeter({ ...BASE, horizon: 3 });
    expect(annees[0].retraitBrut).toBeCloseTo(40_000, 6);
    expect(annees[1].retraitBrut).toBeCloseTo(40_800, 6);
    expect(annees[2].retraitBrut).toBeCloseTo(41_616, 6);
  });

  it('recomputes the withdrawal on the current capital in proportional mode', () => {
    const { annees } = projeter({
      ...BASE,
      modeRetrait: 'proportionnel',
      inflation: 0,
      horizon: 2,
    });
    expect(annees[0].retraitBrut).toBeCloseTo(1_050_000 * 0.04, 6);
    expect(annees[1].retraitBrut).toBeCloseTo(annees[1].capitalDebut * 1.05 * 0.04, 6);
  });

  it('restates capital and income in constant euros', () => {
    const { annees } = projeter({ ...BASE, horizon: 2 });
    expect(annees[0].capitalFinReel).toBeCloseTo(annees[0].capitalFin / 1.02, 6);
    expect(annees[1].capitalFinReel).toBeCloseTo(annees[1].capitalFin / 1.02 ** 2, 6);
    // The purchasing power of an indexed withdrawal is constant by construction.
    expect(annees[1].retraitNetReel).toBeCloseTo(annees[0].retraitNetReel, 6);
  });

  it('dates the depletion and stops the capital at zero', () => {
    const p = projeter({
      ...BASE,
      patrimoine: 200_000,
      rendement: 0,
      retrait: 0.2,
      inflation: 0,
      horizon: 10,
    });
    // €40,000 a year out of €200,000: the sixth year can no longer be served.
    expect(p.anneeEpuisement).toBe(6);
    expect(p.capitalFinal).toBe(0);
    expect(p.annees.every((a) => a.capitalFin >= 0)).toBe(true);
    expect(p.annees[5].retraitBrut).toBe(0);
  });

  it('never exhausts the capital in proportional mode', () => {
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

  it('produces as many rows as the horizon', () => {
    expect(projeter({ ...BASE, horizon: 12 }).annees).toHaveLength(12);
    expect(projeter({ ...BASE, horizon: 5 }).annees.at(-1)?.annee).toBe(5);
  });
});

describe('compared scenarios', () => {
  it('brackets the central scenario by ± 2 points', () => {
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

  it('announces the return actually used when the bound clips it', () => {
    const [pessimiste] = scenarios({ ...BASE, rendement: BORNES.rendement.min });
    expect(pessimiste.rendement).toBe(BORNES.rendement.min);
  });
});

describe('reverse calculation', () => {
  it('gives the capital needed to fund a way of life', () => {
    // €30,000 net at a 4% withdrawal and 30% tax.
    expect(patrimoineRequis(30_000, 0.04, 0.3)).toBeCloseTo(1_071_428.57, 2);
  });

  it('gives up when no finite capital will do', () => {
    expect(patrimoineRequis(30_000, 0, 0.3)).toBeNull();
    expect(patrimoineRequis(30_000, 0.04, 1)).toBeNull();
    expect(patrimoineRequis(0, 0.04, 0.3)).toBeNull();
  });

  it('closes the loop with the forward calculation', () => {
    const requis = patrimoineRequis(30_000, 0.04, 0.3);
    expect(requis).not.toBeNull();
    expect(sim({ patrimoine: requis!, depensesCibles: 30_000 }).revenuNetAnnuel).toBeCloseTo(
      30_000,
      6,
    );
  });
});

describe('comparison with target spending', () => {
  it('puts a figure on the gap once spending is entered', () => {
    expect(sim({ depensesCibles: 24_000 }).ecartDepenses).toBeCloseTo(4_000, 6);
    expect(sim({ depensesCibles: 36_000 }).ecartDepenses).toBeCloseTo(-8_000, 6);
  });

  it('compares nothing until spending has been entered', () => {
    expect(sim().ecartDepenses).toBeNull();
    expect(sim().patrimoineRequis).toBeNull();
  });
});

describe('verdictDe', () => {
  it('tests the cases in the expected order', () => {
    const h = (sur: Partial<Hypotheses>) => verdictDe({ ...BASE, ...sur });
    expect(h({ patrimoine: 0, retrait: 0 })).toBe('sans-patrimoine');
    expect(h({ retrait: 0 })).toBe('preserve');
    expect(h({ retrait: 0.04, rendement: 0.05 })).toBe('preserve');
    expect(h({ retrait: 0.05, rendement: 0.05 })).toBe('limite');
    expect(h({ retrait: 0.05, rendement: 0.04 })).toBe('entame');
  });
});

describe('how well the plan holds', () => {
  // A capital earning 0% from which €40,000 is taken out of €200,000 lasts
  // exactly five years, and breaks in the sixth.
  const court = (dureeExigee: number): Hypotheses => ({
    ...BASE,
    patrimoine: 200_000,
    rendement: 0,
    retrait: 0.2,
    inflation: 0,
    horizon: 20,
    dureeExigee,
  });

  const niveau = (h: Hypotheses) => niveauDe(h, projeter(h));

  it('stays green as long as nothing runs out', () => {
    expect(niveau({ ...BASE, retrait: 0.02, inflation: 0 })).toBe('preserve');
  });

  it('turns orange when depletion comes after the required duration', () => {
    // Five years served: a five-year requirement is met.
    expect(niveau(court(5))).toBe('suffisant');
  });

  it('turns red when depletion comes before it', () => {
    expect(niveau(court(6))).toBe('insuffisant');
    expect(niveau(court(10))).toBe('insuffisant');
  });

  it('counts the years served, not the year it breaks', () => {
    const p = projeter(court(5));
    expect(p.anneeEpuisement).toBe(6);
    expect(p.anneesTenues).toBe(5);
  });

  it('gives the whole horizon when nothing breaks', () => {
    const p = projeter({ ...BASE, retrait: 0.02, inflation: 0, horizon: 25 });
    expect(p.anneeEpuisement).toBeNull();
    expect(p.anneesTenues).toBe(25);
  });

  it('rules out an empty capital before anything else', () => {
    expect(niveau({ ...court(5), patrimoine: 0 })).toBe('sans-patrimoine');
  });

  it('never requires more years than the projection covers', () => {
    expect(borner({ ...BASE, horizon: 15, dureeExigee: 40 }).dureeExigee).toBe(15);
    expect(borner({ ...BASE, horizon: 40, dureeExigee: 3 }).dureeExigee).toBe(
      BORNES.dureeExigee.min,
    );
  });

  // The nominal verdict and the level do not say the same thing, and that is
  // the point: with inflation, an indexed withdrawal below the return still
  // exhausts the capital in the end.
  it('parts company with the nominal verdict', () => {
    const h: Hypotheses = {
      ...BASE,
      rendement: 0.05,
      retrait: 0.04,
      inflation: 0.02,
      horizon: 60,
      dureeExigee: 30,
    };
    expect(simuler(h).verdict).toBe('preserve');
    expect(projeter(h).anneeEpuisement).not.toBeNull();
    expect(niveau(h)).toBe('suffisant');
  });
});

describe('scenarios by country', () => {
  it('produces one trajectory per country', () => {
    const jeux = scenariosPays(BASE);
    expect(jeux.map((j) => j.pays)).toEqual(PAYS.map((p) => p.cle));
  });

  it('applies each country’s own starting values and account type', () => {
    for (const jeu of scenariosPays(BASE)) {
      const p = pays(jeu.pays);
      expect(jeu.hypotheses.retrait).toBeCloseTo(p.defauts.retrait, 10);
      expect(jeu.hypotheses.inflation).toBeCloseTo(p.defauts.inflation, 10);
      expect(jeu.hypotheses.imposition).toBeCloseTo(
        regimeParDefaut(jeu.pays).imposition,
        10,
      );
    }
  });

  // The return belongs to the portfolio, not to the country: a globally
  // diversified portfolio is the same wherever its owner lives.
  it('keeps whatever does not depend on where one lives', () => {
    const depart: Hypotheses = { ...BASE, patrimoine: 750_000, rendement: 0.07, horizon: 25 };
    for (const jeu of scenariosPays(depart)) {
      expect(jeu.hypotheses.patrimoine).toBe(750_000);
      expect(jeu.hypotheses.rendement).toBeCloseTo(0.07, 10);
      expect(jeu.hypotheses.horizon).toBe(25);
    }
  });

  it('separates the countries by withdrawal rate, not by tax', () => {
    const [france, japon] = scenariosPays(BASE);
    // Japan withdraws less, so its capital holds up better.
    expect(japon.projection.capitalFinal).toBeGreaterThan(france.projection.capitalFinal);
    // Tax, on the other hand, only shows up in the income.
    expect(japon.resultat.revenuNetAnnuel / japon.resultat.retraitBrut).toBeGreaterThan(
      france.resultat.revenuNetAnnuel / france.resultat.retraitBrut,
    );
  });
});
