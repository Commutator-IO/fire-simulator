import type { Traduit } from './i18n';
import type { ClePays } from './pays';

/**
 * What a household actually owns, and what each part earns.
 *
 * The withdrawal simulator asks for two numbers most people cannot answer off
 * the top of their head: how much capital they have, and what it returns.
 * Nobody holds a single blended portfolio — they hold a Livret A or a NISA, a
 * life insurance policy, a flat with a mortgage on it. This module turns that
 * list into the two numbers, and is deliberately the only place that knows the
 * difference between them.
 *
 * Three rules carry the whole model:
 *
 *  - **The catalogue depends on where you live.** A PEA means nothing to a
 *    Japanese resident and a NISA nothing to a French one, and the rate on a
 *    deposit account is not the same in Tokyo and in Paris. Each country
 *    therefore brings its own list, its own ceilings and its own starting
 *    rates.
 *  - **A debt is an asset with a minus sign**, and its interest rate is a
 *    negative return. That is not a trick: it is what leverage is, and writing
 *    it that way makes the blended return come out right without a special
 *    case. €500k of assets at 5 % against €200k of debt at 3 % leaves €300k
 *    earning €22k, that is 7,33 % — which is exactly what the weighted average
 *    gives.
 *  - **A rented flat earns its rent, not a rate.** Its return is therefore
 *    worked out rather than typed: rent, less running costs, less the tax on
 *    what is left, over the value of the property. A yield quoted on the gross
 *    rent is routinely double the real figure.
 *
 *  - **Owning a home is not an income.** The main residence and the loan
 *    against it belong in the net worth statement, because they are real
 *    wealth, but not in the capital that funds withdrawals: a home lowers what
 *    you spend, it hands you nothing, and it cannot be drawn on without moving
 *    out. Excluding one without the other would make the capital look smaller
 *    than it is, hence two separate loan lines.
 *
 * Holding assets costs something even when they earn nothing — property tax on
 * the roof over your head, and in France a wealth tax on property above a
 * threshold. `coutDetention` puts a figure on that, and on the income it takes
 * to pay it.
 */

export type CategorieActif =
  | 'liquide'
  | 'assurance'
  | 'actions'
  | 'immobilier'
  | 'autre'
  | 'dettes';

export type CleActif =
  // France
  | 'livretA'
  | 'lep'
  | 'liquidites'
  | 'fondsEuros'
  | 'uniteCompte'
  | 'per'
  | 'pea'
  | 'compteTitres'
  | 'scpi'
  | 'immobilierLocatif'
  | 'residencePrincipale'
  | 'autres'
  | 'creditResidence'
  | 'credits'
  // Japon
  | 'futsuYokin'
  | 'teikiYokin'
  | 'nisa'
  | 'tokutei'
  | 'ideco'
  | 'jreit'
  | 'locatifJp'
  | 'residenceJp'
  | 'autresJp'
  | 'creditResidenceJp'
  | 'creditsJp';

export type Actif = {
  cle: CleActif;
  pays: ClePays;
  categorie: CategorieActif;
  /** −1 for a debt: the amount is entered positive and counts against you. */
  signe: 1 | -1;
  /**
   * Does the line pay for withdrawals? A main residence does not, and neither
   * does the loan attached to it: excluding one without the other would make
   * the capital appear smaller than it is.
   */
  productif: boolean;
  /** Counts towards the French wealth tax on property. */
  immobilierTaxable?: boolean;
  /**
   * Yearly property tax, as a share of the value. Carried only by a home:
   * on a let property the same tax belongs in its running costs, and counting
   * it twice would be worse than not counting it at all.
   */
  tauxTaxeFonciere?: number;
  /**
   * When true the return is not typed but worked out from an income: the line
   * asks for a rent, its running costs and the tax on the difference.
   */
  revenus?: boolean;
  /** A starting hypothesis, editable line by line. */
  rendementParDefaut: number;
  /** Tax on the net rental income, for lines that declare `revenus`. */
  impositionParDefaut?: number;
  /** Statutory ceiling, when the product has one. */
  plafond?: number;
  libelle: Traduit;
  note: Traduit;
};

const FRANCE: Actif[] = [
  {
    cle: 'livretA',
    pays: 'france',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    // Taux fixé par arrêté, 1,7 % au 1ᵉʳ août 2026.
    rendementParDefaut: 0.017,
    plafond: 22_950 + 12_000,
    libelle: { fr: 'Livret A et LDDS', en: 'Livret A and LDDS' },
    note: {
      fr: 'Taux réglementé, net d’impôt. Plafonds cumulés de 22 950 € et 12 000 €.',
      en: 'Regulated rate, free of tax. Combined ceilings of €22,950 and €12,000.',
    },
  },
  {
    cle: 'lep',
    pays: 'france',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.025,
    plafond: 10_000,
    libelle: { fr: 'Livret d’épargne populaire', en: 'Livret d’épargne populaire' },
    note: {
      fr: 'Sous condition de revenus. Taux réglementé, net d’impôt, plafond de 10 000 €.',
      en: 'Means-tested. Regulated rate, free of tax, ceiling of €10,000.',
    },
  },
  {
    cle: 'liquidites',
    pays: 'france',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    rendementParDefaut: 0,
    libelle: { fr: 'Comptes courants et liquidités', en: 'Current accounts and cash' },
    note: {
      fr: 'Ce qui dort sans rien rapporter. En garder est raisonnable ; en garder trop coûte le rendement de tout le reste.',
      en: 'What sits there earning nothing. Some is sensible; too much costs you the return on everything else.',
    },
  },
  {
    cle: 'fondsEuros',
    pays: 'france',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.025,
    libelle: { fr: 'Assurance-vie — fonds euros', en: 'Life insurance — euro fund' },
    note: {
      fr: 'Capital garanti, rendement de l’ordre de 2,5 % ces dernières années.',
      en: 'Capital guaranteed, returning around 2.5% in recent years.',
    },
  },
  {
    cle: 'uniteCompte',
    pays: 'france',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.06,
    libelle: { fr: 'Assurance-vie — unités de compte', en: 'Life insurance — unit-linked' },
    note: {
      fr: 'Actions, obligations ou immobilier logés dans le contrat, sans garantie du capital.',
      en: 'Equities, bonds or property held inside the policy, with no capital guarantee.',
    },
  },
  {
    cle: 'per',
    pays: 'france',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.04,
    libelle: { fr: 'Plan d’épargne retraite', en: 'Retirement savings plan (PER)' },
    note: {
      fr: 'Bloqué jusqu’à la retraite, sauf accident de la vie et achat de la résidence principale. La sortie est imposée.',
      en: 'Locked until retirement, barring hardship and buying a first home. The exit is taxed.',
    },
  },
  {
    cle: 'pea',
    pays: 'france',
    categorie: 'actions',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.07,
    plafond: 150_000,
    libelle: { fr: 'PEA', en: 'PEA equity savings plan' },
    note: {
      fr: 'Actions européennes. Versements plafonnés à 150 000 €, gains exonérés d’impôt sur le revenu après cinq ans.',
      en: 'European equities. Contributions capped at €150,000, gains free of income tax after five years.',
    },
  },
  {
    cle: 'compteTitres',
    pays: 'france',
    categorie: 'actions',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.07,
    libelle: { fr: 'Compte-titres', en: 'Taxable brokerage account' },
    note: {
      fr: 'Sans plafond ni contrainte géographique, mais imposé à la flat tax.',
      en: 'No ceiling and no geographic constraint, but taxed at the flat rate.',
    },
  },
  {
    cle: 'scpi',
    pays: 'france',
    categorie: 'immobilier',
    signe: 1,
    productif: true,
    immobilierTaxable: true,
    rendementParDefaut: 0.045,
    libelle: { fr: 'SCPI', en: 'Property investment trusts (SCPI)' },
    note: {
      fr: 'Immobilier locatif sans les locataires. Le taux de distribution s’entend avant impôt : les revenus fonciers suivent le barème.',
      en: 'Rental property without the tenants. The distribution rate is before tax: property income follows the income tax scale.',
    },
  },
  {
    cle: 'immobilierLocatif',
    pays: 'france',
    categorie: 'immobilier',
    signe: 1,
    productif: true,
    immobilierTaxable: true,
    revenus: true,
    rendementParDefaut: 0,
    impositionParDefaut: 0.3,
    libelle: { fr: 'Immobilier locatif', en: 'Rental property' },
    note: {
      fr: 'Valeur du bien, loyers encaissés sur l’année, et ce qu’ils coûtent : taxe foncière, copropriété, assurance, gestion, travaux, vacance. L’imposition porte sur ce qui reste — barème et prélèvements sociaux pour des revenus fonciers.',
      en: 'The value of the property, the rent collected over the year, and what it costs: property tax, service charges, insurance, management, works, vacancy. The tax applies to what is left — income tax scale and social levies on property income.',
    },
  },
  {
    cle: 'residencePrincipale',
    pays: 'france',
    categorie: 'immobilier',
    signe: 1,
    productif: false,
    immobilierTaxable: true,
    rendementParDefaut: 0,
    tauxTaxeFonciere: 0.007,
    libelle: { fr: 'Résidence principale', en: 'Main residence' },
    note: {
      fr: 'Compte dans votre patrimoine, pas dans ce qui financera vos retraits : elle réduit vos dépenses, elle ne verse pas de revenu, et sa valorisation ne se touche qu’en vendant. Sa taxe foncière, elle, se paie chaque année.',
      en: 'Part of your net worth, not of what will fund your withdrawals: it lowers your spending, it pays you nothing, and its appreciation is only reachable by selling. Its property tax, however, falls due every year.',
    },
  },
  {
    cle: 'autres',
    pays: 'france',
    categorie: 'autre',
    signe: 1,
    productif: true,
    rendementParDefaut: 0,
    libelle: { fr: 'Autres actifs', en: 'Other assets' },
    note: {
      fr: 'Or, cryptomonnaies, parts de société, œuvres… À vous d’en fixer le rendement attendu.',
      en: 'Gold, crypto, shares in a business, art… the expected return is yours to set.',
    },
  },
  {
    cle: 'creditResidence',
    pays: 'france',
    categorie: 'dettes',
    signe: -1,
    productif: false,
    immobilierTaxable: true,
    rendementParDefaut: 0.03,
    libelle: {
      fr: 'Crédit de la résidence principale',
      en: 'Mortgage on the main residence',
    },
    note: {
      fr: 'Capital restant dû et taux du prêt. Il sort du patrimoine productif avec le logement qu’il finance : les exclure séparément fausserait le total.',
      en: 'Outstanding capital and the rate of the loan. It leaves the productive capital along with the home it paid for: excluding one without the other would skew the total.',
    },
  },
  {
    cle: 'credits',
    pays: 'france',
    categorie: 'dettes',
    signe: -1,
    productif: true,
    immobilierTaxable: true,
    rendementParDefaut: 0.03,
    libelle: { fr: 'Autres crédits', en: 'Other loans' },
    note: {
      fr: 'Crédit locatif, consommation, prêt étudiant. Un emprunt est un actif au signe inversé, et son taux un rendement négatif : c’est ce qui fait apparaître l’effet de levier.',
      en: 'Buy-to-let, consumer credit, student loan. A loan is an asset with a minus sign and its rate a negative return: that is what makes leverage show up.',
    },
  },
];

const JAPON: Actif[] = [
  {
    cle: 'futsuYokin',
    pays: 'japon',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    // Les grandes banques rémunèrent le dépôt à vue autour de 0,2 % depuis la
    // sortie des taux négatifs.
    rendementParDefaut: 0.002,
    libelle: { fr: 'Dépôt à vue (futsū yokin)', en: 'Ordinary deposit (futsū yokin)' },
    note: {
      fr: 'Le compte courant japonais. Rémunéré autour de 0,2 % dans les grandes banques depuis la fin des taux négatifs, davantage en ligne.',
      en: 'The Japanese current account. Paying around 0.2% at the major banks since negative rates ended, more online.',
    },
  },
  {
    cle: 'teikiYokin',
    pays: 'japon',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.008,
    libelle: { fr: 'Dépôt à terme (teiki yokin)', en: 'Time deposit (teiki yokin)' },
    note: {
      fr: 'Somme bloquée sur une durée convenue. De l’ordre de 0,8 % à un an, un peu plus à cinq ans. Les intérêts subissent 20,315 % à la source.',
      en: 'Money locked for an agreed term. Around 0.8% at one year, a little more at five. Interest is withheld at 20.315%.',
    },
  },
  {
    cle: 'nisa',
    pays: 'japon',
    categorie: 'actions',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.07,
    plafond: 18_000_000,
    libelle: { fr: 'NISA', en: 'NISA' },
    note: {
      fr: 'Enveloppe totalement exonérée depuis la réforme de 2024, dans la limite de 18 millions de yens de versements — le plafond est indiqué en yens, pas en euros.',
      en: 'Fully exempt since the 2024 reform, up to ¥18 million of contributions — the ceiling is in yen, not in euros.',
    },
  },
  {
    cle: 'tokutei',
    pays: 'japon',
    categorie: 'actions',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.07,
    libelle: {
      fr: 'Compte-titres imposable (tokutei kōza)',
      en: 'Taxable brokerage account (tokutei kōza)',
    },
    note: {
      fr: 'Sans plafond, mais les plus-values et dividendes y subissent 20,315 %, retenus à la source.',
      en: 'No ceiling, but gains and dividends are taxed at 20.315%, withheld at source.',
    },
  },
  {
    cle: 'ideco',
    pays: 'japon',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.04,
    libelle: { fr: 'iDeCo et retraite d’entreprise', en: 'iDeCo and corporate pension' },
    note: {
      fr: 'Versements déductibles, mais bloqués jusqu’à soixante ans. La sortie est imposée, avec des abattements selon qu’elle se fait en capital ou en rente.',
      en: 'Contributions are deductible but locked until sixty. The exit is taxed, with allowances depending on whether it is taken as capital or as an annuity.',
    },
  },
  {
    cle: 'jreit',
    pays: 'japon',
    categorie: 'immobilier',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.045,
    libelle: { fr: 'J-REIT', en: 'J-REIT' },
    note: {
      fr: 'Immobilier coté japonais. Les distributions sont imposées comme des dividendes, à 20,315 %.',
      en: 'Listed Japanese property. Distributions are taxed like dividends, at 20.315%.',
    },
  },
  {
    cle: 'locatifJp',
    pays: 'japon',
    categorie: 'immobilier',
    signe: 1,
    productif: true,
    revenus: true,
    rendementParDefaut: 0,
    impositionParDefaut: 0.25,
    libelle: { fr: 'Immobilier locatif', en: 'Rental property' },
    note: {
      fr: 'Valeur du bien, loyers de l’année et ce qu’ils coûtent : taxe foncière, charges, gestion, vacance. Les revenus locatifs suivent le barème progressif et la taxe de résidence, pas les 20,315 % des valeurs mobilières.',
      en: 'The value of the property, the year’s rent and what it costs: property tax, service charges, management, vacancy. Rental income follows the progressive scale and the inhabitant tax, not the 20.315% of securities.',
    },
  },
  {
    cle: 'residenceJp',
    pays: 'japon',
    categorie: 'immobilier',
    signe: 1,
    productif: false,
    rendementParDefaut: 0,
    // 固定資産税 1,4 % et 都市計画税 jusqu'à 0,3 %, sur la valeur cadastrale.
    tauxTaxeFonciere: 0.012,
    libelle: { fr: 'Résidence principale', en: 'Main residence' },
    note: {
      fr: 'Compte dans votre patrimoine, pas dans ce qui financera vos retraits. La taxe sur les actifs fixes, elle, tombe chaque année : 1,4 % de la valeur cadastrale, plus jusqu’à 0,3 % de taxe d’urbanisme en zone urbaine.',
      en: 'Part of your net worth, not of what will fund your withdrawals. The fixed asset tax, however, falls due every year: 1.4% of the assessed value, plus up to 0.3% of city planning tax in urban areas.',
    },
  },
  {
    cle: 'creditResidenceJp',
    pays: 'japon',
    categorie: 'dettes',
    signe: -1,
    productif: false,
    rendementParDefaut: 0.01,
    libelle: {
      fr: 'Crédit de la résidence principale',
      en: 'Mortgage on the main residence',
    },
    note: {
      fr: 'Capital restant dû et taux du prêt. Il sort du patrimoine productif avec le logement qu’il finance. Les taux variables japonais tournent autour de 1 %.',
      en: 'Outstanding capital and the rate of the loan. It leaves the productive capital along with the home it paid for. Japanese variable rates run around 1%.',
    },
  },
  {
    cle: 'autresJp',
    pays: 'japon',
    categorie: 'autre',
    signe: 1,
    productif: true,
    rendementParDefaut: 0,
    libelle: { fr: 'Autres actifs', en: 'Other assets' },
    note: {
      fr: 'Or, cryptomonnaies, parts de société… À vous d’en fixer le rendement attendu.',
      en: 'Gold, crypto, shares in a business… the expected return is yours to set.',
    },
  },
  {
    cle: 'creditsJp',
    pays: 'japon',
    categorie: 'dettes',
    signe: -1,
    productif: true,
    rendementParDefaut: 0.01,
    libelle: { fr: 'Crédits en cours', en: 'Outstanding loans' },
    note: {
      fr: 'Capital restant dû et taux du prêt. Les crédits immobiliers japonais à taux variable tournent autour de 1 %, nettement en dessous des taux français.',
      en: 'Outstanding capital and the rate of the loan. Japanese variable-rate mortgages run around 1%, markedly below French ones.',
    },
  },
];

export const ACTIFS: Actif[] = [...FRANCE, ...JAPON];

export const CATEGORIES: CategorieActif[] = [
  'liquide',
  'assurance',
  'actions',
  'immobilier',
  'autre',
  'dettes',
];

/** Colour of each category, wherever the split is drawn. */
export const COULEURS_CATEGORIES: Record<CategorieActif, string> = {
  liquide: 'var(--color-azur-500)',
  assurance: 'var(--color-jade-500)',
  actions: 'var(--color-brand-500)',
  immobilier: 'var(--color-brand-800)',
  autre: 'var(--color-ink-400)',
  dettes: 'var(--color-brique-500)',
};

export function actif(cle: CleActif): Actif | undefined {
  return ACTIFS.find((a) => a.cle === cle);
}

/** The lines a resident of this country is asked about. */
export function actifsDe(pays: ClePays): Actif[] {
  return ACTIFS.filter((a) => a.pays === pays);
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export type Ligne = {
  cle: CleActif;
  /** Value of the holding, or outstanding capital for a debt. */
  montant: number;
  /** Expected return. Ignored on a line that declares `revenus`. */
  rendement: number;
  /** Rent collected over a year, before costs. */
  loyer: number;
  /** What that rent costs over a year: tax, charges, management, vacancy. */
  charges: number;
  /** Tax on the net rental income. */
  impositionRevenus: number;
};

/** Amounts and rates share the bounds of the simulator they feed. */
export const BORNES_LIGNE = {
  montant: { min: 0, max: 100_000_000 },
  rendement: { min: -0.1, max: 0.2 },
  loyer: { min: 0, max: 10_000_000 },
  impositionRevenus: { min: 0, max: 0.6 },
} as const;

const borne = (v: number, { min, max }: { min: number; max: number }) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/** A line at zero, at its product's own starting rates. */
export function ligneVide(a: Actif): Ligne {
  return {
    cle: a.cle,
    montant: 0,
    rendement: a.rendementParDefaut,
    loyer: 0,
    charges: 0,
    impositionRevenus: a.impositionParDefaut ?? 0,
  };
}

/** A composition with every line of every country at zero. */
export function compositionVide(): Ligne[] {
  return ACTIFS.map(ligneVide);
}

/**
 * Clamps a composition and puts it back in a known shape: one line per asset,
 * in the catalogue's order, whatever the URL happened to carry.
 */
export function bornerComposition(lignes: Ligne[]): Ligne[] {
  return ACTIFS.map((a) => {
    const lue = lignes.find((l) => l.cle === a.cle);
    const vide = ligneVide(a);
    if (lue === undefined) return vide;
    return {
      cle: a.cle,
      montant: borne(lue.montant, BORNES_LIGNE.montant),
      rendement: borne(lue.rendement ?? vide.rendement, BORNES_LIGNE.rendement),
      loyer: borne(lue.loyer ?? 0, BORNES_LIGNE.loyer),
      charges: borne(lue.charges ?? 0, BORNES_LIGNE.loyer),
      impositionRevenus: borne(
        lue.impositionRevenus ?? vide.impositionRevenus,
        BORNES_LIGNE.impositionRevenus,
      ),
    };
  });
}

export type Locatif = {
  /** Rent less running costs: the income the tax applies to. */
  revenuFoncier: number;
  impots: number;
  /** What is left, over the value of the property. */
  net: number;
  rendement: number;
};

/**
 * What a rented property really yields.
 *
 * The tax only bites on a profit: a year where the costs exceed the rent is a
 * loss, not a smaller tax bill, and pretending otherwise would make a bad year
 * look better than it is.
 */
export function locatif(ligne: Ligne): Locatif {
  const revenuFoncier = ligne.loyer - ligne.charges;
  const impots = revenuFoncier > 0 ? revenuFoncier * ligne.impositionRevenus : 0;
  const net = revenuFoncier - impots;
  return {
    revenuFoncier,
    impots,
    net,
    rendement: ligne.montant > 0 ? net / ligne.montant : 0,
  };
}

/** The return a line actually contributes, computed for rented property. */
export function rendementEffectif(ligne: Ligne): number {
  return actif(ligne.cle)?.revenus ? locatif(ligne).rendement : ligne.rendement;
}

export type PartCategorie = {
  categorie: CategorieActif;
  montant: number;
  /** Share of the gross assets, debts excluded from the denominator. */
  part: number;
};

export type Bilan = {
  /** Everything owned, debts aside. */
  brut: number;
  /** Everything owed. */
  dettes: number;
  /** Net worth: what you would be left with after selling and repaying. */
  net: number;
  /**
   * The part that funds withdrawals — net worth less the main residence and
   * the loan against it. This is what the withdrawal simulator calls X.
   */
  productif: number;
  /** The blended return. This is what it calls Y. */
  rendementRecompose: number;
  /** What the capital earns in a year, at that blended rate. */
  gainsAnnuels: number;
  parCategorie: PartCategorie[];
  /** True once anything at all has been entered. */
  renseigne: boolean;
};

/**
 * Turns a list of holdings into the two numbers the withdrawal simulator needs.
 *
 * Only the lines of the country of residence count: a PEA is not something a
 * Japanese resident holds, and leaving it in the total would answer a question
 * nobody asked.
 *
 * The blended return is a weighted average, the weights being the signed
 * amounts — which is what makes a debt lower it rather than merely shrink the
 * capital. When the net is nil or negative the rate is reported as zero rather
 * than as the division it would otherwise be: a household that owes more than
 * it owns has no return to speak of, only a debt to repay.
 */
export function bilan(lignes: Ligne[], pays: ClePays): Bilan {
  const retenues = bornerComposition(lignes).filter(
    (l) => actif(l.cle)?.pays === pays,
  );
  const signeDe = (l: Ligne) => actif(l.cle)?.signe ?? 1;

  const brut = retenues
    .filter((l) => signeDe(l) === 1)
    .reduce((somme, l) => somme + l.montant, 0);
  const dettes = retenues
    .filter((l) => signeDe(l) === -1)
    .reduce((somme, l) => somme + l.montant, 0);

  const productives = retenues.filter((l) => actif(l.cle)?.productif);
  const productif = productives.reduce(
    (somme, l) => somme + signeDe(l) * l.montant,
    0,
  );
  const gains = productives.reduce(
    (somme, l) => somme + signeDe(l) * l.montant * rendementEffectif(l),
    0,
  );

  const parCategorie = CATEGORIES.map((categorie) => {
    const montant = retenues
      .filter((l) => actif(l.cle)?.categorie === categorie)
      .reduce((somme, l) => somme + l.montant, 0);
    return { categorie, montant, part: brut > 0 ? montant / brut : 0 };
  }).filter((c) => c.montant > 0);

  return {
    brut,
    dettes,
    net: brut - dettes,
    productif,
    rendementRecompose: productif > 0 ? gains / productif : 0,
    gainsAnnuels: productif > 0 ? gains : 0,
    parCategorie,
    renseigne: brut > 0 || dettes > 0,
  };
}

// ---------------------------------------------------------------------------
// What holding it all costs
// ---------------------------------------------------------------------------

/**
 * The French wealth tax on property, bracket by bracket.
 *
 * Owed only once the net taxable property passes €1,300,000 — but computed
 * from €800,000 upwards once it does, which is the part everyone gets wrong.
 */
const TRANCHES_IFI = [
  { plancher: 800_000, taux: 0.005 },
  { plancher: 1_300_000, taux: 0.007 },
  { plancher: 2_570_000, taux: 0.01 },
  { plancher: 5_000_000, taux: 0.0125 },
  { plancher: 10_000_000, taux: 0.015 },
] as const;

const SEUIL_IFI = 1_300_000;

/** Abattement on the main residence, before the wealth tax looks at it. */
const ABATTEMENT_RESIDENCE = 0.3;

export function impotFortuneImmobiliere(assiette: number): number {
  if (assiette < SEUIL_IFI) return 0;

  let du = 0;
  for (let i = 0; i < TRANCHES_IFI.length; i++) {
    const { plancher, taux } = TRANCHES_IFI[i];
    const plafond = TRANCHES_IFI[i + 1]?.plancher ?? Number.POSITIVE_INFINITY;
    du += Math.max(0, Math.min(assiette, plafond) - plancher) * taux;
  }

  // Décote entre 1,3 et 1,4 M€, pour que le seuil ne coûte pas d'un coup le
  // montant de toute la tranche précédente.
  return Math.max(0, du - Math.max(0, 17_500 - 0.0125 * assiette));
}

export type CoutDetention = {
  /** Yearly property tax on the home. */
  taxeFonciere: number;
  /** Wealth tax on property, France only. */
  impotFortune: number;
  total: number;
  /**
   * The gross withdrawal it takes to settle that bill, once the withdrawal tax
   * has had its share. Nothing is earned here — this is the income the capital
   * has to produce merely to stay owned.
   */
  revenuMinimum: number;
  /** Share of the productive capital that goes on holding costs alone. */
  partDuPatrimoine: number;
};

/**
 * What you owe every year for owning, before earning anything.
 *
 * Two taxes fall due whatever the markets do: the property tax on the roof over
 * your head, and in France the wealth tax on property. A let property is left
 * out of the first — its own property tax belongs in its running costs, and
 * counting it twice would be worse than not counting it at all.
 *
 * `imposition` is the withdrawal tax rate of the other simulator, which is what
 * turns a bill into the income needed to pay it.
 */
export function coutDetention(
  lignes: Ligne[],
  pays: ClePays,
  imposition: number,
): CoutDetention {
  const retenues = bornerComposition(lignes).filter(
    (l) => actif(l.cle)?.pays === pays,
  );

  const taxeFonciere = retenues.reduce((somme, l) => {
    const a = actif(l.cle);
    return somme + (a?.tauxTaxeFonciere ?? 0) * l.montant;
  }, 0);

  const assiette = retenues.reduce((somme, l) => {
    const a = actif(l.cle);
    if (!a?.immobilierTaxable) return somme;
    // La résidence principale entre pour 70 % de sa valeur.
    const coefficient = a.cle === 'residencePrincipale' ? 1 - ABATTEMENT_RESIDENCE : 1;
    return somme + a.signe * l.montant * coefficient;
  }, 0);

  const impotFortune =
    pays === 'france' ? impotFortuneImmobiliere(Math.max(0, assiette)) : 0;

  const total = taxeFonciere + impotFortune;
  const { productif } = bilan(lignes, pays);
  const part = Math.min(1, Math.max(0, imposition));

  return {
    taxeFonciere,
    impotFortune,
    total,
    revenuMinimum: part < 1 ? total / (1 - part) : 0,
    partDuPatrimoine: productif > 0 ? total / productif : 0,
  };
}

/** Lines held for another country than the one in force, and their total. */
export function ailleurs(lignes: Ligne[], pays: ClePays): number {
  return bornerComposition(lignes)
    .filter((l) => actif(l.cle)?.pays !== pays)
    .reduce((somme, l) => somme + l.montant, 0);
}
