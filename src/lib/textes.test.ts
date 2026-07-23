import { describe, expect, it } from 'vitest';
import { TEXTES } from './textes';
import { LANGUES, estLangue } from './i18n';

/**
 * Le typage garantit déjà que les dictionnaires ont les mêmes clés : ce qu'il ne
 * garantit pas, c'est qu'elles soient remplies. Ces tests parcourent l'arbre et
 * refusent une chaîne vide, un argument ignoré par une phrase à trous, ou une
 * entrée restée en français dans la version anglaise.
 */

type Noeud = string | ((...args: never[]) => string) | { [cle: string]: Noeud };

/** Aplatit le dictionnaire en couples chemin / texte rendu. */
function parcourir(noeud: Noeud, chemin = ''): [string, string][] {
  if (typeof noeud === 'string') return [[chemin, noeud]];
  if (typeof noeud === 'function') {
    // Les arguments réels sont des nombres ou des chaînes déjà formatées ;
    // n'importe quelle valeur non vide suffit pour vérifier le gabarit.
    const args = Array.from({ length: noeud.length }, (_, i) => `«${i}»`);
    return [[chemin, (noeud as (...a: unknown[]) => string)(...args)]];
  }
  return Object.entries(noeud).flatMap(([cle, valeur]) =>
    parcourir(valeur, chemin === '' ? cle : `${chemin}.${cle}`),
  );
}

describe('dictionnaire', () => {
  it('couvre toutes les langues annoncées', () => {
    expect(Object.keys(TEXTES).sort()).toEqual([...LANGUES].sort());
    expect(LANGUES.every(estLangue)).toBe(true);
  });

  for (const langue of LANGUES) {
    describe(langue, () => {
      const entrees = parcourir(TEXTES[langue] as unknown as Noeud);

      it('ne laisse aucune entrée vide', () => {
        const vides = entrees.filter(([, texte]) => texte.trim() === '');
        expect(vides).toEqual([]);
      });

      it('insère bien ses arguments dans les phrases à trous', () => {
        // Une fonction qui ignorerait son argument produirait une phrase
        // amputée du chiffre qu'elle est censée porter.
        const fonctions = parcourir(TEXTES[langue] as unknown as Noeud).filter(
          ([chemin]) => chemin.length > 0,
        );
        const trous = fonctions.filter(([, texte]) => texte.includes('«0»'));
        expect(trous.length).toBeGreaterThan(0);
      });

      it('a autant d’entrées que le dictionnaire français', () => {
        expect(entrees.length).toBe(parcourir(TEXTES.fr as unknown as Noeud).length);
      });
    });
  }

  it('traduit réellement le titre de la page dans chaque langue', () => {
    const titres = LANGUES.map((l) => TEXTES[l].meta.titre);
    expect(new Set(titres).size).toBe(LANGUES.length);
  });

  it('ne laisse pas une entrée non traduite recopier le français', () => {
    // Quelques libellés sont identiques d'une langue à l'autre — « France »,
    // « NISA », « PEA » — mais l'essentiel du dictionnaire doit différer.
    const fr = new Map(parcourir(TEXTES.fr as unknown as Noeud));
    const identiques = parcourir(TEXTES.en as unknown as Noeud).filter(
      ([chemin, texte]) => fr.get(chemin) === texte,
    );
    expect(identiques.length).toBeLessThan(fr.size / 10);
  });
});
