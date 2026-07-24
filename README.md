# FIRE simulator

« Est-ce que j'ai assez pour vivre de mon patrimoine sans toucher au capital ? »

Deux simulateurs, dans deux onglets, dont le second répond aux questions que le
premier pose.

| Onglet | Ce qu'il répond |
| --- | --- |
| **Estimer mon patrimoine** | Ce que vous possédez, ce que cela rapporte et ce que la détention coûte, à partir de vos placements réels |
| **Vivre de mon patrimoine** | Ce que ce capital peut vous verser, combien de temps il tient, et ce que la fiscalité de votre pays y change |

Le premier ouvre l'application, parce qu'il fabrique les deux chiffres que le
second réclame. Les deux fonctionnent séparément : un bouton passe le résultat
de l'un à l'autre, rien ne se propage tout seul.

## Démarrer

```bash
npm install
npm run dev      # serveur de développement
npm test         # 209 tests sur les moteurs, les formats et les traductions
npm run build    # build de production
npm run lint
```

L'interface se lit en **français ou en anglais**, au choix depuis l'en-tête.
L'application s'ouvre en français ; le choix de l'utilisateur est retenu dans
l'adresse. La langue est indépendante du pays de résidence : vivre au Japon et
lire en anglais est une combinaison parfaitement ordinaire.

## Comment ça marche

Quatre paramètres suffisent au verdict :

| Symbole | Paramètre | Par défaut | Bornes |
| --- | --- | --- | --- |
| **X** | Patrimoine net accumulé | 500 000 € | 0 à 100 M€ |
| **Y** | Rendement annuel des actifs | 5 % | −10 à +20 % |
| **Z** | Taux de retrait annuel | 3,5 % | 0 à 20 % |
| **α** | Imposition des retraits | 31,4 % | 0 à 60 % |

Les valeurs de départ viennent du **pays de résidence**, pas de nombres ronds :
voir la section suivante.

```
retrait brut annuel        R    = X × Z
impôts                     T    = R × α
revenu net annuel          Rnet = X × Z × (1 − α)
rendement généré           G    = X × Y
variation du capital       ΔX   = X × (Y − Z)
```

**Le capital est préservé si et seulement si Z ≤ Y** — le rendement couvre le
retrait. En pouvoir d'achat, la condition devient `Z ≤ Y − i`, et c'est souvent
là que le « oui » se transforme en « non » : 4 % de retrait pour 5 % de rendement
et 2 % d'inflation préserve le capital en euros mais l'érode en pouvoir d'achat.

### Le patrimoine, recomposé à partir de ce qu'on possède

Le premier onglet s'ouvre sur deux chiffres que personne n'a en tête : un
patrimoine et un rendement. Le second les fabrique à partir des placements
réels, **et le catalogue dépend du pays** : un PEA ne veut rien dire pour un
résident japonais, un NISA rien pour un résident français, et un dépôt à vue ne
rapporte pas la même chose à Tokyo et à Paris.

| | Lignes proposées |
| --- | --- |
| France | Livret A et LDDS, LEP, liquidités, fonds euros, unités de compte, PER, PEA, compte-titres, SCPI, immobilier locatif, résidence principale, autres actifs, crédit de la résidence, autres crédits |
| Japon | Dépôt à vue, dépôt à terme, NISA, compte-titres imposable, iDeCo, J-REIT, immobilier locatif, résidence principale, autres actifs, crédit de la résidence, autres crédits |

**Le rendement recomposé** est la moyenne des rendements, pondérée par les
montants :

```
Y = Σ (signe × montant × rendement) ÷ Σ (signe × montant)
```

Deux distinctions portent tout le modèle.

**Une dette est un actif au signe inversé**, et son taux un rendement négatif.
Ce n'est pas une astuce : c'est ce qu'est l'effet de levier, et l'écrire ainsi
fait sortir le rendement juste sans cas particulier. 500 000 € à 5 % contre
200 000 € à 3 % laissent 300 000 € qui rapportent 22 000 €, soit 7,33 % — ce que
la moyenne pondérée donne exactement.

**Posséder son logement n'est pas un revenu.** La résidence principale et le
crédit qui la finance sortent donc du patrimoine qui alimente les retraits, mais
restent dans le patrimoine net : c'est une richesse réelle, elle ne paie
simplement pas les courses. Les exclure séparément fausserait le total, d'où
deux lignes de crédit distinctes.

**Un bien loué gagne son loyer, pas un taux.** Son rendement est donc calculé et
non saisi : loyers de l'année, moins ce qu'ils coûtent — taxe foncière,
copropriété, gestion, vacance —, moins l'impôt sur ce qui reste, le tout sur la
valeur du bien. Un rendement annoncé sur le loyer brut vaut couramment le double
du vrai.

### Ce que la détention coûte

Certains impôts tombent chaque année du seul fait qu'on possède, quoi que
fassent les marchés : la taxe foncière du logement, et en France l'impôt sur la
fortune immobilière au-delà de 1 300 000 € d'immobilier net — calculé, une fois
le seuil franchi, **dès 800 000 €**, ce que tout le monde manque. La résidence
principale n'y entre que pour 70 % de sa valeur.

Le simulateur les additionne et en tire le **revenu minimum** : ce qu'il faut
retirer brut, imposition du retrait comprise, uniquement pour rester
propriétaire. Un bien loué n'entre pas dans la taxe foncière du calcul — la
sienne figure déjà dans ce que ses loyers coûtent.

### La part de la banque et celle du fisc

Un troisième graphique répond à la question telle qu'elle se pose vraiment :
aujourd'hui, quelle part de tout cela n'est pas à moi ? Deux barres, et pas une
seule, parce qu'une dette et un impôt ne sont pas de même nature — l'une est un
stock, l'autre un flux. Poser 150 000 € dus à une banque à côté de 2 450 € de
taxe foncière sur la même échelle ne dirait rien du tout.

```
avoirs bruts   = patrimoine net + dette
revenus bruts  = ce qui reste + intérêts du crédit + impôts de détention
```

Le bilan se pèse contre lui-même, l'année contre elle-même. Seuls les avoirs
productifs rapportent — un toit épargne un loyer, il n'en verse pas — mais
toutes les dettes coûtent, y compris celle qui finance ce toit : ses intérêts se
paient chaque année, quoi qu'elle achète. Si les deux prélèvements dépassent ce
que le patrimoine produit, la barre se remplit d'eux plutôt que de déborder en
silence.

### Ce qu'on détient à travers sa société

Un chef d'entreprise a une partie de son patrimoine ailleurs que sur ses
comptes, et les trois lignes n'ont rien à voir entre elles :

| Ligne | Ce qu'elle finance | Impôt à la sortie |
| --- | --- | --- |
| Réserve facultative | Mobilisable | 30 % de flat tax, **une fois** |
| Compte courant d'associé | Mobilisable | Aucun — un remboursement n'est pas un revenu |
| Titres de la société | Rien tant qu'on ne vend pas | 30 % à la cession |

La réserve est affichée brute, avec en regard ce qu'une distribution
laisserait : la ramener nette en silence cacherait le péage au lieu de le
nommer. Son rendement, lui, supporte l'impôt sur les sociétés chaque année tant
qu'il reste dans l'entreprise. Les titres comptent dans le patrimoine et jamais
dans le capital qui finance les retraits, exactement comme la résidence
principale — une société qu'on n'a pas vendue ne verse rien.

### Le taux de retrait d'un portefeuille composé

Un portefeuille réparti sur plusieurs enveloppes n'a pas de taux d'imposition
unique : un euro retiré est en partie du PEA à 18,6 %, en partie du compte-titres
à 31,4 %, en partie du livret à 0 %. L'estimateur en calcule la **moyenne
pondérée** et la transmet au simulateur de retraits, qui la présente comme un
taux personnalisé — parce qu'aucun régime réel ne décrit ce qui est détenu. Sur
l'exemple d'ouverture, cela donne 15,5 % — la réserve de la société à 30 % et le compte courant à 0 % tirant chacun de leur côté.

**Les impôts pris en compte**, et ceux qui ne le sont pas :

| Prélèvement | Traitement |
| --- | --- |
| Taxe foncière du logement | Ligne dédiée, taux paramétrable |
| Impôt sur la fortune immobilière | Barème complet, décote, résidence à 70 %, crédits déduits |
| 固定資産税 et 都市計画税 (Japon) | Ligne dédiée, 1,2 % par défaut |
| Prélèvements sociaux du fonds euros | Retenus chaque année sur les intérêts : le rendement de la ligne en tient compte |
| Impôt sur les revenus fonciers | Dans le calcul du bien loué |
| Taxe foncière d'un bien loué | Dans ses charges, jamais comptée deux fois |
| Imposition des retraits | Onglet « vivre de mon patrimoine » |
| Droits de succession, imposition de sortie | Hors périmètre |
| Taxe d'habitation | Supprimée sur les résidences principales |

### Ce qui reste dans le navigateur

Les saisies de l'estimateur sont conservées **dans le navigateur**, et nulle part
ailleurs. L'adresse reste prioritaire — c'est elle qu'on partage —, le stockage
local ne servant qu'à revenir sans lien. Il porte un numéro de version : une
mise à jour qui change la forme d'une ligne jette ce qu'elle ne sait plus lire
plutôt que de le lire à moitié. Et un bouton **réinitialise tout**, pour le jour
où quelque chose se passe mal quand même.

Seuls les taux réglementés — Livret A et LDDS à 1,7 %, LEP à 2,5 % au 1ᵉʳ août
2026 — sont des valeurs officielles. Tous les autres rendements proposés sont
des hypothèses de départ, modifiables ligne par ligne.

### Trois réponses, pas deux

« Le capital s'épuise » n'est pas une situation mais deux, et le verdict le dit
avec trois couleurs plutôt qu'un oui/non. Vous indiquez **combien d'années le
capital doit tenir** (30 par défaut, l'horizon des travaux de Bengen) :

| | Ce qui se passe |
| --- | --- |
| **Vert** | Rien ne s'épuise sur tout l'horizon de projection |
| **Orange** | Le capital s'épuise, mais après les années demandées — c'est un plan, pas un échec : à 65 ans on n'a pas de raison d'exiger un capital qui vous survive |
| **Rouge** | Il s'épuise avant |

Cette lecture ne dit pas la même chose que le verdict nominal `Z ≤ Y`, et le
désaccord est instructif : avec l'inflation, un retrait indexé sous le rendement
finit tout de même par vider le capital, si bien qu'un « oui » en euros peut
recouvrir un plan qui s'arrête en année 38.

Quatre paramètres complètent la projection : les dépenses annuelles cibles **D**
(pour comparer le revenu au train de vie et calculer le patrimoine nécessaire,
`X = D ÷ (Z × (1 − α))`), l'inflation **i**, l'horizon **N** et la durée que le
capital doit tenir.

### Les deux façons de retirer

La spécification décrit deux formules qui ne donnent pas le même résultat, et
le simulateur les propose toutes les deux plutôt que d'en choisir une en
silence :

- **Montant fixe indexé** (par défaut) — la règle des 4 % au sens strict. Le
  montant de la première année est fixé, puis revalorisé de l'inflation :
  `Retrait(n) = X₀ × Z × (1 + i)^(n−1)`. Le pouvoir d'achat est constant, mais
  le capital peut s'épuiser, et le simulateur affiche alors l'année
  d'épuisement.
- **Pourcentage du capital** — le retrait est recalculé chaque année sur ce que
  vaut le capital, ce qui correspond exactement au `ΔX = X × (Y − Z)` du calcul
  de première année. Le capital ne tombe jamais à zéro, mais le revenu suit les
  marchés.

Dans les deux cas le rendement de l'année est crédité avant le retrait, et le
retrait est plafonné par ce qui reste : le capital s'arrête à zéro au lieu de
devenir négatif.

### Pays de résidence

L'imposition α n'est pas une hypothèse abstraite : elle dépend d'où l'on vit et
de l'enveloppe utilisée. Le simulateur propose les régimes réels de deux pays,
et compare le même plan de l'un à l'autre.

| Pays | Enveloppe | α | Composition |
| --- | --- | --- | --- |
| France | Compte-titres, flat tax | **31,4 %** | 12,8 % d'IR + 18,6 % de prélèvements sociaux (relevés de 17,2 % au 1ᵉʳ janvier 2026) |
| France | PEA de plus de 5 ans | **18,6 %** | Prélèvements sociaux seuls ; versements plafonnés à 150 000 € |
| France | Assurance-vie de plus de 8 ans | **24,7 %** | 7,5 % d'IR + 17,2 % de prélèvements sociaux — l'assurance-vie n'a pas suivi la hausse de 2026 |
| Japon | Compte imposable (*tokutei kōza*) | **20,315 %** | 15 % d'impôt national + 5 % de taxe locale + surtaxe de reconstruction de 2,1 % sur la part nationale, jusqu'en 2037 |
| Japon | NISA | **0 %** | Exonération sans limite de durée, dans la limite de 18 M¥ de versements |

Ces enveloppes sont des **préréglages, pas un mode** : le curseur d'imposition
reste libre, et un taux qui ne correspond à aucune enveloppe est présenté comme
personnalisé plutôt que ramené de force au régime le plus proche.

**Chaque pays porte aussi ses propres valeurs de départ**, et pas seulement son
taux d'imposition — les charger toutes ensemble est ce qui fait d'un pays un
scénario plutôt qu'un simple réglage fiscal.

| | Rendement | Retrait | Inflation | Enveloppe |
| --- | --- | --- | --- | --- |
| France | 5 % | **3,5 %** | 2 % | Compte-titres, 31,4 % |
| Japon | 5 % | **3 %** | 2 % | Compte imposable, 20,315 % |

Les taux de retrait viennent des données historiques réunies par Wade Pfau :
en France, un retrait de 4 % a échoué dans **71,3 %** des périodes de trente ans,
et le Japon est le contre-exemple classique de la règle des 4 % — le retrait
historiquement soutenable y tombe à **0,25 %** sur un portefeuille domestique, et
ne remonte qu'à **2,2 %** avec une diversification mondiale. Partir de 3 % y reste
optimiste, ce que l'application dit sous le sélecteur de pays.

Le rendement, lui, ne dépend pas du pays : c'est celui du portefeuille, et un
portefeuille diversifié est le même où que l'on vive.

Trois limites à garder en tête, dites aussi dans l'application :

- **Le taux est bon, l'assiette ne l'est pas.** Partout, l'impôt ne frappe que
  la plus-value contenue dans le retrait ; le simulateur l'applique au retrait
  entier et surestime donc l'impôt, d'autant plus que le portefeuille est jeune.
- **Pas de devise ni de coût de la vie.** Les montants restent en euros quel que
  soit le pays. Ce que la résidence change ici, c'est l'imposition — pas le prix
  d'un loyer à Tokyo.
- **Pas de règles de résidence.** Conventions fiscales, seuils de résidence,
  imposition à la sortie du territoire : hors périmètre.

Ajouter un pays tient dans `src/lib/pays.ts` : une entrée dans `PAYS`, ses
régimes avec leur taux, leur composition et leur réserve, plus les sources dans
`src/components/Sources.tsx`. Rien d'autre à toucher — le moteur ne connaît que
α.

### Scénarios comparés

Le graphique se lit de deux façons, au choix.

**Par rendement** — la projection est jouée trois fois, à `Y − 2 points`, `Y` et
`Y + 2 points`. Un rendement constant n'a pas la précision qu'une courbe unique
laisserait croire ; ce qui compte est la marge dont le plan dispose avant de
casser.

**Par pays** — les deux pays sont superposés, chacun avec son plan de départ :
son taux de retrait, son imposition et son inflation de référence. Le patrimoine,
le rendement et l'horizon sont ceux de l'utilisateur, puisqu'ils ne dépendent pas
du lieu de résidence.

À noter, parce que ce n'est pas intuitif : **l'imposition ne déforme pas une
courbe de capital**. Ce qui sort du portefeuille est le retrait brut ; l'impôt ne
mord qu'ensuite, sur le revenu. Deux pays qui ne différeraient que par leur
fiscalité donneraient donc deux courbes identiques. Ce sont les taux de retrait
qui les séparent, et l'écart d'imposition se lit sur le revenu net indiqué en
légende — avec les valeurs par défaut, la France et le Japon versent presque le
même revenu mensuel, mais le capital japonais finit à 1,10 M€ contre 0,70 M€.

## Hypothèses assumées

- **Rendement constant.** Pas de volatilité, donc pas de risque lié à l'ordre
  des bonnes et mauvaises années — c'est pourtant ce qui fait échouer les
  départs en retraite anticipée. Une simulation de Monte-Carlo est la suite
  naturelle.
- **Fiscalité à un taux unique**, appliqué à la totalité du retrait alors qu'en
  pratique seule la part de plus-value est imposée. Les enveloppes proposées
  donnent le bon taux, pas la bonne assiette : le simulateur **surestime** donc
  l'impôt. La spécification proposait 30 % par défaut ; ce chiffre ne correspond
  plus à aucun régime réel depuis le passage de la flat tax à 31,4 %, et les
  valeurs de départ viennent désormais du pays de résidence.
- **Pas d'autres revenus** (pension, salaire d'appoint, apports futurs) et pas
  de phase d'accumulation : la simulation part du patrimoine déjà là.
- **Pas de résidence principale** : le patrimoine attendu est financier, net de
  dettes.

Ce n'est pas un conseil en investissement, et l'application le dit sur toutes
les vues.

## Architecture

Le site est statique, sans serveur ni compte utilisateur. **L'état d'une
simulation tient entièrement dans l'URL** : un lien partagé rouvre exactement la
même simulation, et rien n'est enregistré nulle part.

```
src/
  lib/fire.ts       moteur de calcul — verdict, projection, scénarios
  lib/patrimoine.ts catalogue des placements et rendement recomposé
  lib/pays.ts       régimes fiscaux par pays de résidence
  lib/url.ts        sérialisation de l'état dans la barre d'adresse
  lib/echelle.ts    échelle logarithmique du curseur de patrimoine
  lib/i18n.ts       langues disponibles et détection
  lib/textes.ts     dictionnaire français / anglais
  lib/format.ts     formats de nombres liés à la langue
  lib/contexte.ts   accès aux textes et aux formats depuis les composants
  components/       champs, verdict, projection SVG, détail, comparaison,
                    objectif, sources, patrimoine
```

L'entrée française du dictionnaire **définit le type** : une clé manquante ou une
signature différente dans une autre langue casse la compilation. Une traduction
oubliée est donc une erreur de build, pas une phrase française découverte par un
lecteur anglophone. Ajouter une langue tient dans `LANGUES` et une entrée de
plus dans `textes.ts`.

Les montants restent en euros dans les deux langues, mais leur écriture suit le
lecteur : `500 000 €` et `31,4 %` en français, `€500,000` et `31.4%` en anglais.

Le moteur ne dépend de rien et sort des nombres finis quoi qu'on lui donne :
toute entrée passe d'abord par `borner()`, et l'URL — entrée non fiable — est
elle aussi bornée à la lecture. Les cas limites de la spécification (patrimoine
nul, retrait nul, rendement négatif, saisie hors bornes) ont chacun leur test.

Les tests du moteur se lisent à deux niveaux. `fire.test.ts` fixe des exemples
choisis — celui du brief, ceux de la section 8 de la spécification.
`fire.invariants.test.ts` énonce ce qui doit tenir pour **toute** entrée :
l'identité comptable d'une année, les formes closes auxquelles se réduisent les
deux modes de retrait, les monotonies attendues. Les seconds attrapent une
classe d'erreurs que les premiers laissent passer, une formule fausse pouvant
tomber juste sur les trois valeurs qu'on a pensé à écrire.

Le graphique est du SVG écrit à la main, sans bibliothèque de visualisation.

Les formules de la section « Méthode et sources » sont écrites en LaTeX dans
[src/lib/formules.ts](src/lib/formules.ts) — mais **le navigateur ne reçoit
aucun moteur LaTeX**. Elles ne changent jamais pendant qu'on lit la page : elles
sont donc rendues une fois pour toutes en MathML par `npm run formules`, et
c'est ce rendu qui est commité dans `formules.mathml.ts`.

```bash
npm run formules   # après avoir modifié une formule
```

KaTeX reste une dépendance de développement ; React demeure la seule dépendance
d'exécution. Le MathML est dessiné nativement par le navigateur, sans feuille de
style ni police embarquée : les huit formules ajoutent 0,4 Ko au paquet.

Le risque de cette approche est qu'on modifie le LaTeX sans relancer la
génération. Un test recompile la liste et compare au fichier généré ; il échoue
en nommant la formule fautive, et la CI le fait échouer avant tout déploiement.

## Déploiement

Chaque poussée sur `main` déclenche [le workflow GitHub Actions](.github/workflows/deploy.yml) :
lint, tests, build, puis publication sur GitHub Pages. Une pull request fait
tourner les vérifications sans déployer.

Le site est actuellement servi depuis
<https://commutator-io.github.io/fire-simulator/>. Les chemins produits par le
build sont relatifs, si bien qu'aucun réglage n'est à changer le jour où un
domaine dédié le servira depuis la racine — il suffira d'ajouter
l'enregistrement DNS et le domaine dans les réglages Pages du dépôt.

## La suite

Les améliorations envisagées sont dans [TODO.md](TODO.md), par ordre de valeur
ajoutée : d'abord la volatilité et l'ordre des rendements, puis l'assiette
fiscale réelle, puis d'autres pays.

## Licence

MIT.
