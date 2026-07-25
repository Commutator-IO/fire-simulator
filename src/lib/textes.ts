import type { Langue } from './i18n';

/**
 * Every string the interface shows, in each language.
 *
 * The French entry defines the shape; every other language has to match it, key
 * for key and signature for signature, or the build fails. That is the whole
 * point of typing the dictionary rather than reaching for a runtime lookup: a
 * missing translation is a compile error, not a stray French sentence
 * discovered by an English reader.
 *
 * Anything that varies with a figure is a function rather than a template with
 * placeholders, so word order stays free: a language that puts the number
 * somewhere else in the sentence is not fighting a `{0}` to do it.
 */

const FR = {
  meta: {
    titre: 'FIRE simulator — estimer son patrimoine, en vivre sans y toucher, et sa synthèse',
    description:
      'Boîte à outils patrimoniale : estimer son patrimoine à partir de ses placements réels, calculer combien de temps on peut en vivre sans toucher au capital — retrait, impôts, inflation, projection année par année — et en imprimer la synthèse. France et Japon, barèmes à jour.',
  },

  entete: {
    avertissementDebut: 'Outil pédagogique de simulation —',
    avertissementFort: 'ceci n’est pas un conseil financier.',
    methode: 'Méthode et sources',
    choixLangue: 'Langue de l’interface',
  },

  hero: {
    badge: 'Règle des 4 %, impôts et inflation compris',
    titre: 'Ai-je assez pour vivre de mon patrimoine, sans toucher au capital ?',
    intro:
      'Quatre paramètres suffisent : ce que vous avez, ce que cela rapporte, ce que vous en retirez chaque année et ce que l’impôt prélève. Le verdict se met à jour à chaque déplacement de curseur.',
  },

  onglets: {
    aria: 'Choix du simulateur',
    fire: 'Vivre de mon patrimoine',
    patrimoine: 'Estimer mon patrimoine',
    synthese: 'Synthèse',
    bourse: 'Portefeuille boursier',
    locatif: 'Immobilier locatif',
    aVenir: 'à venir',
  },

  aVenir: {
    badge: 'En développement',
    prevuTitre: 'Ce que cet onglet fera',
    apercuTitre: 'À quoi cela ressemblera',
    apercuTag: 'Maquette — chiffres d’exemple',
  },

  bourse: {
    titre: 'Suivre mon portefeuille boursier',
    intro:
      'Une ligne par position, un prix de revient, un cours : de quoi lire d’un coup d’œil ce que chaque titre a gagné ou perdu, et ce que pèse le portefeuille aujourd’hui. Le suivi n’est pas encore en place — voici ce qu’il calculera.',
    promesses: [
      {
        titre: 'Plus ou moins-value',
        corps:
          'La différence entre le cours et votre prix de revient moyen, par ligne et pour l’ensemble. En euros et en pourcentage, latente tant que vous n’avez pas vendu.',
      },
      {
        titre: 'Prix de revient moyen',
        corps:
          'Recalculé à chaque achat, pour que le gain affiché soit le vôtre et non celui d’un cours d’entrée oublié.',
      },
      {
        titre: 'Plus-values réalisées',
        corps:
          'Ce qui est sorti pour de bon, séparé du latent — parce que seul le réalisé déclenche l’impôt.',
      },
      {
        titre: 'Poids de chaque ligne',
        corps:
          'La part de chaque titre dans le portefeuille, pour voir d’un regard une position devenue trop lourde.',
      },
      {
        titre: 'Alimente l’estimateur',
        corps:
          'La valeur du portefeuille rejoindra la ligne « compte-titres » ou « PEA » de l’onglet Estimer mon patrimoine, sans double saisie.',
      },
      {
        titre: 'Dans le navigateur',
        corps:
          'Vos positions resteront sur votre machine, comme le reste de l’outil. Rien n’est envoyé nulle part.',
      },
    ],
    colTitre: 'Titre',
    colQuantite: 'Qté',
    colPru: 'PRU',
    colCours: 'Cours',
    colValeur: 'Valeur',
    colPl: '± value',
    total: 'Portefeuille',
  },

  locatif: {
    titre: 'Gérer mon portefeuille immobilier locatif',
    intro:
      'Un bien par ligne, ses loyers, ce qu’il coûte et ce qu’il rembourse : de quoi voir lesquels dégagent un cash-flow et lesquels le grèvent, et le rendement net de l’ensemble. La gestion n’est pas encore en place — voici ce qu’elle calculera.',
    promesses: [
      {
        titre: 'Cash-flow réel',
        corps:
          'Loyers encaissés, moins charges, moins l’annuité de crédit : ce qui reste chaque mois une fois la banque et le fisc servis, bien par bien.',
      },
      {
        titre: 'Rendement net',
        corps:
          'Le loyer une fois toutes les charges déduites, rapporté au prix du bien — pas le rendement brut qui vend, celui qu’on touche.',
      },
      {
        titre: 'Poids du crédit',
        corps:
          'Capital restant dû, intérêts de l’année, part déjà remboursée : l’effet de levier ligne à ligne.',
      },
      {
        titre: 'Imposition des loyers',
        corps:
          'Micro-foncier ou réel, prélèvements sociaux compris, pour un cash-flow après impôt et non avant.',
      },
      {
        titre: 'Alimente l’estimateur',
        corps:
          'Valeur des biens et crédits en cours rejoindront les lignes immobilières de l’onglet Estimer mon patrimoine, sans double saisie.',
      },
      {
        titre: 'Dans le navigateur',
        corps:
          'Vos biens resteront sur votre machine, comme le reste de l’outil. Rien n’est envoyé nulle part.',
      },
    ],
    colBien: 'Bien',
    colLoyer: 'Loyers',
    colCharges: 'Charges',
    colNet: 'Net',
    colRendement: 'Rdt net',
    colCashflow: 'Cash-flow',
    total: 'Portefeuille',
  },

  patrimoine: {
    titre: 'De quoi votre patrimoine est-il fait ?',
    intro:
      'Le simulateur de retraits demande deux chiffres que personne n’a en tête : un patrimoine et un rendement. Personne ne détient un portefeuille unique — on a un Livret A, un PEA, une assurance-vie, un appartement avec un crédit dessus, et quand on dirige une société, une réserve qui dort dedans. Listez-les, et les deux chiffres en sortent.',
    sommaire: 'Aller à une famille d’actifs',
    colActif: 'Ligne',
    colMontant: 'Montant',
    colRendement: 'Rendement attendu',
    colRendementCourt: 'Rendement',
    paysHint:
      'Chaque pays a ses enveloppes, ses plafonds et ses taux. Changer de pays change la liste des lignes proposées.',
    horsPays: (montant: string) =>
      `${montant} sont renseignés sur des lignes d’un autre pays. Ils ne sont pas comptés ici, mais rien n’est perdu : ils réapparaissent en changeant de pays de résidence.`,
    horsRetraits: 'hors retraits',
    loyer: 'Loyers encaissés sur l’année',
    charges: 'Ce qu’ils coûtent',
    impositionLoyers: 'Imposition des loyers',
    distributionTitre: 'Si vous vous versiez cette réserve',
    distributionDetail: (impot: string, net: string, taux: string) =>
      `${impot} de flat tax à ${taux}, une seule fois : il vous resterait ${net}. Payée à la distribution, pas chaque année — l’impôt sur les sociétés a déjà fait son passage sur ces bénéfices.`,
    detailLoyers: (loyer: string, charges: string, impots: string, net: string) =>
      `${loyer} de loyers, moins ${charges} de charges, moins ${impots} d’impôt : il reste ${net}.`,
    rendementLoyers: (taux: string) => `Soit ${taux} net sur la valeur du bien.`,
    detentionTitre: 'Ce que la détention coûte, avant même de gagner quoi que ce soit',
    detentionIntro:
      'Certains impôts tombent chaque année du seul fait que vous possédez, quoi que fassent les marchés. Il faut bien les payer avec quelque chose.',
    detentionRien:
      'Aucun impôt de détention ici : vous ne déclarez pas de logement, et votre immobilier reste sous le seuil de l’impôt sur la fortune immobilière.',
    taxeFonciere: 'Taxe foncière de la résidence principale',
    taxeFonciereAide:
      'Un bien loué n’apparaît pas ici : sa propre taxe foncière figure déjà dans ce que ses loyers coûtent, et la compter deux fois serait pire que de ne pas la compter.',
    impotFortune: 'Impôt sur la fortune immobilière',
    impotFortuneAide:
      'Dû au-delà de 1 300 000 € d’immobilier net, mais calculé dès 800 000 € une fois le seuil franchi — c’est la subtilité que tout le monde manque. La résidence principale n’entre que pour 70 % de sa valeur, et les crédits immobiliers se déduisent.',
    detentionTotal: 'Total dû chaque année',
    detentionPart: 'Part du patrimoine productif',
    detentionPartAide:
      'À comparer à votre rendement : c’est autant qui part avant que le premier euro ne soit disponible.',
    revenuMinimum: 'Revenu minimum pour payer ces impôts',
    revenuMinimumAide: (total: string, taux: string, mois: string) =>
      `Il faut retirer ce montant brut pour régler ${total}, une fois ${taux} d’imposition sur le retrait. Soit ${mois} par mois qui ne financent rien d’autre.`,
    revenuMinimumPart: (part: string, gains: string) =>
      `Cela consomme ${part} des ${gains} que votre patrimoine produit dans l’année.`,
    graphiqueTitre: 'Ligne par ligne',
    graphiqueIntro:
      'Chaque ligne à l’échelle, sur un axe commun. Une colonne de chiffres fait comparer des nombres ; des barres font voir la forme d’un patrimoine.',
    graphiqueNote:
      'Les barres pâles ne financent pas vos retraits : la résidence principale, le crédit qui la finance et les titres de votre société comptent dans le patrimoine, pas dans le capital mobilisable.',
    categorie: {
      liquide: 'Épargne de précaution',
      assurance: 'Assurance-vie et retraite',
      actions: 'Actions',
      entreprise: 'Votre société',
      immobilier: 'Immobilier',
      autre: 'Autres',
      dettes: 'Dettes',
    },
    depasse: (montant: string) => `Au-delà du plafond de ${montant}`,
    vide: 'Renseignez au moins une ligne pour voir le bilan.',
    net: 'Patrimoine net',
    netAide: 'Ce qu’il vous resterait après avoir tout vendu et tout remboursé.',
    productif: 'Patrimoine qui finance vos retraits',
    productifAide:
      'Le patrimoine net, moins la résidence principale, le crédit qui la finance et les titres de votre société : un logement réduit vos dépenses et une société non vendue ne verse rien, ni l’un ni l’autre ne produit de revenu.',
    rendement: 'Rendement recomposé',
    rendementAide:
      'La moyenne de vos rendements, pondérée par les montants. Un crédit y entre au signe inversé : son taux tire la moyenne vers le bas, exactement comme l’effet de levier le veut.',
    gains: 'Ce que cela rapporte par an',
    appliquer: 'Utiliser ces chiffres dans le simulateur →',
    impositionRecomposee: 'Imposition recomposée des retraits',
    impositionRecomposeeAide:
      'Un portefeuille composé n’a pas d’enveloppe unique, donc pas de taux unique : un euro retiré est en partie du PEA, en partie du compte-titres, en partie du livret. C’est cette moyenne pondérée que reçoit le simulateur de retraits, présentée là-bas comme un taux personnalisé — parce qu’aucun régime réel ne décrit ce que vous détenez.',
    applique: (patrimoine: string, rendement: string, imposition: string) =>
      `Le simulateur de retraits partira de ${patrimoine} à ${rendement}, imposés à ${imposition}.`,
    dejaApplique: 'Ces chiffres sont déjà ceux du simulateur de retraits.',
    effacer: 'Vider les montants',
    reinitialiser: 'Réinitialiser l’outil',
    reinitialiserAide:
      'Vos saisies restent dans ce navigateur, et nulle part ailleurs. Réinitialiser les oublie et rétablit l’exemple de départ — utile après une erreur, ou quand une mise à jour a changé la forme des données.',
    note: 'Les taux réglementés — Livret A, LDDS, LEP — sont ceux en vigueur. Tous les autres sont des hypothèses de départ, à ajuster ligne par ligne : ce sont vos placements, pas les nôtres.',
    negatif:
      'Vos dettes dépassent vos avoirs. Le rendement n’a plus de sens tant que c’est le cas : il n’y a pas de capital à faire travailler, seulement un crédit à rembourser.',
  },

  synthese: {
    marque: 'FIRE simulator',
    barreTitre: 'Synthèse de mon plan',
    barreSoustitre: 'Quatre volets à faire défiler, prêts à imprimer ou exporter en PDF.',
    imprimer: 'Imprimer / exporter en PDF',
    voletsAria: 'Volets de la synthèse',
    volet: (n: number) => `Volet ${n}`,
    precedent: 'Précédent',
    suivant: 'Suivant',

    // Volet 1 — couverture
    couvertureEyebrow: (pays: string) => `Vivre de son patrimoine · ${pays}`,
    couvertureTitre: 'Synthèse de mon plan',
    couvertureIntro:
      'Ce document suit un même raisonnement de bout en bout : de ce que vous possédez jusqu’au revenu que ce capital peut verser, et combien de temps il tient. Il réunit en quatre volets ce que les onglets calculent séparément.',
    couvertureListe: [
      'Le patrimoine qui finance les retraits, et le rendement qu’on en attend.',
      'Le revenu net que ce capital verse une fois l’impôt payé.',
      'La tenue du capital, année après année, sur tout l’horizon.',
      'Où va chaque euro retiré : ce qui reste en poche, ce qui part en impôts.',
    ],
    couvertureNote:
      'Les chiffres se recoupent d’un volet à l’autre : le patrimoine fonde le retrait, dont découle le revenu, qui décide de la tenue du capital. Outil pédagogique — ceci n’est pas un conseil financier.',
    labelPatrimoine: 'Patrimoine',
    labelRendement: 'Rendement retenu',
    labelRetrait: 'Taux de retrait',
    labelRevenuMois: 'Revenu net / mois',

    // Volet 2 — le patrimoine
    patrimoineTitre: 'D’où viennent ces chiffres',
    patrimoineIntro: (productif: string, rendement: string) =>
      `Le patrimoine se compose de placements aux rendements et fiscalités différents. Le simulateur en retient la partie qui finance les retraits — ${productif} — à un rendement recomposé de ${rendement}.`,
    labelBrut: 'Patrimoine brut',
    labelDettes: 'Dettes',
    labelNet: 'Patrimoine net',
    labelProductif: 'Finance les retraits',
    labelImpositionRecomposee: 'Imposition recomposée des retraits',
    patrimoineVide:
      'L’onglet « Estimer mon patrimoine » n’a pas été renseigné : ce volet reste vide. Le plan ci-après part directement des chiffres saisis dans l’onglet « Vivre de mon patrimoine ».',
    patrimoineEcart: (patrimoine: string, rendement: string, imposition: string) =>
      `Le plan ci-après ne part pas de cette estimation mais de valeurs réglées à la main : ${patrimoine} à ${rendement}, imposés à ${imposition}.`,

    // Volet 3 — le revenu
    revenuTitre: 'Le revenu que ce capital verse',
    revenuIntro: (retrait: string, patrimoine: string) =>
      `Retirer ${retrait} de ${patrimoine} chaque année, l’impôt une fois payé, laisse :`,
    labelRetraitBrut: 'Retrait brut annuel',
    labelImpots: 'Impôts et prélèvements',
    labelRevenuAn: 'Revenu net annuel',
    revenuMarge: (marge: string, variation: string) =>
      `Marge de ${marge} entre rendement et retrait, soit ${variation} de variation du capital sur la première année.`,

    // Volet 4 — la projection
    projectionTitre: (annees: number) => `Ce que le plan devient sur ${annees} ans`,
    labelAnneesTenues: 'Années tenues',
    labelDureeVoulue: 'Durée voulue',
    labelCapitalCourant: 'Capital au terme (euros courants)',
    labelCapitalReel: 'Capital au terme (pouvoir d’achat)',
    ans: 'ans',
    projectionSans:
      'Aucun patrimoine n’est encore renseigné : il n’y a rien à projeter tant que le capital de départ est nul.',
    projectionPreserve: (capital: string) =>
      `Sur tout l’horizon, le capital n’est jamais épuisé : il en reste ${capital} au terme.`,
    projectionSuffisant: (tenues: number, voulue: number, epuisement: number) =>
      `Le capital tient ${tenues} ans — les ${voulue} demandées sont couvertes — puis s’épuise l’année ${epuisement}.`,
    projectionInsuffisant: (tenues: number, voulue: number, epuisement: number) =>
      `Le capital s’épuise l’année ${epuisement}, après ${tenues} ans : c’est avant les ${voulue} années demandées.`,

    // Volet 5 — répartition
    repartitionTitre: 'Où va chaque euro retiré',
    repartitionIntro: (brut: string) =>
      `Décomposition du retrait brut annuel, ${brut}, entre ce qui reste en poche et ce qui part au fisc.`,
    partNet: 'Revenu net en poche',
    partImpots: 'Impôts et prélèvements',
    repartitionNote: (net: string, part: string) =>
      `Sur chaque retrait, vous conservez ${net} nets, soit ${part}. Le reste part en impôts et prélèvements sociaux.`,
    reelFort: 'En pouvoir d’achat :',
    reelCorps: (points: string) =>
      `le retrait indexé sur l’inflation entame lentement le capital réel, de l’ordre de ${points} par an.`,
    trainCouvertFort: 'Train de vie couvert :',
    trainManqueFort: 'Train de vie non couvert :',
    trainCorps: (ecart: string, cible: string, couvert: boolean) =>
      couvert
        ? `le revenu dépasse de ${ecart} par mois les ${cible} visés.`
        : `il manque ${ecart} par mois pour atteindre les ${cible} visés.`,
  },

  saisie: {
    titre: 'Vos hypothèses',
    patrimoineLabel: 'Patrimoine net accumulé',
    patrimoineHint:
      'Vos actifs financiers, nets de dettes. La résidence principale n’en fait pas partie : elle réduit vos dépenses, elle ne verse pas de revenu.',
    rendementLabel: 'Rendement annuel des actifs',
    rendementHint:
      'Moyenne attendue sur la durée, avant impôts, dividendes et plus-values compris. Comptez plutôt 5 % pour un portefeuille prudent, 7 à 8 % pour des actions. De −10 à +20 % par an.',
    retraitLabel: 'Taux de retrait annuel',
    retraitHint:
      'Part du patrimoine retirée chaque année pour vivre. La règle des 4 % vient de là. De 0 à 20 %.',
    paysLabel: 'Pays de résidence',
    enveloppeLabel: 'Votre enveloppe',
    changementPays:
      'Changer de pays recharge ses hypothèses de départ — imposition, taux de retrait et inflation.',
    impositionLabel: 'Imposition des retraits',
    impositionHint: 'Appliquée à la totalité des sommes retirées, de 0 à 60 %.',
    tauxPersonnaliseFort: 'Taux personnalisé.',
    tauxPersonnaliseCorps: (taux: string, pays: string) =>
      `${taux} ne correspond à aucune enveloppe unique en ${pays} — c’est le cas d’un portefeuille réparti sur plusieurs, et le taux que produit l’estimateur de patrimoine. Choisissez une enveloppe ci-dessus pour raisonner sur un seul régime.`,
    afficher: '+ Afficher',
    masquer: '− Masquer',
    avanceSuite: 'les hypothèses de long terme',
    inflationLabel: 'Inflation annuelle',
    inflationHint: (note: string) =>
      `Ce qui décide du pouvoir d’achat de votre revenu dans vingt ans. ${note}`,
    inflationRepere: (pays: string) => `Référence ${pays}`,
    horizonLabel: 'Horizon de projection',
    horizonUnite: 'ans',
    horizonHint:
      'Une retraite anticipée se compte en décennies : quarante ans n’a rien d’excessif.',
    dureeLabel: 'Le capital doit tenir au moins',
    dureeHint:
      'C’est ce qui départage les trois réponses : capital jamais épuisé, épuisé après cette durée, ou avant. Préserver le capital pour toujours et le consommer sur une vie sont deux plans également valables. Plafonné par l’horizon de projection.',
    modeLabel: 'Façon de retirer',
    modeIndexe: 'Montant fixe indexé',
    modeProportionnel: '% du capital',
    modeHintIndexe:
      'La règle des 4 % au sens strict : le montant de la première année est fixé, puis revalorisé de l’inflation. Le pouvoir d’achat est constant, mais le capital peut s’épuiser.',
    modeHintProportionnel:
      'Vous retirez chaque année le même pourcentage de ce que vaut le capital. Il ne peut jamais tomber à zéro, mais votre revenu baisse avec les marchés.',
  },

  verdict: {
    badgePreserve: 'Oui',
    badgeSuffisant: 'Oui, sur la durée voulue',
    badgeInsuffisant: 'Non',
    badgePasEncore: 'Pas encore',
    sousTitrePreserve: 'votre capital est préservé',
    sousTitreSuffisant: (duree: number) =>
      `le capital tient les ${duree} ans demandés, puis s’épuise`,
    sousTitreInsuffisant: (duree: number) => `le capital ne tient pas ${duree} ans`,
    sousTitreSans: 'aucun patrimoine à faire travailler',
    revenuLabel: 'Revenu net disponible',
    parMois: 'par mois',
    soitParAn: (montant: string) => `soit ${montant} par an, une fois l’impôt payé`,
    corpsSans:
      'Sans capital de départ, aucun retrait n’est possible : le revenu est nul quel que soit le taux choisi. Renseignez le patrimoine déjà accumulé, ou utilisez le calcul inverse pour savoir combien il vous faudrait.',
    corpsSansRetrait:
      'Vous ne retirez rien : le capital est préservé par construction. Faites monter le taux de retrait pour voir ce que votre patrimoine peut vous verser.',
    corpsPreserve: (montant: string, marge: string) =>
      `Le rendement couvre le retrait et laisse ${montant} par an dans le capital. Marge de sécurité : ${marge} avant de commencer à y puiser.`,
    corpsLimite:
      'Le rendement couvre exactement le retrait : le capital reste stable en euros, mais sans la moindre marge. Une année de marché en dessous des attentes le fait aussitôt reculer.',
    corpsDeclinSansFin: (montant: string) =>
      `À ce rythme, vous prélevez ${montant} de capital par an en plus de ce qu’il rapporte, sans toutefois l’annuler sur l’horizon simulé.`,
    corpsSuffisant: (tenues: number, duree: number, epuisement: number) =>
      `Le capital est servi pendant ${tenues} ans et s’épuise en année ${epuisement} : au-delà des ${duree} ans que vous demandez. Le plan tient la distance voulue, mais il y consomme le capital — il ne restera rien après.`,
    corpsInsuffisant: (tenues: number, duree: number, epuisement: number) =>
      `Le capital n’est servi que ${tenues} ans et s’épuise en année ${epuisement}, avant les ${duree} ans que vous demandez. Il manque ${duree - tenues} ans.`,
    reelFort: 'En pouvoir d’achat, c’est non.',
    reelCorps: (marge: string) =>
      `Une fois l’inflation payée, il vous manque ${marge} : le revenu affiché achètera moins chaque année.`,
    trainCouvertFort: 'Votre train de vie est couvert.',
    trainManqueFort: 'Il vous manque.',
    trainCorps: (ecart: string, besoin: string, couvert: boolean) =>
      `${couvert ? 'Excédent' : 'Manque'} de ${ecart} par mois par rapport aux ${besoin} dont vous avez besoin.`,
  },

  stats: {
    retraitBrut: 'Retrait brut annuel',
    impots: 'Impôts et prélèvements',
    rendementGenere: 'Rendement annuel généré',
    variationCapital: 'Variation du capital',
    margeAnnexe: (points: string) => `${points} de marge`,
    capitalDans: (annees: number) => `Capital dans ${annees} ans`,
    eurosCourants: 'euros courants',
    eurosAujourdhui: 'd’aujourd’hui',
    noteImpot:
      'L’impôt est supposé porter sur la totalité du retrait, à un taux unique. C’est une simplification volontaire : les enveloppes réelles ne taxent que la part de plus-value, chacune à sa façon.',
    mentionLegale:
      'Simulation indicative, à rendement constant. Elle ne remplace pas l’avis d’un professionnel et ne constitue pas un conseil en investissement.',
  },

  partage: {
    copier: 'Copier le lien de cette simulation',
    copie: 'Lien copié',
    aria: 'Lien de la simulation, à copier',
    note: 'Le lien rouvre la simulation avec tous vos paramètres. Rien n’est enregistré : tout tient dans l’adresse.',
    noteManuelle: 'Copie automatique indisponible : sélectionnez le lien ci-dessus.',
  },

  projection: {
    titre: (annees: number) => `Votre capital sur ${annees} ans`,
    comparerRendement: 'Par rendement',
    comparerPays: 'Par pays',
    introRendement:
      'La courbe centrale suit votre rendement, la zone claire montre ce que deux points de rendement en plus ou en moins changent au bout du compte.',
    introPays:
      'Le même capital, mené selon le plan de départ de chaque pays : son taux de retrait, son imposition et son inflation de référence. Votre rendement et votre horizon sont conservés — ils ne dépendent pas du lieu de résidence.',
    notePays:
      'L’impôt ne déforme pas ces courbes : ce qui sort du portefeuille est le retrait brut, et l’imposition ne mord qu’ensuite, sur le revenu. Ce sont donc les taux de retrait qui les séparent — l’écart d’imposition, lui, se lit sur le revenu indiqué en légende.',
    libelleCentral: 'Central',
    libellePessimiste: 'Pessimiste',
    libelleOptimiste: 'Optimiste',
    serieTaux: (libelle: string, taux: string) => `${libelle} — ${taux} par an`,
    seriePays: (libelle: string, retrait: string, mensuel: string) =>
      `${libelle} — retrait ${retrait}, ${mensuel} net par mois`,
    repereDuree: (annees: number) => `${annees} ans exigés`,
    eurosCourants: 'Euros courants',
    pouvoirAchat: 'Pouvoir d’achat',
    noteCourant:
      'En euros courants, un capital stable paraît rassurant. Basculez sur le pouvoir d’achat pour voir ce que ces euros achèteront réellement.',
    noteConstant: (inflation: string, annees: number) =>
      `Chaque montant est ramené en euros d’aujourd’hui, à ${inflation} d’inflation par an. C’est la lecture qui compte pour un plan qui court sur ${annees} ans.`,
    aria: (annees: number, constant: boolean) =>
      `Évolution du capital sur ${annees} ans, en euros ${constant ? 'constants' : 'courants'}`,
    aujourdhui: 'aujourd’hui',
    an: (n: number) => `an ${n}`,
    survolAujourdhui: 'Aujourd’hui',
    survolAnnee: (n: number) => `Année ${n}`,
    legendeDepart: (montant: string) => `Capital de départ — ${montant}`,
    legendeEpuisement: (annee: number) => `épuisé en année ${annee}`,
  },

  proportions: {
    titre: 'La part de la banque et celle du fisc',
    intro:
      'Deux lectures plutôt qu’une, parce qu’une dette et un impôt ne sont pas de même nature : l’une est un stock, l’autre un flux. Le bilan se pèse contre lui-même, l’année contre elle-même.',
    bilan: 'Ce que vous possédez aujourd’hui',
    brut: 'd’avoirs bruts',
    net: 'À vous',
    dettes: 'À la banque',
    annee: 'Ce que ce patrimoine produit en un an',
    revenusBruts: 'de revenus bruts',
    reste: 'Ce qu’il vous reste',
    interets: 'Intérêts du crédit',
    impots: 'Impôts de détention',
    note: 'Les impôts comptés ici sont ceux de la seule détention — taxe foncière et impôt sur la fortune immobilière. L’imposition des retraits n’y figure pas : elle ne se déclenche que si vous puisez dans le capital, ce qui est la question de l’autre onglet.',
  },

  detail: {
    titre: 'Le détail du calcul',
    revenuTitre: 'Du patrimoine au revenu',
    revenuSous: 'Ce que vous retirez la première année, et ce qu’il en reste après impôt.',
    patrimoineNet: 'Patrimoine net',
    retraitBrut: 'Retrait annuel brut',
    duPatrimoine: (taux: string) => `${taux} du patrimoine`,
    impots: 'Impôts et prélèvements',
    revenuNetAnnuel: 'Revenu net annuel',
    revenuNetMensuel: 'Revenu net mensuel',
    capitalTitre: 'Ce que devient le capital',
    capitalSous:
      'Le rendement d’un côté, le retrait de l’autre : la différence reste dans le capital.',
    rendementGenere: 'Rendement généré',
    variationCapital: 'Variation du capital',
    note: 'L’impôt est calculé sur les sommes retirées, pas sur le rendement : ce qui reste investi n’est pas imposé dans cette simulation. C’est une simplification assumée — les enveloppes réelles ont chacune leurs règles.',
    afficherTableau: '+ Afficher la projection année par année',
    masquerTableau: '− Masquer la projection année par année',
    caption: 'Projection du capital et des retraits, année par année',
    colAnnee: 'Année',
    colCapitalDebut: 'Capital au début',
    colRendement: 'Rendement',
    colRetraitBrut: 'Retrait brut',
    colImpots: 'Impôts',
    colRevenuNet: 'Revenu net',
    colCapitalFin: 'Capital à la fin',
    colReel: 'En euros d’aujourd’hui',
  },

  comparaison: {
    titre: 'Le même plan, selon où vous vivez',
    intro: (patrimoine: string, retrait: string) =>
      `Vos ${patrimoine} et votre retrait de ${retrait} ne bougent pas ; seule l’imposition change. L’écart entre l’enveloppe la plus lourde et la plus légère est ce que votre résidence fiscale vous coûte, ou vous rapporte.`,
    caption:
      'Revenu net et patrimoine nécessaire selon le pays de résidence et l’enveloppe fiscale',
    colEnveloppe: 'Enveloppe',
    colImposition: 'Imposition',
    colRevenuAnnuel: 'Revenu net annuel',
    colParMois: 'Par mois',
    colPatrimoineNecessaire: 'Patrimoine nécessaire',
    colEcartMensuel: 'Écart mensuel',
    votreSituation: 'votre situation',
    note: 'Cliquez sur une enveloppe pour l’appliquer à votre simulation. Les montants restent en euros quel que soit le pays : ce que la résidence change ici, c’est l’imposition, pas la devise ni le coût de la vie — un train de vie japonais ne coûte pas le même prix qu’un train de vie français.',
  },

  objectif: {
    titre: 'Et si on prenait la question à l’envers ?',
    intro:
      'Dites ce qu’il vous faut pour vivre, le simulateur vous dit le patrimoine qu’il faut avoir pour le financer.',
    depensesLabel: 'Ce dont vous avez besoin pour vivre, net',
    depensesUnite: '€ / an',
    depensesPlaceholder: 'Par exemple 30 000',
    depensesHintVide:
      'Renseignez votre train de vie annuel pour obtenir le patrimoine cible. Laissé vide, le simulateur se contente de dire ce que votre capital verse.',
    depensesHintRempli: (mois: string) =>
      `Soit ${mois} par mois. Ce montant s’entend après impôt : c’est ce qui arrive sur votre compte.`,
    explication: (retrait: string, imposition: string, net: string) =>
      `Le calcul renverse la formule du retrait : patrimoine requis = dépenses ÷ (taux de retrait × part qui vous reste après impôt). Avec ${retrait} de retrait et ${imposition} d’imposition, chaque euro de patrimoine vous verse ${net} net par an.`,
    aucunTitre: 'Aucun patrimoine ne suffit',
    aucunCorpsVide: 'Indiquez d’abord vos dépenses annuelles.',
    aucunCorpsImpossible:
      'Avec un taux de retrait nul, ou une imposition qui absorbe tout, aucun capital ne produit de revenu. Ajustez le taux de retrait ou l’imposition.',
    requisLabel: 'Patrimoine nécessaire',
    horsEchelle: 'plus de 100 M€',
    avanceFort: (montant: string) => `${montant} d’avance`,
    avanceCorpsDebut: 'Vous y êtes : ',
    avanceCorpsFin: ' sur l’objectif.',
    manqueDebut: 'Il vous manque ',
    manqueFin: (part: string) => `, soit ${part} du chemin à parcourir.`,
    appliquer: 'Simuler avec ce patrimoine →',
  },

  sources: {
    titre: 'Méthode et sources',
    intro:
      'Le calcul tient en quatre lignes, et c’est volontaire : chaque hypothèse supplémentaire donnerait à la projection une précision qu’elle n’a pas.',
    formulesTitre: 'Les formules',
    fRetrait: 'Retrait brut annuel',
    fRetraitNote: 'X le patrimoine, Z le taux de retrait',
    fImpots: 'Impôts',
    fImpotsNote: 'α le taux d’imposition',
    fNet: 'Revenu net',
    fPreserve: 'Capital préservé si',
    fPreserveNote: 'Y le rendement annuel',
    fReel: '… en pouvoir d’achat si',
    fReelNote: 'i l’inflation',
    fRetraitIndexe: 'Retrait de l’année n',
    fRetraitIndexeNote: 'en mode indexé, X₀ le patrimoine de départ',
    fProjection: 'Capital de l’année n',
    fCible: 'Patrimoine cible',
    scenariosNote: (ecart: string) =>
      `Les scénarios comparés reprennent le même calcul avec un rendement diminué puis augmenté de ${ecart}.`,
    limitesTitre: 'Ce que le simulateur ne fait pas',
    limiteVolatiliteFort: 'Pas de volatilité.',
    limiteVolatilite:
      'Le rendement est constant. Dans la réalité, l’ordre des bonnes et des mauvaises années compte autant que leur moyenne : deux krachs en début de retrait ne se rattrapent pas. Une simulation de Monte-Carlo répondrait à cette question, pas celle-ci.',
    limiteFiscaliteFort: 'Pas de fiscalité fine.',
    limiteFiscalite:
      'Un taux unique s’applique à la totalité des sommes retirées, alors qu’en pratique seule la part de plus-value est imposée. Les enveloppes proposées donnent le bon taux, pas la bonne assiette : le simulateur surestime donc l’impôt, d’autant plus que le portefeuille est jeune.',
    limitePaysFort: 'Pas de coût de la vie, ni de devise.',
    limitePays:
      'La comparaison entre pays ne fait varier que l’imposition. Les montants restent en euros, et un train de vie ne coûte pas le même prix à Paris et à Tokyo. Les règles de résidence fiscale, les conventions contre la double imposition et l’imposition à la sortie du territoire sont hors sujet ici.',
    limiteRevenusFort: 'Pas d’autres revenus.',
    limiteRevenus:
      'Ni pension, ni salaire d’appoint, ni apport futur : le calcul part du seul patrimoine déjà accumulé. La phase d’épargne, elle, n’est pas modélisée.',
    limiteResidenceFort: 'Pas de résidence principale.',
    limiteResidence:
      'Le patrimoine attendu est le patrimoine financier net de dettes. Un logement dont on est propriétaire réduit les dépenses, il ne verse pas de revenu.',
    signaler: 'Signaler une erreur de calcul →',
    discussions: 'Discussions ouvertes',
    code: 'Code source',
    liste: {
      bengen: {
        titre: 'La règle des 4 %',
        detail:
          'William Bengen, « Determining Withdrawal Rates Using Historical Data », Journal of Financial Planning, octobre 1994 : sur des portefeuilles moitié actions moitié obligations, un retrait initial de 4 % indexé sur l’inflation a tenu au moins trente ans sur toutes les périodes historiques testées depuis 1926.',
      },
      pfau: {
        titre: 'La règle des 4 % hors des États-Unis',
        detail:
          'Wade Pfau, « An International Perspective on Safe Withdrawal Rates », Journal of Financial Planning, décembre 2010, sur les données Dimson-Marsh-Staunton depuis 1900 : six pays passent sous 3 % de retrait soutenable, dont la France et le Japon. C’est de là que viennent les taux de retrait proposés par défaut pour chaque pays.',
      },
      pfu: {
        titre: 'France — flat tax sur les revenus de placement',
        detail:
          'Le prélèvement forfaitaire unique réunit 12,8 % d’impôt sur le revenu et les prélèvements sociaux. Ces derniers sont passés de 17,2 % à 18,6 % au 1ᵉʳ janvier 2026 (article 12 de la loi de financement de la sécurité sociale pour 2026), ce qui porte la flat tax à 31,4 % sur les revenus de capitaux mobiliers.',
      },
      pea: {
        titre: 'France — PEA de plus de cinq ans',
        detail:
          'Après cinq ans, les gains du plan échappent à l’impôt sur le revenu ; seuls les prélèvements sociaux restent dus, au taux en vigueur le jour du retrait, soit 18,6 % depuis 2026. Les versements sont plafonnés à 150 000 €.',
      },
      assuranceVie: {
        titre: 'France — assurance-vie de plus de huit ans',
        detail:
          'Rachat imposé à 7,5 % après un abattement annuel de 4 600 € (9 200 € pour un couple) sur la part de gains, pour les primes versées depuis le 27 septembre 2017. Les prélèvements sociaux de l’assurance-vie restent à 17,2 %.',
      },
      nta: {
        titre: 'Japon — imposition des cessions de titres',
        detail:
          'Imposition séparée à 20 % (15 % d’impôt national et 5 % de taxe locale de résidence), majorée de la surtaxe spéciale de reconstruction de 2,1 % sur la part nationale de 2013 à 2037 — soit 20,315 % au total. Barème publié par l’administration fiscale japonaise (fiche nº 1463).',
      },
      nisa: {
        titre: 'Japon — NISA',
        detail:
          'Enveloppe totalement exonérée, sans limite de durée depuis la réforme de 2024, dans la limite de 18 millions de yens de versements sur la vie entière, dont 12 millions pour la poche « croissance ». Site officiel de l’Agence des services financiers.',
      },
      epargneReglementee: {
        titre: 'France — taux de l’épargne réglementée',
        detail:
          'Livret A et LDDS à 1,7 %, LEP à 2,5 % à compter du 1ᵉʳ août 2026. Ces taux sont fixés par arrêté et servent de valeur de départ aux lignes correspondantes du simulateur de patrimoine ; tous les autres rendements proposés sont des hypothèses.',
      },
      bce: {
        titre: 'Cible d’inflation de 2 % — BCE',
        detail:
          'La valeur par défaut de l’inflation en France reprend la cible symétrique de moyen terme de la Banque centrale européenne. L’inflation réellement constatée s’en écarte, parfois durablement : c’est le paramètre qu’il vaut la peine de faire varier en premier.',
      },
      boj: {
        titre: 'Cible d’inflation de 2 % — Banque du Japon',
        detail:
          'Cible fixée en janvier 2013 sur la variation annuelle de l’indice des prix à la consommation. Elle est restée longtemps hors d’atteinte : projeter 2 % d’inflation sur quarante ans au Japon est une hypothèse, pas un constat.',
      },
    },
  },

  pied: {
    resume: 'Simulateur d’indépendance financière — hypothèses simplifiées.',
    signaler: 'Signaler une erreur',
    code: 'Code source',
    mention:
      'Outil informatif. Les montants affichés supposent un rendement constant et une fiscalité réduite à un taux unique : ils ne constituent ni une prévision, ni un conseil en investissement. Rien n’est enregistré, aucune donnée ne quitte votre navigateur.',
  },

  mobile: {
    revenu: 'Revenu net par mois',
    preserve: '✓ Capital préservé',
    suffisant: '✓ Tient la durée voulue',
    insuffisant: '✕ Trop court',
    sans: 'Aucun capital',
  },
};

export type Dictionnaire = typeof FR;

const EN: Dictionnaire = {
  meta: {
    titre: 'FIRE simulator — work out your capital, live off it, and print the summary',
    description:
      'A wealth toolkit: work out your capital from your actual holdings, see how long you can live off it without touching the principal — withdrawal, tax, inflation, a year-by-year projection — and print the summary. France and Japan, up-to-date brackets.',
  },

  entete: {
    avertissementDebut: 'Educational simulation tool —',
    avertissementFort: 'this is not financial advice.',
    methode: 'Method and sources',
    choixLangue: 'Interface language',
  },

  hero: {
    badge: 'The 4% rule, tax and inflation included',
    titre: 'Do I have enough to live off my capital, without touching it?',
    intro:
      'Four parameters are enough: what you have, what it earns, what you take out each year and what the tax takes. The verdict updates on every move of a slider.',
  },

  onglets: {
    aria: 'Choice of simulator',
    fire: 'Living off my capital',
    patrimoine: 'Working out my capital',
    synthese: 'Summary',
    bourse: 'Stock portfolio',
    locatif: 'Rental property',
    aVenir: 'soon',
  },

  aVenir: {
    badge: 'In development',
    prevuTitre: 'What this tab will do',
    apercuTitre: 'What it will look like',
    apercuTag: 'Mock-up — example figures',
  },

  bourse: {
    titre: 'Track my stock portfolio',
    intro:
      'One line per holding, an average cost, a price: enough to read at a glance what each stock has gained or lost, and what the portfolio is worth today. The tracker is not in place yet — here is what it will compute.',
    promesses: [
      {
        titre: 'Profit and loss',
        corps:
          'The gap between the price and your average cost, per line and overall. In euros and per cent, unrealised until you sell.',
      },
      {
        titre: 'Average cost',
        corps:
          'Recomputed on every purchase, so the gain shown is yours and not that of some forgotten entry price.',
      },
      {
        titre: 'Realised gains',
        corps:
          'What has left for good, kept apart from the unrealised — because only realised gains trigger tax.',
      },
      {
        titre: 'Weight of each line',
        corps:
          'Each holding’s share of the portfolio, so a position that has grown too large shows at a glance.',
      },
      {
        titre: 'Feeds the estimator',
        corps:
          'The portfolio value will flow into the brokerage or equity-plan line of the Working out my capital tab, with no double entry.',
      },
      {
        titre: 'In the browser',
        corps:
          'Your holdings will stay on your machine, like the rest of the tool. Nothing is sent anywhere.',
      },
    ],
    colTitre: 'Stock',
    colQuantite: 'Qty',
    colPru: 'Avg cost',
    colCours: 'Price',
    colValeur: 'Value',
    colPl: 'P/L',
    total: 'Portfolio',
  },

  locatif: {
    titre: 'Manage my rental-property portfolio',
    intro:
      'One property per line, its rent, what it costs and what it repays: enough to see which throw off cash and which drain it, and the net yield of the whole. Management is not in place yet — here is what it will compute.',
    promesses: [
      {
        titre: 'Real cash flow',
        corps:
          'Rent collected, less running costs, less the loan repayment: what is left each month once the bank and the taxman are paid, property by property.',
      },
      {
        titre: 'Net yield',
        corps:
          'Rent with every cost deducted, over the price of the property — not the gross yield that sells, the one you actually pocket.',
      },
      {
        titre: 'Weight of the loan',
        corps:
          'Outstanding balance, the year’s interest, the share already repaid: leverage line by line.',
      },
      {
        titre: 'Tax on rents',
        corps:
          'Flat-rate or actual expenses, social levies included, for a cash flow after tax rather than before.',
      },
      {
        titre: 'Feeds the estimator',
        corps:
          'Property values and outstanding loans will flow into the property lines of the Working out my capital tab, with no double entry.',
      },
      {
        titre: 'In the browser',
        corps:
          'Your properties will stay on your machine, like the rest of the tool. Nothing is sent anywhere.',
      },
    ],
    colBien: 'Property',
    colLoyer: 'Rent',
    colCharges: 'Costs',
    colNet: 'Net',
    colRendement: 'Net yld',
    colCashflow: 'Cash flow',
    total: 'Portfolio',
  },

  patrimoine: {
    titre: 'What is your capital made of?',
    intro:
      'The withdrawal simulator asks for two figures nobody has to hand: an amount of capital and a return. Nobody holds a single blended portfolio — they hold a savings account, an equity plan, a life insurance policy, a flat with a mortgage on it. List them, and the two figures fall out.',
    sommaire: 'Jump to a family of assets',
    colActif: 'Line',
    colMontant: 'Amount',
    colRendement: 'Expected return',
    colRendementCourt: 'Return',
    paysHint:
      'Each country has its own accounts, ceilings and rates. Switching country switches the list of lines you are asked about.',
    horsPays: (montant: string) =>
      `${montant} is entered on lines belonging to another country. It is not counted here, but nothing is lost: it reappears when you switch back.`,
    horsRetraits: 'not for withdrawals',
    loyer: 'Rent collected over the year',
    charges: 'What it costs',
    impositionLoyers: 'Tax on the rent',
    distributionTitre: 'Si vous vous versiez cette réserve',
    distributionDetail: (impot: string, net: string, taux: string) =>
      `${impot} de flat tax à ${taux}, une seule fois : il vous resterait ${net}. Payée à la distribution, pas chaque année — l’impôt sur les sociétés a déjà fait son passage sur ces bénéfices.`,
    detailLoyers: (loyer: string, charges: string, impots: string, net: string) =>
      `${loyer} of rent, less ${charges} of costs, less ${impots} of tax: ${net} is left.`,
    rendementLoyers: (taux: string) => `That is ${taux} net on the value of the property.`,
    detentionTitre: 'What holding it costs, before earning anything at all',
    detentionIntro:
      'Some taxes fall due every year for the sole reason that you own, whatever the markets do. They have to be paid with something.',
    detentionRien:
      'No holding tax here: you are not declaring a home, and your property stays below the wealth tax threshold.',
    taxeFonciere: 'Property tax on the main residence',
    taxeFonciereAide:
      'A let property does not appear here: its own property tax already sits in what its rent costs, and counting it twice would be worse than not counting it at all.',
    impotFortune: 'Wealth tax on property',
    impotFortuneAide:
      'Owed above €1,300,000 of net property, but computed from €800,000 once the threshold is passed — the subtlety everyone misses. The main residence counts for only 70% of its value, and property loans are deductible.',
    detentionTotal: 'Total owed each year',
    detentionPart: 'Share of the productive capital',
    detentionPartAide:
      'Worth comparing to your return: this much leaves before the first euro is available.',
    revenuMinimum: 'Minimum income to pay those taxes',
    revenuMinimumAide: (total: string, taux: string, mois: string) =>
      `You have to withdraw this much gross to settle ${total}, once ${taux} of withdrawal tax has had its share. That is ${mois} a month funding nothing else.`,
    revenuMinimumPart: (part: string, gains: string) =>
      `That eats ${part} of the ${gains} your capital produces in a year.`,
    graphiqueTitre: 'Line by line',
    graphiqueIntro:
      'Every line to scale, on a shared axis. A column of figures makes you compare numbers; bars make you see the shape of a portfolio.',
    graphiqueNote:
      'The pale bars do not fund your withdrawals: the main residence and the loan against it count in your net worth, not in the capital you can draw on.',
    categorie: {
      liquide: 'Rainy-day savings',
      assurance: 'Life insurance and pensions',
      actions: 'Equities',
      entreprise: 'Your company',
      immobilier: 'Property',
      autre: 'Other',
      dettes: 'Debts',
    },
    depasse: (montant: string) => `Above the ${montant} ceiling`,
    vide: 'Fill in at least one line to see the statement.',
    net: 'Net worth',
    netAide: 'What you would be left with after selling everything and repaying everything.',
    productif: 'The capital that funds your withdrawals',
    productifAide:
      'Net worth, less the main residence and the loan that paid for it: a home lowers your spending, it does not hand you an income.',
    rendement: 'Blended return',
    rendementAide:
      'The average of your returns, weighted by the amounts. A loan enters it with a minus sign: its rate pulls the average down, which is exactly what leverage does.',
    gains: 'What that earns in a year',
    appliquer: 'Use these figures in the simulator →',
    impositionRecomposee: 'Blended tax on withdrawals',
    impositionRecomposeeAide:
      'A composed portfolio has no single envelope, so no single rate: a euro taken out is part equity plan, part brokerage, part savings account. It is that weighted average the withdrawal simulator receives, shown there as a custom rate — because no real regime describes what you hold.',
    applique: (patrimoine: string, rendement: string, imposition: string) =>
      `The withdrawal simulator will start from ${patrimoine} at ${rendement}, taxed at ${imposition}.`,
    dejaApplique: 'These figures are already the ones the withdrawal simulator uses.',
    effacer: 'Clear the amounts',
    reinitialiser: 'Reset the tool',
    reinitialiserAide:
      'What you type stays in this browser and nowhere else. Resetting forgets it and restores the opening example — handy after a mistake, or when an update has changed the shape of the data.',
    note: 'The regulated rates — Livret A, LDDS, LEP — are the ones in force. Every other one is a starting hypothesis, to be adjusted line by line: they are your holdings, not ours.',
    negatif:
      'Your debts exceed your holdings. A return means nothing while that is the case: there is no capital at work, only a loan to repay.',
  },

  synthese: {
    marque: 'FIRE simulator',
    barreTitre: 'Summary of my plan',
    barreSoustitre: 'Four panels to scroll through, ready to print or export as PDF.',
    imprimer: 'Print / export as PDF',
    voletsAria: 'Summary panels',
    volet: (n: number) => `Panel ${n}`,
    precedent: 'Previous',
    suivant: 'Next',

    couvertureEyebrow: (pays: string) => `Living off your capital · ${pays}`,
    couvertureTitre: 'Summary of my plan',
    couvertureIntro:
      'This document follows one line of reasoning from end to end: from what you own to the income that capital can pay, and how long it lasts. It gathers into four panels what the tabs work out separately.',
    couvertureListe: [
      'The capital that funds withdrawals, and the return expected from it.',
      'The net income that capital pays once tax is settled.',
      'How the capital holds up, year after year, across the horizon.',
      'Where each euro withdrawn goes: what stays in hand, what leaves in tax.',
    ],
    couvertureNote:
      'The figures tie together from one panel to the next: the capital sets the withdrawal, which sets the income, which decides how the capital holds. A teaching tool — this is not financial advice.',
    labelPatrimoine: 'Capital',
    labelRendement: 'Return used',
    labelRetrait: 'Withdrawal rate',
    labelRevenuMois: 'Net income / month',

    patrimoineTitre: 'Where these figures come from',
    patrimoineIntro: (productif: string, rendement: string) =>
      `Your capital is a mix of holdings with different returns and taxation. The simulator keeps the part that funds withdrawals — ${productif} — at a blended return of ${rendement}.`,
    labelBrut: 'Gross assets',
    labelDettes: 'Debts',
    labelNet: 'Net worth',
    labelProductif: 'Funds withdrawals',
    labelImpositionRecomposee: 'Blended tax on withdrawals',
    patrimoineVide:
      'The “Working out my capital” tab has not been filled in, so this panel stays empty. The plan below starts straight from the figures entered on the “Living off my capital” tab.',
    patrimoineEcart: (patrimoine: string, rendement: string, imposition: string) =>
      `The plan below does not start from this estimate but from values set by hand: ${patrimoine} at ${rendement}, taxed at ${imposition}.`,

    revenuTitre: 'The income this capital pays',
    revenuIntro: (retrait: string, patrimoine: string) =>
      `Withdrawing ${retrait} of ${patrimoine} each year, once tax is paid, leaves:`,
    labelRetraitBrut: 'Gross yearly withdrawal',
    labelImpots: 'Tax and levies',
    labelRevenuAn: 'Net yearly income',
    revenuMarge: (marge: string, variation: string) =>
      `A ${marge} margin between return and withdrawal, i.e. ${variation} of capital drift over the first year.`,

    projectionTitre: (annees: number) => `What the plan becomes over ${annees} years`,
    labelAnneesTenues: 'Years served',
    labelDureeVoulue: 'Years asked for',
    labelCapitalCourant: 'Final capital (nominal)',
    labelCapitalReel: 'Final capital (purchasing power)',
    ans: 'years',
    projectionSans:
      'No capital has been entered yet: there is nothing to project while the starting capital is nil.',
    projectionPreserve: (capital: string) =>
      `Across the whole horizon the capital is never exhausted: ${capital} is left at the end.`,
    projectionSuffisant: (tenues: number, voulue: number, epuisement: number) =>
      `The capital lasts ${tenues} years — the ${voulue} asked for are covered — then runs out in year ${epuisement}.`,
    projectionInsuffisant: (tenues: number, voulue: number, epuisement: number) =>
      `The capital runs out in year ${epuisement}, after ${tenues} years: before the ${voulue} asked for.`,

    repartitionTitre: 'Where each euro withdrawn goes',
    repartitionIntro: (brut: string) =>
      `Breakdown of the gross yearly withdrawal, ${brut}, between what stays in hand and what leaves in tax.`,
    partNet: 'Net income in hand',
    partImpots: 'Tax and levies',
    repartitionNote: (net: string, part: string) =>
      `On each withdrawal you keep ${net} net, i.e. ${part}. The rest leaves in tax and social levies.`,
    reelFort: 'In purchasing power:',
    reelCorps: (points: string) =>
      `an inflation-indexed withdrawal slowly eats into the real capital, by around ${points} a year.`,
    trainCouvertFort: 'Lifestyle covered:',
    trainManqueFort: 'Lifestyle not covered:',
    trainCorps: (ecart: string, cible: string, couvert: boolean) =>
      couvert
        ? `income exceeds the ${cible} target by ${ecart} a month.`
        : `it falls ${ecart} a month short of the ${cible} target.`,
  },

  saisie: {
    titre: 'Your assumptions',
    patrimoineLabel: 'Net capital accumulated',
    patrimoineHint:
      'Your financial assets, net of debt. Your home is not part of it: it lowers your spending, it pays no income.',
    rendementLabel: 'Annual return on assets',
    rendementHint:
      'The average expected over the long run, before tax, dividends and capital gains included. Reckon on 5% for a cautious portfolio, 7 to 8% for equities. From −10 to +20% a year.',
    retraitLabel: 'Annual withdrawal rate',
    retraitHint:
      'The share of your capital taken out each year to live on. This is where the 4% rule comes from. From 0 to 20%.',
    paysLabel: 'Country of residence',
    enveloppeLabel: 'Your account type',
    changementPays:
      'Switching country reloads its starting assumptions — tax, withdrawal rate and inflation.',
    impositionLabel: 'Tax on withdrawals',
    impositionHint: 'Applied to the whole of every withdrawal, from 0 to 60%.',
    tauxPersonnaliseFort: 'Custom rate.',
    tauxPersonnaliseCorps: (taux: string, pays: string) =>
      `${taux} matches no single account type in ${pays} — which is what a portfolio spread across several looks like, and what the capital estimator produces. Pick one above to reason on a single regime.`,
    afficher: '+ Show',
    masquer: '− Hide',
    avanceSuite: 'the long-term assumptions',
    inflationLabel: 'Annual inflation',
    inflationHint: (note: string) =>
      `What decides the purchasing power of your income twenty years from now. ${note}`,
    inflationRepere: (pays: string) => `${pays} reference`,
    horizonLabel: 'Projection horizon',
    horizonUnite: 'years',
    horizonHint:
      'Early retirement is counted in decades: forty years is nothing out of the ordinary.',
    dureeLabel: 'The capital has to last at least',
    dureeHint:
      'This is what separates the three answers: capital never exhausted, exhausted after this many years, or before. Preserving capital for ever and spending it over a lifetime are both legitimate plans. Capped by the projection horizon.',
    modeLabel: 'How you withdraw',
    modeIndexe: 'Fixed amount, indexed',
    modeProportionnel: '% of capital',
    modeHintIndexe:
      'The 4% rule in the strict sense: the first year’s amount is fixed, then uprated with inflation. Purchasing power stays constant, but the capital can run out.',
    modeHintProportionnel:
      'You take the same percentage of whatever the capital is worth each year. It can never fall to zero, but your income falls with the markets.',
  },

  verdict: {
    badgePreserve: 'Yes',
    badgeSuffisant: 'Yes, for as long as asked',
    badgeInsuffisant: 'No',
    badgePasEncore: 'Not yet',
    sousTitrePreserve: 'your capital is preserved',
    sousTitreSuffisant: (duree: number) =>
      `the capital lasts the ${duree} years asked for, then runs out`,
    sousTitreInsuffisant: (duree: number) =>
      `the capital does not last ${duree} years`,
    sousTitreSans: 'no capital to put to work',
    revenuLabel: 'Net income available',
    parMois: 'a month',
    soitParAn: (montant: string) => `that is ${montant} a year, once the tax is paid`,
    corpsSans:
      'With no starting capital, no withdrawal is possible: the income is nil whatever rate you choose. Enter the capital you have already accumulated, or use the reverse calculation to find out how much you would need.',
    corpsSansRetrait:
      'You are taking nothing out, so the capital is preserved by construction. Raise the withdrawal rate to see what your capital could pay you.',
    corpsPreserve: (montant: string, marge: string) =>
      `The return covers the withdrawal and leaves ${montant} a year in the capital. Safety margin: ${marge} before you start eating into it.`,
    corpsLimite:
      'The return covers the withdrawal exactly: the capital holds in euros, but with no margin at all. One year of markets below expectations and it starts falling.',
    corpsDeclinSansFin: (montant: string) =>
      `At this pace you are taking ${montant} of capital a year on top of what it earns, without bringing it to zero over the horizon simulated.`,
    corpsSuffisant: (tenues: number, duree: number, epuisement: number) =>
      `The capital pays out for ${tenues} years and runs out in year ${epuisement}: beyond the ${duree} years you asked for. The plan goes the distance, but it spends the capital doing so — nothing will be left after that.`,
    corpsInsuffisant: (tenues: number, duree: number, epuisement: number) =>
      `The capital pays out for only ${tenues} years and runs out in year ${epuisement}, short of the ${duree} you asked for. That is ${duree - tenues} years missing.`,
    reelFort: 'In purchasing power, the answer is no.',
    reelCorps: (marge: string) =>
      `Once inflation is paid for, you are ${marge} short: the income shown will buy less every year.`,
    trainCouvertFort: 'Your way of life is covered.',
    trainManqueFort: 'You are short.',
    trainCorps: (ecart: string, besoin: string, couvert: boolean) =>
      `${couvert ? 'Surplus' : 'Shortfall'} of ${ecart} a month against the ${besoin} you need.`,
  },

  stats: {
    retraitBrut: 'Gross annual withdrawal',
    impots: 'Tax and levies',
    rendementGenere: 'Annual return generated',
    variationCapital: 'Change in capital',
    margeAnnexe: (points: string) => `${points} of margin`,
    capitalDans: (annees: number) => `Capital in ${annees} years`,
    eurosCourants: 'nominal',
    eurosAujourdhui: 'in today’s money',
    noteImpot:
      'Tax is assumed to fall on the whole withdrawal, at a single rate. That is a deliberate simplification: real accounts tax only the capital-gain share, each in its own way.',
    mentionLegale:
      'An indicative simulation, at a constant return. It does not replace professional advice and is not investment advice.',
  },

  partage: {
    copier: 'Copy the link to this simulation',
    copie: 'Link copied',
    aria: 'Link to the simulation, to copy',
    note: 'The link reopens the simulation with all your parameters. Nothing is stored: it all fits in the address.',
    noteManuelle: 'Automatic copying is unavailable: select the link above.',
  },

  projection: {
    titre: (annees: number) => `Your capital over ${annees} years`,
    comparerRendement: 'By return',
    comparerPays: 'By country',
    introRendement:
      'The central curve follows your return; the shaded band shows what two points of return more or less change in the end.',
    introPays:
      'The same capital, run under each country’s own starting plan: its withdrawal rate, its tax and its reference inflation. Your return and your horizon carry over — they do not depend on where you live.',
    notePays:
      'Tax does not bend these curves: what leaves the portfolio is the gross withdrawal, and tax only bites afterwards, on the income. So it is the withdrawal rates that separate them — the difference in tax shows up in the income given in the legend.',
    libelleCentral: 'Central',
    libellePessimiste: 'Pessimistic',
    libelleOptimiste: 'Optimistic',
    serieTaux: (libelle: string, taux: string) => `${libelle} — ${taux} a year`,
    seriePays: (libelle: string, retrait: string, mensuel: string) =>
      `${libelle} — ${retrait} withdrawal, ${mensuel} net a month`,
    repereDuree: (annees: number) => `${annees} years required`,
    eurosCourants: 'Nominal euros',
    pouvoirAchat: 'Purchasing power',
    noteCourant:
      'In nominal euros a flat capital looks reassuring. Switch to purchasing power to see what those euros will actually buy.',
    noteConstant: (inflation: string, annees: number) =>
      `Every amount is restated in today’s money, at ${inflation} inflation a year. That is the reading that matters for a plan running ${annees} years.`,
    aria: (annees: number, constant: boolean) =>
      `Capital over ${annees} years, in ${constant ? 'constant' : 'nominal'} euros`,
    aujourdhui: 'today',
    an: (n: number) => `year ${n}`,
    survolAujourdhui: 'Today',
    survolAnnee: (n: number) => `Year ${n}`,
    legendeDepart: (montant: string) => `Starting capital — ${montant}`,
    legendeEpuisement: (annee: number) => `runs out in year ${annee}`,
  },

  proportions: {
    titre: 'The bank’s share and the taxman’s',
    intro:
      'Two readings rather than one, because a debt and a tax bill are not the same kind of thing: one is a stock, the other a flow. The balance sheet is weighed against itself, the year against itself.',
    bilan: 'What you own today',
    brut: 'of gross assets',
    net: 'Yours',
    dettes: 'The bank’s',
    annee: 'What that capital produces in a year',
    revenusBruts: 'of gross return',
    reste: 'What is left to you',
    interets: 'Interest on the loan',
    impots: 'Holding taxes',
    note: 'The taxes counted here are those of ownership alone — property tax and the wealth tax on property. Tax on withdrawals is absent: it only falls due if you draw on the capital, which is the other tab’s question.',
  },

  detail: {
    titre: 'The calculation in detail',
    revenuTitre: 'From capital to income',
    revenuSous: 'What you take out in the first year, and what is left after tax.',
    patrimoineNet: 'Net capital',
    retraitBrut: 'Gross annual withdrawal',
    duPatrimoine: (taux: string) => `${taux} of capital`,
    impots: 'Tax and levies',
    revenuNetAnnuel: 'Net annual income',
    revenuNetMensuel: 'Net monthly income',
    capitalTitre: 'What becomes of the capital',
    capitalSous:
      'The return on one side, the withdrawal on the other: the difference stays in the capital.',
    rendementGenere: 'Return generated',
    variationCapital: 'Change in capital',
    note: 'Tax is charged on what is withdrawn, not on the return: whatever stays invested is untaxed in this simulation. That is a deliberate simplification — real accounts each have their own rules.',
    afficherTableau: '+ Show the year-by-year projection',
    masquerTableau: '− Hide the year-by-year projection',
    caption: 'Year-by-year projection of capital and withdrawals',
    colAnnee: 'Year',
    colCapitalDebut: 'Capital at start',
    colRendement: 'Return',
    colRetraitBrut: 'Gross withdrawal',
    colImpots: 'Tax',
    colRevenuNet: 'Net income',
    colCapitalFin: 'Capital at end',
    colReel: 'In today’s money',
  },

  comparaison: {
    titre: 'The same plan, depending on where you live',
    intro: (patrimoine: string, retrait: string) =>
      `Your ${patrimoine} and your ${retrait} withdrawal do not move; only the tax changes. The gap between the heaviest and the lightest account is what your tax residence costs you, or earns you.`,
    caption: 'Net income and capital required by country of residence and account type',
    colEnveloppe: 'Account type',
    colImposition: 'Tax',
    colRevenuAnnuel: 'Net annual income',
    colParMois: 'A month',
    colPatrimoineNecessaire: 'Capital required',
    colEcartMensuel: 'Monthly gap',
    votreSituation: 'your situation',
    note: 'Click an account type to apply it to your simulation. Amounts stay in euros whatever the country: what residence changes here is the tax, not the currency nor the cost of living — a Japanese way of life does not cost the same as a French one.',
  },

  objectif: {
    titre: 'What if we asked the question backwards?',
    intro:
      'Say what you need to live on, and the simulator tells you the capital it takes to fund it.',
    depensesLabel: 'What you need to live on, after tax',
    depensesUnite: '€ / year',
    depensesPlaceholder: 'For example 30,000',
    depensesHintVide:
      'Enter your yearly spending to get the capital you are aiming at. Left empty, the simulator merely says what your capital pays.',
    depensesHintRempli: (mois: string) =>
      `That is ${mois} a month. This figure is after tax: it is what lands in your account.`,
    explication: (retrait: string, imposition: string, net: string) =>
      `The calculation turns the withdrawal formula around: capital required = spending ÷ (withdrawal rate × the share left to you after tax). At a ${retrait} withdrawal and ${imposition} tax, every euro of capital pays you ${net} net a year.`,
    aucunTitre: 'No amount of capital is enough',
    aucunCorpsVide: 'Start by entering your yearly spending.',
    aucunCorpsImpossible:
      'With a nil withdrawal rate, or a tax that swallows everything, no capital produces an income. Adjust the withdrawal rate or the tax.',
    requisLabel: 'Capital required',
    horsEchelle: 'over €100m',
    avanceFort: (montant: string) => `${montant} ahead`,
    avanceCorpsDebut: 'You are there: ',
    avanceCorpsFin: ' of the target.',
    manqueDebut: 'You are short of ',
    manqueFin: (part: string) => `, that is ${part} of the way still to go.`,
    appliquer: 'Simulate with this capital →',
  },

  sources: {
    titre: 'Method and sources',
    intro:
      'The calculation fits in four lines, deliberately: every extra assumption would lend the projection a precision it does not have.',
    formulesTitre: 'The formulas',
    fRetrait: 'Gross annual withdrawal',
    fRetraitNote: 'X the capital, Z the withdrawal rate',
    fImpots: 'Tax',
    fImpotsNote: 'α the tax rate',
    fNet: 'Net income',
    fPreserve: 'Capital preserved if',
    fPreserveNote: 'Y the annual return',
    fReel: '… in purchasing power if',
    fReelNote: 'i inflation',
    fRetraitIndexe: 'Withdrawal in year n',
    fRetraitIndexeNote: 'in indexed mode, X₀ the starting capital',
    fProjection: 'Capital in year n',
    fCible: 'Capital target',
    scenariosNote: (ecart: string) =>
      `The compared scenarios run the same calculation with the return lowered then raised by ${ecart}.`,
    limitesTitre: 'What the simulator does not do',
    limiteVolatiliteFort: 'No volatility.',
    limiteVolatilite:
      'The return is constant. In reality the order of the good and bad years matters as much as their average: two crashes early in retirement are never made up. A Monte-Carlo simulation would answer that question; this one does not.',
    limiteFiscaliteFort: 'No fine-grained tax.',
    limiteFiscalite:
      'A single rate applies to the whole of every withdrawal, whereas in practice only the capital-gain share is taxed. The account types give the right rate, not the right base: the simulator therefore overstates the tax, the more so the younger the portfolio.',
    limitePaysFort: 'No cost of living, no currency.',
    limitePays:
      'The comparison between countries varies the tax and nothing else. Amounts stay in euros, and a way of life does not cost the same in Paris and in Tokyo. Tax residence rules, double-taxation treaties and exit taxation are out of scope here.',
    limiteRevenusFort: 'No other income.',
    limiteRevenus:
      'No pension, no part-time salary, no future contribution: the calculation starts from the capital already accumulated. The saving phase is not modelled.',
    limiteResidenceFort: 'No main residence.',
    limiteResidence:
      'The capital expected here is financial, net of debt. A home you own lowers your spending; it pays no income.',
    signaler: 'Report a calculation error →',
    discussions: 'Open discussions',
    code: 'Source code',
    liste: {
      bengen: {
        titre: 'The 4% rule',
        detail:
          'William Bengen, “Determining Withdrawal Rates Using Historical Data”, Journal of Financial Planning, October 1994: on portfolios of half equities and half bonds, an initial 4% withdrawal uprated with inflation lasted at least thirty years over every historical period tested since 1926.',
      },
      pfau: {
        titre: 'The 4% rule outside the United States',
        detail:
          'Wade Pfau, “An International Perspective on Safe Withdrawal Rates”, Journal of Financial Planning, December 2010, on the Dimson-Marsh-Staunton data since 1900: six countries fall below a 3% sustainable withdrawal, France and Japan among them. That is where the default withdrawal rate of each country comes from.',
      },
      pfu: {
        titre: 'France — flat tax on investment income',
        detail:
          'The flat tax combines 12.8% income tax with social levies. Those levies rose from 17.2% to 18.6% on 1 January 2026 (article 12 of the 2026 social security finance act), taking the flat tax to 31.4% on income from securities.',
      },
      pea: {
        titre: 'France — PEA held over five years',
        detail:
          'After five years the plan’s gains escape income tax; only social levies remain due, at the rate in force on the day of withdrawal, that is 18.6% since 2026. Contributions are capped at €150,000.',
      },
      assuranceVie: {
        titre: 'France — life insurance held over eight years',
        detail:
          'Withdrawals taxed at 7.5% after an annual allowance of €4,600 (€9,200 for a couple) on the gain, for premiums paid since 27 September 2017. Social levies on life insurance stay at 17.2%.',
      },
      nta: {
        titre: 'Japan — taxation of securities disposals',
        detail:
          'Taxed separately at 20% (15% national income tax and 5% local inhabitant tax), plus the 2.1% special reconstruction surtax on the national portion from 2013 to 2037 — 20.315% in total. Published by the National Tax Agency (answer no. 1463).',
      },
      nisa: {
        titre: 'Japan — NISA',
        detail:
          'A fully exempt account, with no time limit since the 2024 reform, up to ¥18 million of lifetime contributions, of which ¥12 million for the growth quota. Official site of the Financial Services Agency.',
      },
      epargneReglementee: {
        titre: 'France — regulated savings rates',
        detail:
          'Livret A and LDDS at 1.7%, LEP at 2.5% from 1 August 2026. These rates are set by decree and are the starting values of the matching lines in the net-worth simulator; every other return offered there is a hypothesis.',
      },
      bce: {
        titre: '2% inflation target — ECB',
        detail:
          'The default inflation figure for France follows the European Central Bank’s symmetric medium-term target. Inflation actually observed departs from it, sometimes for a long time: this is the parameter most worth varying first.',
      },
      boj: {
        titre: '2% inflation target — Bank of Japan',
        detail:
          'Set in January 2013 on the year-on-year change in the consumer price index. It stayed out of reach for a long time: projecting 2% inflation over forty years in Japan is an assumption, not an observation.',
      },
    },
  },

  pied: {
    resume: 'Financial independence simulator — simplified assumptions.',
    signaler: 'Report an error',
    code: 'Source code',
    mention:
      'An informational tool. The amounts shown assume a constant return and tax reduced to a single rate: they are neither a forecast nor investment advice. Nothing is stored, and no data leaves your browser.',
  },

  mobile: {
    revenu: 'Net income a month',
    preserve: '✓ Capital preserved',
    suffisant: '✓ Lasts long enough',
    insuffisant: '✕ Too short',
    sans: 'No capital',
  },
};

export const TEXTES: Record<Langue, Dictionnaire> = { fr: FR, en: EN };
