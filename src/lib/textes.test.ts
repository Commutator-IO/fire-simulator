import { describe, expect, it } from 'vitest';
import { TEXTES } from './textes';
import { LANGUES, estLangue } from './i18n';

/**
 * The typing already guarantees that the dictionaries share their keys; what it
 * does not guarantee is that those keys are filled in. These tests walk the tree
 * and refuse an empty string, an argument a sentence forgot to use, or an entry
 * left in French in the English version.
 */

type Noeud = string | ((...args: never[]) => string) | { [cle: string]: Noeud };

/** Aplatit le dictionnaire en couples chemin / texte rendu. */
function parcourir(noeud: Noeud, chemin = ''): [string, string][] {
  if (typeof noeud === 'string') return [[chemin, noeud]];
  if (typeof noeud === 'function') {
    // Real arguments are numbers or already-formatted strings; any non-empty
    // value is enough to check the template.
    const args = Array.from({ length: noeud.length }, (_, i) => `<${i}>`);
    return [[chemin, (noeud as (...a: unknown[]) => string)(...args)]];
  }
  return Object.entries(noeud).flatMap(([cle, valeur]) =>
    parcourir(valeur, chemin === '' ? cle : `${chemin}.${cle}`),
  );
}

describe('dictionary', () => {
  it('covers every language it announces', () => {
    expect(Object.keys(TEXTES).sort()).toEqual([...LANGUES].sort());
    expect(LANGUES.every(estLangue)).toBe(true);
  });

  for (const langue of LANGUES) {
    describe(langue, () => {
      const entrees = parcourir(TEXTES[langue] as unknown as Noeud);

      it('leaves no entry empty', () => {
        const vides = entrees.filter(([, texte]) => texte.trim() === '');
        expect(vides).toEqual([]);
      });

      it('does insert its arguments into the sentences that take them', () => {
        // A function that ignored its argument would produce a sentence
        // missing the very figure it is supposed to carry.
        const fonctions = parcourir(TEXTES[langue] as unknown as Noeud).filter(
          ([chemin]) => chemin.length > 0,
        );
        const trous = fonctions.filter(([, texte]) => texte.includes('<0>'));
        expect(trous.length).toBeGreaterThan(0);
      });

      it('has as many entries as the French dictionary', () => {
        expect(entrees.length).toBe(parcourir(TEXTES.fr as unknown as Noeud).length);
      });
    });
  }

  it('really does translate the page title in each language', () => {
    const titres = LANGUES.map((l) => TEXTES[l].meta.titre);
    expect(new Set(titres).size).toBe(LANGUES.length);
  });

  it('does not let an untranslated entry copy the French', () => {
    // A few labels are identical across languages — "France", "NISA", "PEA" —
    // but the bulk of the dictionary has to differ.
    const fr = new Map(parcourir(TEXTES.fr as unknown as Noeud));
    const identiques = parcourir(TEXTES.en as unknown as Noeud).filter(
      ([chemin, texte]) => fr.get(chemin) === texte,
    );
    expect(identiques.length).toBeLessThan(fr.size / 10);
  });
});
