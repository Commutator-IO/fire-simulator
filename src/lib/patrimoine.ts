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
  | 'entreprise'
  | 'immobilier'
  | 'autre'
  | 'dettes';

export type CleActif =
  // France
  | 'livretA'
  | 'lep'
  | 'autreLivret'
  | 'liquidites'
  | 'fondsEuros'
  | 'uniteCompte'
  | 'per'
  | 'pea'
  | 'compteTitres'
  | 'scpi'
  | 'reserveSasu'
  | 'compteCourantSasu'
  | 'titresSasu'
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
  /** Held inside a company, and taxed once on the way out. */
  distribuable?: boolean;
  /**
   * What the taxman takes when money is drawn out of this envelope. Not the
   * same thing as the yearly levies above: this one only bites on withdrawal,
   * and it is what the withdrawal simulator calls α.
   */
  impositionRetrait: number;
  /** A starting hypothesis, editable line by line. */
  rendementParDefaut: number;
  /** Tax on the net rental income, for lines that declare `revenus`. */
  impositionParDefaut?: number;
  /**
   * Levy taken every year on the line's gains, withdrawal or no withdrawal.
   * The euro fund of a French life insurance policy is the case that matters:
   * its published rate is before those levies, and they fall due annually.
   */
  prelevementsAnnuels?: number;
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
    impositionRetrait: 0,
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
    impositionRetrait: 0,
    rendementParDefaut: 0.025,
    plafond: 10_000,
    libelle: { fr: 'Livret d’épargne populaire', en: 'Livret d’épargne populaire' },
    note: {
      fr: 'Sous condition de revenus. Taux réglementé, net d’impôt, plafond de 10 000 €.',
      en: 'Means-tested. Regulated rate, free of tax, ceiling of €10,000.',
    },
  },
  {
    cle: 'autreLivret',
    pays: 'france',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    impositionRetrait: 0,
    rendementParDefaut: 0.02,
    libelle: { fr: 'Autre livret ou épargne', en: 'Other savings account' },
    note: {
      fr: 'Un livret bancaire, un compte à terme, une épargne non listée plus haut : sans plafond ni condition de revenus. Indiquez le rendement net que vous en attendez.',
      en: 'A bank passbook, a term account, any savings not listed above: no ceiling and no means test. Enter the net return you expect from it.',
    },
  },
  {
    cle: 'liquidites',
    pays: 'france',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    impositionRetrait: 0,
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
    impositionRetrait: 0.075,
    rendementParDefaut: 0.025,
    prelevementsAnnuels: 0.186,
    libelle: { fr: 'Assurance-vie — fonds euros', en: 'Life insurance — euro fund' },
    note: {
      fr: 'Capital garanti, rendement de l’ordre de 2,5 % ces dernières années. Les 18,6 % de prélèvements sociaux sont retenus chaque année sur les intérêts, que vous retiriez ou non : le rendement retenu ici en tient compte.',
      en: 'Capital guaranteed, returning around 2.5% in recent years. The 18.6% of social levies are taken every year on the interest, whether you withdraw or not: the rate used here allows for that.',
    },
  },
  {
    cle: 'uniteCompte',
    pays: 'france',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    impositionRetrait: 0.247,
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
    impositionRetrait: 0.3,
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
    impositionRetrait: 0.186,
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
    impositionRetrait: 0.314,
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
    impositionRetrait: 0.314,
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
    impositionRetrait: 0,
    rendementParDefaut: 0,
    impositionParDefaut: 0.3,
    libelle: { fr: 'Immobilier locatif', en: 'Rental property' },
    note: {
      fr: 'Valeur du bien, loyers encaissés sur l’année, et ce qu’ils coûtent : taxe foncière, copropriété, assurance, gestion, travaux, vacance. L’imposition porte sur ce qui reste — barème et prélèvements sociaux pour des revenus fonciers.',
      en: 'The value of the property, the rent collected over the year, and what it costs: property tax, service charges, insurance, management, works, vacancy. The tax applies to what is left — income tax scale and social levies on property income.',
    },
  },
  {
    cle: 'reserveSasu',
    pays: 'france',
    categorie: 'entreprise',
    signe: 1,
    productif: true,
    distribuable: true,
    // Ce que la société tire de sa trésorerie placée supporte l'IS chaque
    // année, avant même la flat tax de sortie. Sans effet tant que le rendement
    // reste à zéro — une réserve dort le plus souvent sans rien rapporter.
    prelevementsAnnuels: 0.25,
    // 12,8 % d'impôt sur le revenu et 18,6 % de prélèvements sociaux depuis la
    // hausse de la CSG sur les revenus du capital : 31,4 %, comme le
    // compte-titres. Le taux rond de 30 % appartient au passé.
    impositionRetrait: 0.314,
    // Zéro par défaut : une réserve est de la trésorerie qui dort, pas un
    // placement. Qui place la sienne saisit le taux, et l'IS le rabote d'un
    // quart.
    rendementParDefaut: 0,
    libelle: {
      fr: 'Réserve facultative de la société',
      en: 'Company retained earnings',
    },
    note: {
      fr: 'Les bénéfices déjà taxés à l’IS et laissés en réserve. À vous, mais pas encore chez vous : les sortir coûte la flat tax, une fois. Rendement à zéro tant qu’elle dort ; si la société la place, indiquez son taux — l’IS en reprend un quart chaque année.',
      en: 'Profits already taxed at corporation tax and left in reserve. Yours, but not yet in your hands: taking them out costs the flat tax, once. Zero return while it sits idle; if the company invests it, enter the rate — corporation tax takes a quarter each year.',
    },
  },
  {
    cle: 'compteCourantSasu',
    pays: 'france',
    categorie: 'entreprise',
    signe: 1,
    productif: true,
    impositionRetrait: 0,
    rendementParDefaut: 0,
    libelle: {
      fr: 'Compte courant d’associé',
      en: 'Shareholder current account',
    },
    note: {
      fr: 'L’argent que vous avez prêté à votre société. Son remboursement n’est pas un revenu : il sort sans impôt, ce qui en fait la ligne la moins chère à récupérer.',
      en: 'Money you lent your own company. Repaying it is not income: it comes out untaxed, which makes it the cheapest line to draw on.',
    },
  },
  {
    cle: 'titresSasu',
    pays: 'france',
    categorie: 'entreprise',
    signe: 1,
    productif: false,
    // Plus-value de cession : même flat tax que n'importe quel titre.
    impositionRetrait: 0.314,
    rendementParDefaut: 0,
    libelle: {
      fr: 'Titres de la société',
      en: 'Shares in the company',
    },
    note: {
      fr: 'Ce que vaudrait votre société, capital social compris, sans la trésorerie déjà listée au-dessus, si quelqu’un l’achetait. Compté dans le patrimoine, jamais dans ce qui finance vos retraits : tant que vous ne vendez pas, cette valeur ne verse rien.',
      en: 'What your company would fetch — share capital included, net of the cash already listed above — if someone bought it. Counted in net worth, never in what funds your withdrawals: until you sell, that value pays nothing out.',
    },
  },
  {
    cle: 'residencePrincipale',
    pays: 'france',
    categorie: 'immobilier',
    signe: 1,
    productif: false,
    immobilierTaxable: true,
    impositionRetrait: 0,
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
    impositionRetrait: 0.314,
    rendementParDefaut: 0,
    libelle: { fr: 'Autres actifs', en: 'Other assets' },
    note: {
      fr: 'Or, cryptomonnaies, œuvres, objets de collection… À vous d’en fixer le rendement attendu. Les titres de votre société ont leur propre ligne, plus haut.',
      en: 'Gold, crypto, art, collectibles… the expected return is yours to set. Shares in your own company have their own line, above.',
    },
  },
  {
    cle: 'creditResidence',
    pays: 'france',
    categorie: 'dettes',
    signe: -1,
    productif: false,
    immobilierTaxable: true,
    impositionRetrait: 0,
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
    impositionRetrait: 0,
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
    impositionRetrait: 0.20315,
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
    impositionRetrait: 0.20315,
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
    impositionRetrait: 0,
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
    impositionRetrait: 0.20315,
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
    impositionRetrait: 0.20315,
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
    impositionRetrait: 0.20315,
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
    impositionRetrait: 0,
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
    impositionRetrait: 0,
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
    impositionRetrait: 0,
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
    impositionRetrait: 0.20315,
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
    impositionRetrait: 0,
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
  'entreprise',
  'immobilier',
  'autre',
  'dettes',
];

/** Colour of each category, wherever the split is drawn. */
export const COULEURS_CATEGORIES: Record<CategorieActif, string> = {
  liquide: 'var(--color-azur-500)',
  assurance: 'var(--color-jade-500)',
  actions: 'var(--color-brand-500)',
  entreprise: 'var(--color-prune-500)',
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

/**
 * The return a line actually contributes.
 *
 * Computed from the rent for a let property; net of the yearly levies for a
 * product that suffers them whether or not anything is withdrawn.
 */
export function rendementEffectif(ligne: Ligne): number {
  const a = actif(ligne.cle);
  if (a?.revenus) return locatif(ligne).rendement;
  return ligne.rendement * (1 - (a?.prelevementsAnnuels ?? 0));
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

// ---------------------------------------------------------------------------
// A statement to open on
// ---------------------------------------------------------------------------

/**
 * Amounts a first-time visitor lands on, per country.
 *
 * Not zeroes: an empty form says nothing about what the tool does, and the
 * chart, the blended return and the holding costs all need something to chew
 * on. These are a plausible, diversified household — a rainy-day fund, a life
 * insurance policy, an equity plan, a let flat with its rent, a home with a
 * mortgage on it — rounded to figures nobody will mistake for their own.
 */
const EXEMPLES: Partial<Record<CleActif, Partial<Ligne>>> = {
  livretA: { montant: 25_000 },
  liquidites: { montant: 8_000 },
  fondsEuros: { montant: 40_000 },
  uniteCompte: { montant: 60_000 },
  per: { montant: 30_000 },
  pea: { montant: 120_000 },
  compteTitres: { montant: 90_000 },
  scpi: { montant: 30_000 },
  reserveSasu: { montant: 60_000 },
  compteCourantSasu: { montant: 15_000 },
  titresSasu: { montant: 150_000 },
  immobilierLocatif: { montant: 200_000, loyer: 9_600, charges: 2_900 },
  residencePrincipale: { montant: 350_000 },
  creditResidence: { montant: 150_000 },

  futsuYokin: { montant: 20_000 },
  teikiYokin: { montant: 30_000 },
  nisa: { montant: 120_000 },
  tokutei: { montant: 90_000 },
  ideco: { montant: 40_000 },
  jreit: { montant: 30_000 },
  locatifJp: { montant: 200_000, loyer: 9_600, charges: 2_900 },
  residenceJp: { montant: 350_000 },
  creditResidenceJp: { montant: 150_000 },
};

export function compositionParDefaut(): Ligne[] {
  return ACTIFS.map((a) => ({ ...ligneVide(a), ...(EXEMPLES[a.cle] ?? {}) }));
}

/**
 * What is left of a company reserve once it is paid out as a dividend.
 *
 * A one-off, not a yearly drag: the corporation tax has already been paid on
 * those profits, and the flat tax falls once, on the way out. Which is why the
 * reserve is shown gross and this figure sits beside it — netting it down in
 * place would hide the toll rather than name it.
 */
export function distribution(montant: number, taux: number): {
  brut: number;
  impot: number;
  net: number;
} {
  const brut = Math.max(0, montant);
  const impot = brut * taux;
  return { brut, impot, net: brut - impot };
}

/** True once a composition holds anything at all. */
export function estRenseignee(lignes: Ligne[]): boolean {
  return lignes.some((l) => l.montant > 0);
}

/**
 * The tax rate a withdrawal from this portfolio actually suffers.
 *
 * A composed portfolio has no single envelope, so it has no single rate: a euro
 * taken out is part equity plan, part brokerage account, part savings account,
 * and the blend is what matters. Hence a custom rate handed to the withdrawal
 * simulator rather than one regime's — none of them describes what is held.
 *
 * A let property counts at zero: its return was already stated net of the tax
 * on its rents, and taxing it a second time would contradict that in the same
 * breath.
 */
export function impositionRecomposee(lignes: Ligne[], pays: ClePays): number {
  const retenues = bornerComposition(lignes).filter((l) => {
    const a = actif(l.cle);
    return a?.pays === pays && a.productif && a.signe === 1;
  });
  const assiette = retenues.reduce((somme, l) => somme + l.montant, 0);
  if (assiette <= 0) return 0;
  return (
    retenues.reduce(
      (somme, l) => somme + l.montant * (actif(l.cle)?.impositionRetrait ?? 0),
      0,
    ) / assiette
  );
}

/**
 * What has been entered for another country than the one in force.
 *
 * Measured against the opening example rather than against zero: the example
 * fills both catalogues, so that switching country shows a statement rather
 * than a blank form. Reporting those amounts as "entered elsewhere" would be
 * announcing the user's own data back to them before they had typed anything.
 */
export function ailleurs(lignes: Ligne[], pays: ClePays): number {
  const exemple = compositionParDefaut();
  return bornerComposition(lignes)
    .filter((l) => actif(l.cle)?.pays !== pays)
    .filter((l) => l.montant !== exemple.find((e) => e.cle === l.cle)?.montant)
    .reduce((somme, l) => somme + l.montant, 0);
}

// ---------------------------------------------------------------------------
// La part de la banque et celle du fisc
// ---------------------------------------------------------------------------

export type Proportions = {
  /** Everything owned, and how it splits between you and the bank. */
  brut: number;
  net: number;
  dettes: number;
  partDettes: number;

  /** A year's worth of return, before anything is taken out of it. */
  revenusBruts: number;
  /** Interest on the loans, over that year. */
  interets: number;
  /** Property tax and wealth tax, over that year. */
  impotsDetention: number;
  /** What is left of the year's return once both have been paid. */
  reste: number;
  partInterets: number;
  partImpots: number;
};

/**
 * Where you stand today: what share of the capital is the bank's, and what
 * share of a year's return the bank and the taxman take between them.
 *
 * Two readings rather than one, because a debt is a stock and a tax bill is a
 * flow: comparing €150,000 owed against €2,450 of property tax on the same bar
 * would say nothing at all. The first split weighs the balance sheet, the
 * second weighs the year.
 *
 * The tax on withdrawals is deliberately absent — it only falls due if you
 * actually draw on the capital, which is the other simulator's question.
 */
export function proportions(
  lignes: Ligne[],
  pays: ClePays,
  cout: CoutDetention,
): Proportions {
  const b = bilan(lignes, pays);
  const retenues = bornerComposition(lignes).filter(
    (l) => actif(l.cle)?.pays === pays,
  );

  // Seuls les avoirs productifs rapportent — un toit épargne un loyer, il n'en
  // verse pas. Toutes les dettes coûtent en revanche, y compris celle qui
  // finance ce toit : ses intérêts se paient chaque année, quoi qu'elle achète.
  const revenusBruts = retenues
    .filter((l) => actif(l.cle)?.signe === 1 && actif(l.cle)?.productif)
    .reduce((somme, l) => somme + l.montant * rendementEffectif(l), 0);

  const interets = retenues
    .filter((l) => actif(l.cle)?.signe === -1)
    .reduce((somme, l) => somme + l.montant * l.rendement, 0);

  const part = (v: number, total: number) => (total > 0 ? v / total : 0);

  return {
    brut: b.brut,
    net: b.net,
    dettes: b.dettes,
    partDettes: part(b.dettes, b.brut),
    revenusBruts,
    interets,
    impotsDetention: cout.total,
    reste: revenusBruts - interets - cout.total,
    partInterets: part(interets, revenusBruts),
    partImpots: part(cout.total, revenusBruts),
  };
}
