import type { Traduit } from './i18n';

/**
 * Countries of residence, their tax regimes and their starting hypotheses.
 *
 * The rest of the simulator knows only α, a single rate applied to whatever is
 * withdrawn. This module is where that abstract rate meets the real world: each
 * regime carries the rate an actual resident faces, what it is made of, and
 * what the simplification costs — because in every country listed here the tax
 * bites on the *gain* portion of a withdrawal, not on the whole of it, so the
 * simulator overestimates the tax. Saying it once per regime is what keeps the
 * figures honest.
 *
 * Rates are held as fractions, like everywhere else in the engine.
 */

export type ClePays = 'france' | 'japon';

export type Regime = {
  /** Unique across every country: it is what travels in the URL. */
  cle: string;
  pays: ClePays;
  libelle: Traduit;
  /** Short form for the segmented control. */
  libelleCourt: Traduit;
  /** α — the rate applied to the amounts withdrawn. */
  imposition: number;
  /** What the rate is made of. */
  composition: Traduit;
  /** What the flat-rate model glosses over for this regime. */
  reserve: Traduit;
};

export type Pays = {
  cle: ClePays;
  libelle: Traduit;
  /**
   * Starting hypotheses for a resident of this country.
   *
   * Selecting a country loads the whole set, not just the tax rate: a plan that
   * makes sense in France does not make the same sense in Japan, and the
   * withdrawal rate is where that shows most. `justification` says why these
   * figures and not others — an unexplained default is an opinion in disguise.
   */
  defauts: { rendement: number; retrait: number; inflation: number };
  /**
   * General, country-level assumptions used to estimate a future pension when
   * the visitor gives their age. Deliberately coarse — the point is to show the
   * order of magnitude of a partial pension's effect on the capital, not to
   * replace a pension statement. See `estimationRente` in `fire.ts`.
   */
  retraite: {
    /** Earliest age the pension can be drawn; the pension starts here. */
    ageLegal: number;
    /**
     * Age of the automatic full rate: from here the pension carries no décote
     * even with missing quarters. Equal to `ageLegal` where there is no décote.
     */
    ageTauxPlein: number;
    /** Years of contributions for a full-rate, unreduced pension. */
    anneesCarriereRequise: number;
    /** Full-career pension as a fraction of the average salary (all schemes). */
    tauxRemplacement: number;
    /** Décote per quarter short, applied when claiming before the full-rate age. */
    decoteParTrimestre: number;
    /** Full-career gross pension used when no salary is given (country average). */
    renteReferenceBrute: number;
    /** Effective tax and social levies on the pension, as a fraction. */
    tauxImpositionRente: number;
  };
  /**
   * How a country levies a health contribution on capital income while one lives
   * off capital without a pension (in France, the cotisation subsidiaire maladie).
   * The rate itself is a user input — not everyone is liable — but the abattement
   * and the cap are country facts. Absent where there is no such levy.
   */
  csm?: {
    /** Capital income below this is exempt (in France, ~50 % of the PASS). */
    abattement: number;
    /** The taxable base is capped at this (in France, 8 × PASS). */
    plafond: number;
  };
  /**
   * Colour of this country's curve when several are drawn together. Held here
   * rather than in the chart so a country always looks the same wherever it
   * appears, and so adding one means picking its colour once.
   */
  couleur: string;
  justification: Traduit;
  noteInflation: Traduit;
  regimes: Regime[];
};

const FRANCE: Regime[] = [
  {
    cle: 'fr-cto',
    pays: 'france',
    libelle: {
      fr: 'Compte-titres, flat tax',
      en: 'Taxable brokerage account, flat tax',
    },
    libelleCourt: { fr: 'Compte-titres', en: 'Brokerage' },
    imposition: 0.314,
    composition: {
      fr: '12,8 % d’impôt sur le revenu et 18,6 % de prélèvements sociaux, ces derniers portés de 17,2 % à 18,6 % au 1ᵉʳ janvier 2026.',
      en: '12.8% income tax and 18.6% social levies, the latter raised from 17.2% on 1 January 2026.',
    },
    reserve: {
      fr: 'Le prélèvement forfaitaire unique ne frappe que la plus-value contenue dans le retrait, pas le capital retiré : le simulateur surestime donc l’impôt, d’autant plus que votre portefeuille est jeune.',
      en: 'The flat tax bites only on the capital gain contained in a withdrawal, never on the principal: the simulator therefore overstates the tax, the more so the younger your portfolio.',
    },
  },
  {
    cle: 'fr-pea',
    pays: 'france',
    libelle: {
      fr: 'PEA de plus de cinq ans',
      en: 'PEA equity savings plan, held over five years',
    },
    libelleCourt: { fr: 'PEA', en: 'PEA' },
    imposition: 0.186,
    composition: {
      fr: 'Prélèvements sociaux seuls : après cinq ans, l’impôt sur le revenu ne s’applique plus aux gains du plan.',
      en: 'Social levies only: after five years the plan’s gains no longer attract income tax.',
    },
    reserve: {
      fr: 'Les versements sont plafonnés à 150 000 €, et le taux retenu est celui du jour du retrait — la hausse de 2026 frappe donc aussi les gains accumulés avant elle. Là encore, seule la part de plus-value du retrait est taxée.',
      en: 'Contributions are capped at €150,000, and the rate applied is the one in force on the day of withdrawal — so the 2026 increase also hits gains accumulated before it. Here too, only the capital-gain share of a withdrawal is taxed.',
    },
  },
  {
    cle: 'fr-av',
    pays: 'france',
    libelle: {
      fr: 'Assurance-vie de plus de huit ans',
      en: 'Life insurance contract, held over eight years',
    },
    libelleCourt: { fr: 'Assurance-vie', en: 'Life insurance' },
    imposition: 0.247,
    composition: {
      fr: '7,5 % d’impôt sur le revenu et 17,2 % de prélèvements sociaux — l’assurance-vie n’a pas suivi la hausse de 2026.',
      en: '7.5% income tax and 17.2% social levies — life insurance did not follow the 2026 increase.',
    },
    reserve: {
      fr: 'L’abattement annuel de 4 600 € (9 200 € pour un couple) sur la part imposable n’est pas modélisé : pour un retrait modeste, l’impôt réel est nettement plus faible que celui affiché.',
      en: 'The annual allowance of €4,600 (€9,200 for a couple) on the taxable share is not modelled: on a modest withdrawal the real tax is markedly lower than the figure shown.',
    },
  },
];

const JAPON: Regime[] = [
  {
    cle: 'jp-tokutei',
    pays: 'japon',
    libelle: {
      fr: 'Compte imposable (tokutei kōza)',
      en: 'Taxable account (tokutei kōza)',
    },
    libelleCourt: { fr: 'Compte imposable', en: 'Taxable account' },
    imposition: 0.20315,
    composition: {
      fr: '15 % d’impôt national, 5 % de taxe locale de résidence et la surtaxe de reconstruction de 2,1 % appliquée à l’impôt national, en vigueur jusqu’en 2037.',
      en: '15% national income tax, 5% local inhabitant tax and the 2.1% reconstruction surtax levied on the national portion, in force until 2037.',
    },
    reserve: {
      fr: 'Le taux porte sur la plus-value, prélevée à la source sur un compte tokutei kōza. Déclarer ces gains plutôt que de s’en tenir à la retenue peut relever vos cotisations d’assurance maladie : l’arbitrage ne se voit pas dans ce simulateur.',
      en: 'The rate applies to the capital gain, withheld at source on a tokutei kōza account. Filing those gains rather than relying on the withholding can raise your health insurance premiums: that trade-off is invisible here.',
    },
  },
  {
    cle: 'jp-nisa',
    pays: 'japon',
    libelle: { fr: 'NISA', en: 'NISA' },
    libelleCourt: { fr: 'NISA', en: 'NISA' },
    imposition: 0,
    composition: {
      fr: 'Aucune imposition sur les gains ni sur les retraits, sans limite de durée depuis la réforme de 2024.',
      en: 'No tax on gains or withdrawals, with no time limit since the 2024 reform.',
    },
    reserve: {
      fr: 'Le plafond porte sur les versements : 18 millions de yens sur la vie entière, dont 12 millions pour la poche « croissance ». Au-delà, c’est le compte imposable qui s’applique — un patrimoine FIRE dépasse vite ce plafond.',
      en: 'The cap is on contributions: ¥18 million over a lifetime, of which ¥12 million for the growth quota. Beyond it the taxable account applies — a FIRE-sized portfolio outgrows the cap quickly.',
    },
  },
];

export const PAYS: Pays[] = [
  {
    cle: 'france',
    libelle: { fr: 'France', en: 'France' },
    defauts: { rendement: 0.05, retrait: 0.035, inflation: 0.02 },
    retraite: {
      ageLegal: 64,
      ageTauxPlein: 67,
      anneesCarriereRequise: 43,
      tauxRemplacement: 0.5,
      decoteParTrimestre: 0.0125,
      renteReferenceBrute: 18_000,
      tauxImpositionRente: 0.1,
    },
    // Cotisation subsidiaire maladie: ~50 % of the PASS exempt, base capped at
    // 8 × PASS (PASS ≈ 47 100 € in 2025).
    csm: { abattement: 23_550, plafond: 376_800 },
    couleur: 'var(--color-brand-600)',
    justification: {
      fr: 'Un retrait de 4 % a échoué dans 71,3 % des périodes de trente ans en France, sur les données historiques réunies par Wade Pfau : 3,5 % est un point de départ plus sobre. Le rendement de 5 % suppose un portefeuille diversifié, et l’inflation reprend la cible de la BCE.',
      en: 'A 4% withdrawal failed in 71.3% of thirty-year periods in France on the historical data assembled by Wade Pfau, so 3.5% is a soberer starting point. The 5% return assumes a diversified portfolio, and inflation follows the ECB target.',
    },
    noteInflation: {
      fr: 'Cible de moyen terme de la Banque centrale européenne.',
      en: 'The European Central Bank’s medium-term target.',
    },
    regimes: FRANCE,
  },
  {
    cle: 'japon',
    libelle: { fr: 'Japon', en: 'Japan' },
    defauts: { rendement: 0.05, retrait: 0.03, inflation: 0.02 },
    retraite: {
      ageLegal: 65,
      ageTauxPlein: 65,
      anneesCarriereRequise: 40,
      tauxRemplacement: 0.5,
      decoteParTrimestre: 0,
      renteReferenceBrute: 11_000,
      tauxImpositionRente: 0.1,
    },
    couleur: 'var(--color-azur-600)',
    justification: {
      fr: 'Le Japon est le contre-exemple de la règle des 4 % : sur un portefeuille purement domestique, le retrait historiquement soutenable tombe à 0,25 %, et ne remonte qu’à 2,2 % avec une diversification mondiale. Partir de 3 % reste optimiste. Le rendement de 5 % suppose un portefeuille diversifié, et l’inflation reprend la cible de la Banque du Japon.',
      en: 'Japan is the counter-example to the 4% rule: on a purely domestic portfolio the historically sustainable withdrawal falls to 0.25%, and rises only to 2.2% with global diversification. Starting at 3% is still optimistic. The 5% return assumes a diversified portfolio, and inflation follows the Bank of Japan target.',
    },
    noteInflation: {
      fr: 'Cible de la Banque du Japon depuis 2013, atteinte tardivement : le pays a connu deux décennies de prix quasi étales.',
      en: 'The Bank of Japan’s target since 2013, reached only lately: the country went through two decades of near-flat prices.',
    },
    regimes: JAPON,
  },
];

export const PAYS_PAR_DEFAUT: ClePays = 'france';

/** Every regime, all countries together, in display order. */
export const TOUS_REGIMES: Regime[] = PAYS.flatMap((p) => p.regimes);

export function estClePays(valeur: unknown): valeur is ClePays {
  return PAYS.some((p) => p.cle === valeur);
}

export function pays(cle: ClePays): Pays {
  return PAYS.find((p) => p.cle === cle) ?? PAYS[0];
}

export function regime(cle: string): Regime | null {
  return TOUS_REGIMES.find((r) => r.cle === cle) ?? null;
}

/** The regime a country falls back to when it is selected. */
export function regimeParDefaut(cle: ClePays): Regime {
  return pays(cle).regimes[0];
}

/**
 * The regime matching a rate, if any.
 *
 * The rate stays freely adjustable — the regimes are presets, not a mode. A
 * value that matches none of them is a deliberate hypothesis, not an error, and
 * the interface says so rather than snapping the slider to the nearest regime.
 *
 * The tolerance absorbs the round trip through the URL, where rates travel as
 * percentage points with three decimals — just enough for the Japanese 20,315 %.
 */
export function regimeCorrespondant(cle: ClePays, imposition: number): Regime | null {
  return (
    pays(cle).regimes.find((r) => Math.abs(r.imposition - imposition) < 5e-6) ?? null
  );
}
