import { describe, expect, it } from 'vitest';
import {
  POSITION_MAX,
  POSITION_MIN,
  VALEUR_MAX,
  arrondiLisible,
  positionDeValeur,
  valeurDePosition,
} from './echelle';

describe('readable rounding', () => {
  it('rounds onto the 1 / 2 / 5 step of the decade', () => {
    expect(arrondiLisible(523_456)).toBe(520_000);
    expect(arrondiLisible(1_049_000)).toBe(1_040_000);
    expect(arrondiLisible(12_345)).toBe(12_400);
  });

  it('returns zero for a nil or nonsensical value', () => {
    expect(arrondiLisible(0)).toBe(0);
    expect(arrondiLisible(-5)).toBe(0);
    expect(arrondiLisible(Number.NaN)).toBe(0);
  });
});

describe('logarithmic scale', () => {
  it('reserves the bottom position for no capital at all', () => {
    expect(valeurDePosition(POSITION_MIN)).toBe(0);
    expect(positionDeValeur(0)).toBe(POSITION_MIN);
  });

  it('lands exactly on the upper bound', () => {
    expect(valeurDePosition(POSITION_MAX)).toBe(VALEUR_MAX);
    expect(positionDeValeur(VALEUR_MAX)).toBe(POSITION_MAX);
    expect(positionDeValeur(VALEUR_MAX * 10)).toBe(POSITION_MAX);
  });

  it('rises strictly, with no plateau and no step backwards', () => {
    let precedent = -1;
    for (let p = 1; p <= POSITION_MAX; p++) {
      const valeur = valeurDePosition(p);
      expect(valeur).toBeGreaterThan(precedent);
      precedent = valeur;
    }
  });

  it('finds again the position of a value the slider produced', () => {
    for (let p = 1; p <= POSITION_MAX; p++) {
      expect(positionDeValeur(valeurDePosition(p))).toBe(p);
    }
  });

  it('puts a common amount back within one notch of itself', () => {
    for (const montant of [10_000, 250_000, 500_000, 1_000_000, 7_500_000]) {
      const retour = valeurDePosition(positionDeValeur(montant));
      expect(Math.abs(retour - montant) / montant).toBeLessThan(0.05);
    }
  });
});
