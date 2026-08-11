# Feuille de route

## Où en est l'outil

Cinq onglets, dont trois construits : **estimer mon patrimoine** (ce qu'on
possède, ce que ça rapporte, ce que la détention coûte), **vivre de mon
patrimoine** (retraits, fiscalité, projection, rente future) et une **synthèse**
imprimable qui réunit les deux. Deux autres — portefeuille boursier et
immobilier locatif — sont annoncés dans la navigation mais pas encore écrits.

Le moteur ([src/lib/fire.ts](src/lib/fire.ts)) ne dépend de rien et reste une
fonction pure : quatorze paramètres bornés entrent, une projection sort. Cette
frontière est ce qui rend la suite possible — tout ce qui suit s'ajoute autour,
sans réécrire le cœur. 225 tests couvrent le moteur, les formats, le
dictionnaire et l'adresse.

Les chantiers ci-dessous sont regroupés par nature, et chacun porte une
priorité. Dans l'ordre de ce qui engage le plus : ce qu'on a promis, ce qui est
faux, ce qui manque, ce qui use.

---

# I. Ce qui est promis dans l'interface

Deux onglets portent un badge « à venir » et décrivent déjà ce qu'ils
calculeront. C'est une dette vis-à-vis du visiteur, pas une idée parmi d'autres.

## 1. Onglet portefeuille boursier

**Priorité haute — engagement pris.**

Annoncé avec sa maquette : une ligne par position, prix de revient moyen, plus
ou moins-value latente par ligne et pour l'ensemble, plus-values réalisées
séparées du latent, poids de chaque ligne. Les positions restent dans le
navigateur, comme le reste.

Le point qui demande une décision : le prix de revient moyen se recalcule à
chaque achat, donc il faut un **historique d'opérations**, pas seulement un état
courant. C'est la première structure de données de l'outil qui ne tient pas dans
un jeu de curseurs — et c'est elle qui décide de la forme de l'URL et du
stockage.

Une fois construit, il alimente la ligne « compte-titres » ou « PEA » de
l'estimateur, sans double saisie.

## 2. Onglet immobilier locatif

**Priorité haute — engagement pris.**

Annoncé lui aussi : cash-flow réel bien par bien, rendement net, poids du crédit
(capital restant dû, intérêts de l'année, part remboursée), imposition des
loyers au micro-foncier ou au réel.

Une partie du calcul existe déjà dans [patrimoine.ts](src/lib/patrimoine.ts) —
la ligne « immobilier locatif » sait faire loyers moins charges moins impôt. Ce
qui manque est le crédit amorti et la comparaison micro-foncier / réel.

---

# II. Ce qui est faux, ou incomplet

Les biais connus du modèle. Ils sont documentés dans l'interface, ce qui limite
la casse, mais un biais dit reste un biais.

## 3. La volatilité, et l'ordre des années

**Priorité haute.** La limite qui change le plus les conclusions, et la seule
que l'utilisateur ne peut pas contourner en bougeant un curseur.

Le simulateur suppose un rendement constant. Or ce qui fait échouer une retraite
anticipée n'est presque jamais la moyenne des rendements : c'est leur **ordre**.
Deux krachs dans les cinq premières années ne se rattrapent pas — on retire des
parts au plus bas, et il n'en reste plus assez pour profiter du rebond. C'est le
*sequence of returns risk*, invisible aujourd'hui.

**Ce que ça donnerait.** Un taux de réussite au lieu d'une trajectoire unique :
« ce plan tient dans 87 % des scénarios ». La durée exigée est déjà en place et
sert de critère, sans rien changer à l'interface. Et une lecture par période :
« dans les cas d'échec, la rupture se joue toujours avant l'année 12 ».

**Pistes, de la moins à la plus coûteuse.**

- **Séquences historiques** (*bootstrap*) plutôt que Monte-Carlo gaussien : on
  rejoue des séries réelles, année par année, sur toutes les fenêtres
  glissantes. Plus honnête qu'une loi normale — qui sous-estime les queues — et
  plus facile à expliquer.
- Il faut alors une **série de rendements** embarquée. Les données
  Dimson-Marsh-Staunton sont sous licence ; à défaut, des séries publiques par
  classe d'actifs, avec source et période, dans un `src/lib/historique.ts`
  traité comme une donnée versionnée.
- Quelques milliers de trajectoires : à calculer dans un **web worker** pour ne
  pas geler les curseurs, avec un cache par jeu d'hypothèses.
- Afficher un **faisceau** avec ses déciles plutôt que trois courbes.
  [Projection.tsx](src/components/Projection.tsx) sait déjà dessiner une bande ;
  il faut l'étendre à plusieurs.

## 4. Imposer la plus-value, pas le retrait

**Priorité haute.** Biais connu, signalé à chaque régime.

Le taux appliqué est le bon ; l'assiette ne l'est pas. En France comme au Japon,
seule la **part de plus-value** d'un retrait est taxée, jamais le capital
investi. Le simulateur taxe la totalité : il surestime l'impôt, d'autant plus que
le portefeuille est jeune. Sur un patrimoine constitué à 60 % d'apports, l'écart
dépasse le point de pourcentage — assez pour renverser une comparaison entre
enveloppes.

**Ce qu'il faudrait.** Un paramètre de plus : la part de plus-value dans le
patrimoine (ou, plus parlant, le total versé). L'assiette devient
`retrait × (plus-value / patrimoine)`, ratio qui évolue chaque année. Pour le
PEA et l'assurance-vie, la règle française est explicitement proportionnelle :
c'est modélisable fidèlement.

**Ce que ça débloque.** L'abattement annuel de l'assurance-vie (4 600 € /
9 200 €), aujourd'hui hors modèle, devient calculable — et il change le
classement des enveloppes pour les retraits modestes.

## 5. Des âges de retraite paramétrables

**Priorité moyenne.** Limite connue de la fonctionnalité « rente future ».

Les âges légal et de taux plein sont figés par pays (64 et 67 en France). C'est
faux pour tous ceux qui relèvent d'un régime spécial, d'une carrière longue ou
d'une catégorie active : leur âge d'ouverture des droits peut être inférieur de
plusieurs années, et l'estimation affichée est alors décalée d'autant.

**Deux réponses, pas exclusives.**

- Rendre les deux âges **modifiables**, avec la valeur du pays comme repère. Peu
  coûteux, et suffisant pour la plupart des cas.
- Permettre de **saisir directement les montants du relevé** de carrière (les
  services publics de retraite les affichent par âge de départ). Une saisie
  réelle vaut mieux qu'une estimation par proratisation, et court-circuite tout
  le modèle d'estimation quand l'utilisateur a l'information sous les yeux.

Le modèle actuel — proratisation linéaire, décote plafonnée, taux de
remplacement moyen — reste utile par défaut, pour qui n'a pas son relevé.

## 6. Veille sur les taux

**Priorité moyenne, mais échéance annuelle.**

Un simulateur fiscal qui affiche un barème périmé est pire qu'inexistant : il
inspire confiance en donnant un mauvais chiffre. Le cas s'est déjà présenté —
30 % d'imposition par défaut ne correspondait plus à aucun régime français après
le passage de la flat tax à 31,4 %.

**Ce qui manque.**

- Rien n'indique **quand** un taux a été vérifié. Un chiffre juste et un chiffre
  périmé se ressemblent.
- Attacher à chaque régime sa date de vérification et l'URL de sa source, sous
  la forme `{ valeur, source, verifieLe }`, plutôt que de laisser la source dans
  un composant séparé. On pourrait alors afficher « barèmes vérifiés le … » et
  faire échouer un test au-delà d'un certain âge.
- À surveiller : PLF et PLFSS à l'automne, publication au JO fin décembre ; pour
  le Japon, la réforme fiscale annuelle (*zeisei kaisei taikō*) publiée en
  décembre, applicable en avril.

---

# III. Ce qui manque

Des fonctionnalités absentes, pas des erreurs. Classées par nombre de personnes
qu'elles concernent.

## 7. La phase d'accumulation

**Priorité haute.** La question la plus demandée, et la plus mal servie.

L'outil part du patrimoine déjà là. La question précédente — « combien épargner
par mois, et pendant combien de temps, pour y arriver ? » — concerne presque
tout le monde, et l'ajout de la rente future l'a rendue plus criante : quelqu'un
qui simule à 40 ans un arrêt à 50 doit aujourd'hui saisir à la main le
patrimoine qu'il aura à 50, alors que l'outil pourrait le projeter.

Le calcul est simple (versements réguliers capitalisés) et se branche sur le
patrimoine cible déjà calculé par « et si on prenait la question à l'envers ».
Ce serait un onglet de plus, réutilisant le moteur.

## 8. Des retraits qui s'adaptent

**Priorité moyenne.** La meilleure réponse au risque du point 3.

Les deux modes actuels sont les extrêmes : montant fixe indexé (le capital peut
s'épuiser) ou pourcentage constant (le revenu suit les marchés). En pratique
personne ne fait ni l'un ni l'autre — on réduit après une mauvaise année, on
augmente après une bonne.

**Pistes.** Les règles de Guyton-Klinger, ou plus simplement un plancher et un
plafond en pouvoir d'achat. Ces stratégies élèvent nettement le taux de retrait
soutenable — à condition d'afficher aussi ce qu'elles coûtent : des années où
l'on vit avec moins.

Dans la même veine, les dépenses ne sont pas linéaires : elles suivent une
courbe en sourire — élevées au début (voyages), basses au milieu, élevées à la
fin (santé, dépendance). Un profil paramétrable dirait plus vrai qu'un montant
constant.

## 9. D'autres pays de résidence

**Priorité moyenne — mais une décision d'architecture à prendre d'abord.**

Le catalogue est prêt : ajouter un pays tient dans une entrée de
[`PAYS`](src/lib/pays.ts) — libellés, valeurs de départ, régimes avec taux,
composition et réserve — plus les sources dans
[Sources.tsx](src/components/Sources.tsx).

| Pays | Ce qui le rend intéressant |
| --- | --- |
| Portugal | Destination classique de l'expatriation FIRE ; le régime des résidents non habituels a changé, à vérifier avant publication |
| Belgique | Pas d'impôt sur les plus-values mobilières, mais taxe sur les comptes-titres et précompte sur les dividendes |
| Suisse | Plus-values privées exonérées, mais impôt sur la fortune — que le modèle ne sait pas représenter |
| Espagne, Italie | Barèmes progressifs sur l'épargne : α dépend du montant retiré |
| États-Unis | *Long-term capital gains* à 0 / 15 / 20 % selon le revenu, plus l'impôt d'État |

**La décision à prendre avant d'empiler.** Trois de ces candidats ne rentrent
pas dans un taux unique : la Suisse taxe le stock et pas le flux, l'Espagne et
les États-Unis appliquent un barème par tranches. Il faut trancher si
`Regime.imposition` reste un nombre ou devient une fonction du montant retiré.
Peu coûteux maintenant, très coûteux plus tard.

## 10. Devise et coût de la vie

**Priorité basse, mais c'est la vraie question de l'expatriation.**

Comparer la France et le Japon compare aujourd'hui **deux fiscalités**, pas deux
vies. Les montants restent en euros, le coût de la vie n'entre nulle part.

- Afficher les montants dans la devise du pays, avec un taux de change **saisi**
  plutôt que récupéré en ligne : dans un outil qui projette sur quarante ans, un
  taux figé et visible vaut mieux qu'un taux frais et invisible.
- Un coefficient de coût de la vie appliqué aux dépenses cibles, sourcé
  (parités de pouvoir d'achat), présenté comme un ordre de grandeur.
- Ne pas prétendre modéliser le risque de change entre un patrimoine dans une
  devise et des dépenses dans une autre : c'est un sujet en soi, et le dire vaut
  mieux que le simuler mal.

---

# IV. Qualité de l'outil

## 11. Tests d'interface

**Priorité moyenne.**

Le moteur, l'échelle, les formats, le dictionnaire et l'adresse sont couverts
(225 tests). Les composants ne le sont pas : rien ne vérifie qu'un clic sur
« Japon » recharge les hypothèses du pays, ni que le verdict bascule au bon
moment, ni que la rente apparaît la bonne année.

**Pistes.** `@testing-library/react` sur les parcours qui portent le sens :
changer de pays, franchir la limite Z = Y, partager puis rouvrir un lien,
appliquer l'estimateur au plan de retraits. Et une vérification d'accessibilité
automatisée, aujourd'hui faite à la main.

## 12. Détails qui manquent

**Priorité basse, coût faible.**

- **Image de partage** (Open Graph) reprenant le verdict et le revenu mensuel :
  un lien partagé sur un forum ou une messagerie n'affiche rien aujourd'hui.
- **Export CSV** de la projection année par année, pour continuer dans un
  tableur.
- **Impression de la page principale** : la synthèse s'imprime proprement depuis
  qu'elle existe, mais l'onglet « vivre de mon patrimoine » fait cinq écrans et
  s'imprime mal. Une feuille de style tiendrait en quelques lignes — ou bien on
  assume que la synthèse est *le* format imprimable, et on renvoie vers elle.
- **Langues supplémentaires** : le dictionnaire est typé, une clé manquante
  casse la compilation. L'allemand et l'espagnol iraient de pair avec les pays
  du point 9, le japonais avec le pays déjà modélisé.
