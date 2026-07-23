import {
  PAYS_PAR_DEFAUT,
  estClePays,
  pays,
  regimeParDefaut,
  type ClePays,
} from './pays';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * How the yearly withdrawal is decided.
 *
 * The two modes answer the same question differently, and the gap between them
 * is the whole point of the simulator:
 *
 *  - `indexe` — the classic "4 % rule": the first year's amount is fixed, then
 *    revalued by inflation. Purchasing power is constant, but a bad sequence of
 *    returns can exhaust the capital, hence a possible depletion year.
 *  - `proportionnel` — a constant *share* of whatever the capital is worth that
 *    year. The capital can never reach zero, but income falls with the markets.
 */
export type ModeRetrait = 'indexe' | 'proportionnel';

export type Hypotheses = {
  /** X — net financial assets already accumulated, in euros. */
  patrimoine: number;
  /** Y — expected average annual return, as a fraction (0.05 = 5 %). */
  rendement: number;
  /** Z — annual withdrawal rate, as a fraction (0.04 = the 4 % rule). */
  retrait: number;
  /** α — tax and social levies applied to the amounts withdrawn, as a fraction. */
  imposition: number;
  /**
   * D — target yearly spending, net of tax. 0 means "not filled in": the
   * lifestyle comparison is then hidden rather than compared against zero.
   */
  depensesCibles: number;
  /** i — annual inflation, as a fraction. */
  inflation: number;
  /** N — projection horizon, in years. */
  horizon: number;
  modeRetrait: ModeRetrait;
  /**
   * Country of residence. It changes nothing in the arithmetic — the tax
   * regimes it offers set α, and α is all the engine ever sees. It is carried
   * here so that a shared link reopens on the right country, and so the
   * comparison across countries has a "you are here".
   */
  pays: ClePays;
};

/**
 * Answer to the central question, in the order the cases are tested.
 *
 * `limite` is deliberately split from `preserve`: at Z = Y the capital holds in
 * euros but has no margin at all, and saying so is more useful than a green
 * banner.
 */
export type Verdict = 'sans-patrimoine' | 'preserve' | 'limite' | 'entame';

export type Resultat = {
  /** R — gross yearly withdrawal, X × Z. */
  retraitBrut: number;
  /** T — tax on the withdrawal, R × α. */
  impots: number;
  /** Rnet — net yearly income. */
  revenuNetAnnuel: number;
  revenuNetMensuel: number;
  /** G — return generated over the year, X × Y. */
  rendementGenere: number;
  /** ΔX — capital drift over the first year, X × (Y − Z). */
  variationCapital: number;
  verdict: Verdict;
  /** Y − Z, in fraction points. Negative when the capital is being eaten into. */
  marge: number;
  /** Y − i − Z: the same margin, once inflation is paid for. */
  margeReelle: number;
  /** Is the capital preserved in purchasing power, not just in euros? */
  preserveEnReel: boolean;
  /** Rnet − D, or null when no target spending was entered. */
  ecartDepenses: number | null;
  /** Capital needed to fund D under the same Z and α, or null if unreachable. */
  patrimoineRequis: number | null;
};

export type AnneeProjection = {
  /** 1 for the first year of withdrawal. */
  annee: number;
  capitalDebut: number;
  rendement: number;
  retraitBrut: number;
  impots: number;
  retraitNet: number;
  capitalFin: number;
  /** Capital restated in year-0 euros, i.e. in purchasing power. */
  capitalFinReel: number;
  /** Net income restated in year-0 euros. */
  retraitNetReel: number;
};

export type Projection = {
  annees: AnneeProjection[];
  /** First year the planned withdrawal can no longer be honoured, if any. */
  anneeEpuisement: number | null;
  capitalFinal: number;
  capitalFinalReel: number;
};

// ---------------------------------------------------------------------------
// Bounds
// ---------------------------------------------------------------------------

/**
 * Input bounds, shared by the fields, the URL decoder and the tests.
 *
 * They are the only guard against the arithmetic blowing up: everything below
 * assumes its inputs already went through `borner`, so no formula has to defend
 * itself against an infinite or missing value.
 */
export const BORNES = {
  patrimoine: { min: 0, max: 100_000_000 },
  rendement: { min: -0.1, max: 0.2 },
  retrait: { min: 0, max: 0.2 },
  imposition: { min: 0, max: 0.6 },
  depensesCibles: { min: 0, max: 100_000_000 },
  inflation: { min: -0.02, max: 0.1 },
  horizon: { min: 5, max: 60 },
} as const;

/**
 * The simulation a first-time visitor lands on.
 *
 * The rates come from the country of residence rather than from round numbers:
 * the specification proposed 5 % / 4 % / 30 % as a teaching default, but 30 %
 * matches no actual regime since the 2026 rise, and a 4 % withdrawal has a poor
 * historical record in France. Everything below therefore reads from
 * `pays.ts`, which also carries the reasons — see `justification`.
 */
export const DEFAUTS: Hypotheses = {
  patrimoine: 500_000,
  ...pays(PAYS_PAR_DEFAUT).defauts,
  imposition: regimeParDefaut(PAYS_PAR_DEFAUT).imposition,
  depensesCibles: 0,
  horizon: 40,
  modeRetrait: 'indexe',
  pays: PAYS_PAR_DEFAUT,
};

/** Gap applied to the return in the pessimistic and optimistic scenarios. */
export const ECART_SCENARIO = 0.02;

const borne = (v: number, { min, max }: { min: number; max: number }) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/** Clamps every parameter to its bounds; the entry point of the engine. */
export function borner(h: Hypotheses): Hypotheses {
  return {
    patrimoine: borne(h.patrimoine, BORNES.patrimoine),
    rendement: borne(h.rendement, BORNES.rendement),
    retrait: borne(h.retrait, BORNES.retrait),
    imposition: borne(h.imposition, BORNES.imposition),
    depensesCibles: borne(h.depensesCibles, BORNES.depensesCibles),
    inflation: borne(h.inflation, BORNES.inflation),
    horizon: Math.round(borne(h.horizon, BORNES.horizon)),
    modeRetrait: h.modeRetrait === 'proportionnel' ? 'proportionnel' : 'indexe',
    pays: estClePays(h.pays) ? h.pays : PAYS_PAR_DEFAUT,
  };
}

// ---------------------------------------------------------------------------
// The verdict
// ---------------------------------------------------------------------------

/**
 * "Can I live off this without touching the capital?"
 *
 * The rule is Z ≤ Y, with two cases the raw comparison gets wrong:
 *
 *  - with no capital there is nothing to preserve, and a green banner over a
 *    zero income would be absurd;
 *  - at Z = 0 nothing is withdrawn, so the capital is preserved *by the
 *    withdrawal*, whatever the market does. A negative return still shrinks it,
 *    which the interface says in words rather than by flipping the verdict.
 */
export function verdictDe(h: Hypotheses): Verdict {
  if (h.patrimoine <= 0) return 'sans-patrimoine';
  if (h.retrait === 0) return 'preserve';
  if (h.retrait > h.rendement) return 'entame';
  if (h.retrait === h.rendement) return 'limite';
  return 'preserve';
}

/**
 * Capital needed to fund `depenses` net per year, at the same Z and α.
 *
 * Null when no finite amount does it: without a withdrawal, or with everything
 * taxed away, no capital ever produces an income.
 */
export function patrimoineRequis(
  depenses: number,
  retrait: number,
  imposition: number,
): number | null {
  const net = retrait * (1 - imposition);
  if (depenses <= 0 || net <= 0) return null;
  return depenses / net;
}

// ---------------------------------------------------------------------------
// First year
// ---------------------------------------------------------------------------

export function simuler(hypotheses: Hypotheses): Resultat {
  const h = borner(hypotheses);

  const retraitBrut = h.patrimoine * h.retrait;
  const impots = retraitBrut * h.imposition;
  const revenuNetAnnuel = retraitBrut - impots;
  const marge = h.rendement - h.retrait;

  return {
    retraitBrut,
    impots,
    revenuNetAnnuel,
    revenuNetMensuel: revenuNetAnnuel / 12,
    rendementGenere: h.patrimoine * h.rendement,
    variationCapital: h.patrimoine * marge,
    verdict: verdictDe(h),
    marge,
    margeReelle: marge - h.inflation,
    // Same tolerance as the nominal verdict: at Z = 0 nothing is withdrawn, so
    // purchasing power is not being spent either.
    preserveEnReel: h.retrait === 0 || h.retrait <= h.rendement - h.inflation,
    ecartDepenses: h.depensesCibles > 0 ? revenuNetAnnuel - h.depensesCibles : null,
    patrimoineRequis: patrimoineRequis(h.depensesCibles, h.retrait, h.imposition),
  };
}

// ---------------------------------------------------------------------------
// Year-by-year projection
// ---------------------------------------------------------------------------

/**
 * Runs the capital over the horizon.
 *
 * `rendement` overrides Y, which is how the compared scenarios are built
 * without duplicating the loop.
 *
 * Two conventions worth stating, because they decide what the chart shows:
 *  - the return of year n is credited before the withdrawal of year n, so a
 *    capital that grows enough during the year funds that year's withdrawal;
 *  - the withdrawal is capped by what is left. The capital stops at zero
 *    instead of going negative, and the year the cap first bites is reported as
 *    the depletion year.
 */
export function projeter(hypotheses: Hypotheses, rendement?: number): Projection {
  const h = borner(hypotheses);
  const y = rendement === undefined ? h.rendement : borne(rendement, BORNES.rendement);

  const annees: AnneeProjection[] = [];
  let capital = h.patrimoine;
  let anneeEpuisement: number | null = null;

  // In indexed mode the amount is set once, on the starting capital, then only
  // follows inflation — it never re-reads the capital.
  const retraitInitial = h.patrimoine * h.retrait;

  for (let annee = 1; annee <= h.horizon; annee++) {
    const capitalDebut = capital;
    const gains = capitalDebut * y;
    const disponible = Math.max(0, capitalDebut + gains);

    const souhaite =
      h.modeRetrait === 'indexe'
        ? retraitInitial * (1 + h.inflation) ** (annee - 1)
        : disponible * h.retrait;

    const retraitBrut = Math.min(souhaite, disponible);
    const impots = retraitBrut * h.imposition;
    const capitalFin = disponible - retraitBrut;

    // The plan breaks the first year the full amount cannot be taken. Testing
    // the shortfall rather than "capital = 0" also catches the year the last
    // euros are scraped together.
    if (anneeEpuisement === null && retraitBrut < souhaite - 0.005) {
      anneeEpuisement = annee;
    }

    const deflateur = (1 + h.inflation) ** annee;
    annees.push({
      annee,
      capitalDebut,
      rendement: gains,
      retraitBrut,
      impots,
      retraitNet: retraitBrut - impots,
      capitalFin,
      capitalFinReel: capitalFin / deflateur,
      retraitNetReel: (retraitBrut - impots) / deflateur,
    });

    capital = capitalFin;
  }

  const derniere = annees.at(-1);
  return {
    annees,
    anneeEpuisement,
    capitalFinal: derniere?.capitalFin ?? h.patrimoine,
    capitalFinalReel: derniere?.capitalFinReel ?? h.patrimoine,
  };
}

export type Scenario = {
  cle: 'pessimiste' | 'central' | 'optimiste';
  libelle: string;
  rendement: number;
  projection: Projection;
};

/**
 * The same plan under three returns, Y ± 2 points.
 *
 * A single curve suggests a precision that a constant return does not have.
 * Three curves show what actually matters: how much room the plan has before
 * it breaks.
 */
export function scenarios(hypotheses: Hypotheses): Scenario[] {
  const h = borner(hypotheses);
  return (
    [
      { cle: 'pessimiste', libelle: 'Pessimiste', ecart: -ECART_SCENARIO },
      { cle: 'central', libelle: 'Central', ecart: 0 },
      { cle: 'optimiste', libelle: 'Optimiste', ecart: ECART_SCENARIO },
    ] as const
  ).map((s) => {
    // Clamped here rather than inside the loop: the legend must show the
    // return actually used, not the one asked for. At the edge of the bounds
    // two scenarios end up on the same curve, which is honest.
    const rendement = borne(h.rendement + s.ecart, BORNES.rendement);
    return {
      cle: s.cle,
      libelle: s.libelle,
      rendement,
      projection: projeter(h, rendement),
    };
  });
}
