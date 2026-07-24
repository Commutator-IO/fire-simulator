import { beforeEach, describe, expect, it, vi } from 'vitest';
import { charger, enregistrer, oublier } from './stockage';
import { compositionParDefaut, compositionVide, estRenseignee } from './patrimoine';

/** A local storage that lives for the length of a test. */
function memoire() {
  const donnees = new Map<string, string>();
  return {
    getItem: (c: string) => donnees.get(c) ?? null,
    setItem: (c: string, v: string) => void donnees.set(c, v),
    removeItem: (c: string) => void donnees.delete(c),
    get taille() {
      return donnees.size;
    },
    donnees,
  };
}

let stock = memoire();

beforeEach(() => {
  stock = memoire();
  vi.stubGlobal('localStorage', stock);
});

describe('keeping a statement between visits', () => {
  it('gives back what it was handed', () => {
    const composition = compositionParDefaut();
    enregistrer(composition);
    expect(charger()).toEqual(composition);
  });

  it('says nothing when nothing was ever saved', () => {
    expect(charger()).toBeNull();
  });

  it('stores nothing for an empty statement, and forgets what it held', () => {
    enregistrer(compositionParDefaut());
    enregistrer(compositionVide());
    expect(stock.taille).toBe(0);
    expect(charger()).toBeNull();
  });

  it('is forgotten on request', () => {
    enregistrer(compositionParDefaut());
    oublier();
    expect(charger()).toBeNull();
  });

  // The reason the record carries a version: a release that changes the shape
  // of a line must drop what it can no longer read rather than half-read it.
  it('drops a record written by another version', () => {
    stock.setItem(
      'fire-simulator.patrimoine',
      JSON.stringify({ version: 0, lignes: compositionParDefaut() }),
    );
    expect(charger()).toBeNull();
    expect(stock.taille).toBe(0);
  });

  it('drops a record that is not a statement at all', () => {
    stock.setItem('fire-simulator.patrimoine', '{"version":1,"lignes":"oui"}');
    expect(charger()).toBeNull();
  });

  it('survives a corrupted entry rather than taking the page down', () => {
    stock.setItem('fire-simulator.patrimoine', 'ceci n’est pas du JSON');
    expect(() => charger()).not.toThrow();
    expect(charger()).toBeNull();
  });

  it('clamps what it reads back, a stored value being no more trusted than a URL', () => {
    stock.setItem(
      'fire-simulator.patrimoine',
      JSON.stringify({
        version: 1,
        lignes: [{ cle: 'pea', montant: -400, rendement: 9, loyer: 0, charges: 0, impositionRevenus: 0, duree: 0 }],
      }),
    );
    const lu = charger()!;
    expect(lu.find((l) => l.cle === 'pea')!.montant).toBe(0);
    expect(lu.find((l) => l.cle === 'pea')!.rendement).toBe(0.2);
  });

  it('stays silent when the browser refuses to store', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('mode privé');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('non');
      },
    });
    expect(() => enregistrer(compositionParDefaut())).not.toThrow();
    expect(charger()).toBeNull();
    expect(() => oublier()).not.toThrow();
  });

  it('leaves the example recognisable once round-tripped', () => {
    enregistrer(compositionParDefaut());
    expect(estRenseignee(charger()!)).toBe(true);
  });
});
