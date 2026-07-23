import { describe, expect, it } from 'vitest';
import {
  POSITION_MAX,
  POSITION_MIN,
  VALEUR_MAX,
  arrondiLisible,
  positionDeValeur,
  valeurDePosition,
} from './echelle';

describe('arrondi lisible', () => {
  it('arrondit sur l’échelon 1 / 2 / 5 de la décade', () => {
    expect(arrondiLisible(523_456)).toBe(520_000);
    expect(arrondiLisible(1_049_000)).toBe(1_040_000);
    expect(arrondiLisible(12_345)).toBe(12_400);
  });

  it('renvoie zéro pour une valeur nulle ou absurde', () => {
    expect(arrondiLisible(0)).toBe(0);
    expect(arrondiLisible(-5)).toBe(0);
    expect(arrondiLisible(Number.NaN)).toBe(0);
  });
});

describe('échelle logarithmique', () => {
  it('réserve la position basse au patrimoine nul', () => {
    expect(valeurDePosition(POSITION_MIN)).toBe(0);
    expect(positionDeValeur(0)).toBe(POSITION_MIN);
  });

  it('atteint exactement la borne haute', () => {
    expect(valeurDePosition(POSITION_MAX)).toBe(VALEUR_MAX);
    expect(positionDeValeur(VALEUR_MAX)).toBe(POSITION_MAX);
    expect(positionDeValeur(VALEUR_MAX * 10)).toBe(POSITION_MAX);
  });

  it('progresse strictement, sans palier ni retour en arrière', () => {
    let precedent = -1;
    for (let p = 1; p <= POSITION_MAX; p++) {
      const valeur = valeurDePosition(p);
      expect(valeur).toBeGreaterThan(precedent);
      precedent = valeur;
    }
  });

  it('retrouve la position d’une valeur produite par le curseur', () => {
    for (let p = 1; p <= POSITION_MAX; p++) {
      expect(positionDeValeur(valeurDePosition(p))).toBe(p);
    }
  });

  it('replace un montant courant à moins d’un cran de lui-même', () => {
    for (const montant of [10_000, 250_000, 500_000, 1_000_000, 7_500_000]) {
      const retour = valeurDePosition(positionDeValeur(montant));
      expect(Math.abs(retour - montant) / montant).toBeLessThan(0.05);
    }
  });
});
