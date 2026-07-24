# Feuille de route

Le simulateur répond aujourd'hui à la question du brief : « ai-je assez pour
vivre de mon patrimoine sans toucher au capital ? », avec la fiscalité réelle de
deux pays et une projection sur quarante ans. Voici ce qui viendrait ensuite,
par ordre de valeur ajoutée décroissante.

Le moteur de calcul ([src/lib/fire.ts](src/lib/fire.ts)) ne dépend de rien et ne
connaît que six nombres. Cette frontière est ce qui rend la suite possible :
tout ce qui suit s'ajoute autour, sans réécrire le cœur.

---

## 1. La volatilité, et l'ordre des années

**Priorité haute.** C'est la limite qui change le plus les conclusions, et la
seule que l'utilisateur ne peut pas contourner en bougeant un curseur.

Le simulateur suppose un rendement constant. Or ce qui fait échouer une retraite
anticipée n'est presque jamais la moyenne des rendements : c'est leur **ordre**.
Deux krachs dans les cinq premières années de retrait ne se rattrapent pas, même
si la moyenne sur trente ans reste excellente — on retire des parts au plus bas,
et il n'en reste plus assez pour profiter du rebond. C'est le *sequence of
returns risk*, et il est invisible dans la version actuelle.

**Ce que ça donnerait.** Au lieu d'une trajectoire unique, un taux de réussite :
« ce plan tient dans 87 % des scénarios ». La durée exigée est déjà en place et
servirait de critère de réussite, sans rien changer à l'interface. Et une lecture du risque par période :
« dans les cas d'échec, la rupture se joue toujours avant l'année 12 ».

**Pistes, de la moins à la plus coûteuse.**

- **Séquences historiques** (*bootstrap*) plutôt que Monte-Carlo gaussien : on
  rejoue des séries réelles de rendements et d'inflation, année par année, sur
  toutes les fenêtres glissantes disponibles. Plus honnête qu'une loi normale,
  qui sous-estime les queues de distribution, et plus facile à expliquer.
- Il faut alors une **série de rendements** embarquée. Les données
  Dimson-Marsh-Staunton sont sous licence ; à défaut, des séries publiques par
  grande classe d'actifs, avec leur source et leur période, dans un module
  `src/lib/historique.ts` traité comme une donnée versionnée.
- Le calcul est un balayage de quelques milliers de trajectoires : à faire dans
  un *web worker* pour ne pas geler le curseur, avec un résultat mis en cache
  par jeu d'hypothèses.
- Afficher un **faisceau de trajectoires** plutôt que trois courbes, avec les
  déciles. Le graphique actuel ([Projection.tsx](src/components/Projection.tsx))
  sait déjà dessiner une bande ; il faudrait l'étendre à plusieurs.

---

## 2. Imposer la plus-value, pas le retrait

**Priorité haute, et c'est un biais connu et documenté dans l'interface.**

Le taux appliqué est le bon ; l'assiette ne l'est pas. Dans les trois régimes
français comme au Japon, seule la **part de plus-value** contenue dans un
retrait est taxée, jamais le capital investi. Le simulateur taxe la totalité du
retrait : il surestime donc l'impôt, d'autant plus que le portefeuille est jeune.
Sur un patrimoine constitué à 60 % d'apports, l'écart dépasse largement le point
de pourcentage — il peut renverser une comparaison entre deux enveloppes.

**Ce qu'il faudrait.** Un paramètre supplémentaire : la part de plus-value dans
le patrimoine actuel (ou, plus parlant, le montant total versé). L'assiette
devient `retrait × (plus-value / patrimoine)`, ratio qui évolue chaque année
puisque le capital continue de croître. Pour le PEA et l'assurance-vie, la
règle française est explicitement proportionnelle : c'est modélisable
fidèlement.

**Ce que ça débloque.** L'abattement annuel de l'assurance-vie (4 600 € /
9 200 €), aujourd'hui hors modèle, devient calculable — et il change franchement
le classement des enveloppes pour les retraits modestes.

---

## 3. D'autres pays de résidence

Le catalogue est prêt pour ça : ajouter un pays tient dans une entrée de
[`PAYS`](src/lib/pays.ts) — libellés dans chaque langue, valeurs de départ,
régimes avec leur taux, leur composition et leur réserve — plus les sources dans
[Sources.tsx](src/components/Sources.tsx). Le moteur, lui, ne connaît que α.

**Candidats, par intérêt pour la communauté FIRE francophone.**

| Pays | Ce qui le rend intéressant |
| --- | --- |
| Portugal | Destination classique de l'expatriation FIRE ; le régime des résidents non habituels a changé, ce qui vaut vérification avant publication |
| Belgique | Pas d'impôt sur les plus-values mobilières sur les particuliers, mais une taxe sur les comptes-titres et un précompte sur les dividendes |
| Suisse | Plus-values privées exonérées, mais impôt sur la fortune — que le modèle actuel ne sait pas représenter du tout |
| Espagne, Italie | Barèmes progressifs sur l'épargne, donc α dépend du montant retiré |
| États-Unis | *Long-term capital gains* à 0 / 15 / 20 % selon le revenu, plus l'impôt d'État |

**Ce que ces candidats révèlent du modèle.** Trois d'entre eux ne rentrent pas
dans un taux unique : la Suisse taxe le stock et pas le flux, l'Espagne et les
États-Unis appliquent un barème par tranches. Avant d'empiler les pays, il faut
décider si `Regime.imposition` reste un nombre ou devient une fonction du
montant retiré. La seconde option est peu coûteuse maintenant et très coûteuse
plus tard.

---

## 4. Devise et coût de la vie

Aujourd'hui, comparer la France et le Japon compare **deux fiscalités**, pas
deux vies. Les montants restent en euros et le coût de la vie n'entre nulle
part. C'est dit dans l'interface, mais c'est la question que se pose vraiment
quelqu'un qui envisage de partir.

**Pistes.**

- Afficher les montants dans la devise du pays de résidence, avec un taux de
  change saisi par l'utilisateur plutôt que récupéré en ligne : un taux figé et
  visible vaut mieux qu'un taux frais et invisible dans un outil dont les
  projections courent sur quarante ans.
- Un coefficient de coût de la vie appliqué aux dépenses cibles, sourcé (indices
  de parité de pouvoir d'achat), et clairement présenté comme un ordre de
  grandeur.
- Ne pas prétendre modéliser le risque de change sur un patrimoine libellé dans
  une devise et des dépenses dans une autre : c'est un sujet en soi, et le dire
  vaut mieux que le simuler mal.

---

## 5. La phase d'accumulation

Le simulateur part du patrimoine déjà là — que l'onglet « Estimer mon
patrimoine » sait maintenant chiffrer, mais seulement à l'instant présent. La question précédente — « combien
épargner par mois, et pendant combien de temps, pour y arriver ? » — est la plus
demandée par ceux qui n'y sont pas encore, c'est-à-dire presque tout le monde.

Le calcul est simple (versements réguliers capitalisés) et se branche sur le
patrimoine cible déjà calculé par la section « et si on prenait la question à
l'envers ». Ce serait un second outil, sur sa propre page, réutilisant le même
moteur — comme le fait le simulateur SASU avec ses acomptes d'IS.

---

## 6. Des retraits qui s'adaptent

Les deux modes actuels sont les deux extrêmes : montant fixe indexé (le capital
peut s'épuiser) ou pourcentage constant (le revenu suit les marchés). En
pratique, personne ne fait ni l'un ni l'autre : on réduit les retraits après une
mauvaise année, on les augmente après une bonne.

**Pistes.** Les règles de Guyton-Klinger, ou plus simplement un plancher et un
plafond exprimés en pouvoir d'achat. Ces stratégies élèvent nettement le taux de
retrait soutenable, ce qui en fait la réponse la plus utile au risque décrit au
point 1 — à condition d'afficher aussi ce qu'elles coûtent : des années où l'on
vit avec moins.

Dans la même veine : les dépenses ne sont pas linéaires. Elles suivent plutôt
une courbe en sourire — élevées au début (voyages), basses au milieu, élevées à
la fin (santé, dépendance). Un profil de dépenses paramétrable dirait plus vrai
qu'un montant constant.

---

## 7. Veille sur les taux

Un simulateur fiscal qui affiche un barème périmé est pire qu'inexistant : il
inspire confiance tout en donnant un mauvais chiffre. Le cas s'est déjà présenté
ici — la spécification proposait 30 % d'imposition par défaut, valeur qui n'a
plus correspondu à aucun régime français après le passage de la flat tax à
31,4 % au 1ᵉʳ janvier 2026.

**Ce qui manque.**

- Rien n'indique **quand** un taux a été vérifié pour la dernière fois. Un
  chiffre juste et un chiffre périmé se ressemblent.
- Attacher à chaque régime une date de vérification et l'URL de sa source, sous
  la forme `{ valeur, source, verifieLe }`, plutôt que de laisser la source dans
  un composant séparé. On pourrait alors afficher « barèmes vérifiés le … » et
  faire échouer un test au-delà d'un certain âge.
- À surveiller : le PLF et le PLFSS à l'automne, la publication au JO fin
  décembre, et pour le Japon la réforme fiscale annuelle (*zeisei kaisei taikō*)
  publiée en décembre, applicable en avril.

---

## 8. Tests d'interface

Le moteur, l'échelle, les formats, le dictionnaire et l'adresse sont couverts
([210 tests](src/lib)). Les composants ne le sont pas du tout : aucun test ne
vérifie qu'un clic sur « Japon » recharge bien les hypothèses du pays, ni que le
verdict bascule au bon moment.

**Pistes.** `@testing-library/react` sur les trois parcours qui portent le sens :
changer de pays, franchir la limite Z = Y, partager puis rouvrir un lien. Et une
vérification d'accessibilité automatisée, aujourd'hui faite à la main.

---

## 9. Détails qui manquent

- **Image de partage** (Open Graph) reprenant le verdict et le revenu mensuel :
  un lien partagé sur un forum ou une messagerie n'affiche rien aujourd'hui.
- **Export** de la projection année par année en CSV, pour ceux qui veulent
  continuer dans leur tableur.
- **Langues supplémentaires** : le dictionnaire est typé, une clé manquante
  casse la compilation plutôt que de laisser passer une phrase en français.
  L'allemand et l'espagnol iraient de pair avec les pays du point 3, et le
  japonais avec le pays déjà modélisé.
- **Impression** : la page fait cinq écrans et s'imprime mal ; une feuille de
  style d'impression tiendrait en quelques lignes.
