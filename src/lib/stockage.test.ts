import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ecritEtat, litEtat, oublier } from './stockage';

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

describe('keeping a session between visits', () => {
  it('gives back the query string it was handed', () => {
    ecritEtat('?patrimoine=800000&pea=200000&retrait=3.5');
    expect(litEtat()).toBe('?patrimoine=800000&pea=200000&retrait=3.5');
  });

  it('says nothing when nothing was ever saved', () => {
    expect(litEtat()).toBe('');
  });

  it('clears the slot when handed an empty string', () => {
    ecritEtat('?patrimoine=800000');
    ecritEtat('');
    expect(stock.taille).toBe(0);
    expect(litEtat()).toBe('');
  });

  it('is forgotten on request', () => {
    ecritEtat('?patrimoine=800000');
    oublier();
    expect(litEtat()).toBe('');
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
    expect(() => ecritEtat('?patrimoine=1')).not.toThrow();
    expect(litEtat()).toBe('');
    expect(() => oublier()).not.toThrow();
  });
});
