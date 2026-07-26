import { describe, expect, it } from 'vitest';
import { actifsSansAlias, etendre, minifier } from './compact';

describe('compactage des liens', () => {
  it('raccourcit les clés scalaires connues', () => {
    expect(minifier('?patrimoine=500000&rendement=5&retrait=3.5&impots=31.4')).toBe(
      '?p=500000&y=5&z=3.5&i=31.4',
    );
  });

  it('raccourcit une ligne de patrimoine et son taux', () => {
    expect(minifier('?pea=200000&pea-taux=6&assuranceVie=0')).toBe(
      '?pe=200000&pe-t=6&assuranceVie=0',
    );
  });

  it('raccourcit les suffixes de revenus fonciers', () => {
    expect(
      minifier('?immobilierLocatif=300000&immobilierLocatif-loyer=12000&immobilierLocatif-charges=3000&immobilierLocatif-impots=20'),
    ).toBe('?il=300000&il-l=12000&il-c=3000&il-m=20');
  });

  it('fait un aller-retour fidèle', () => {
    const longue =
      '?patrimoine=680000&rendement=3.9&retrait=3.5&cotise=27&avant=14&salaire=48000&pea=200000&pea-taux=6' +
      '&scpi=40000&reserveSasu=225000&creditResidence=150000&vue=synthese&lang=en';
    expect(etendre(minifier(longue))).toBe(longue);
    expect(minifier('?cotise=27&avant=14&salaire=48000')).toBe('?k=27&g=14&s=48000');
  });

  it('raccourcit réellement une requête chargée', () => {
    const longue =
      '?patrimoine=680000&rendement=3.9&residencePrincipale=350000&creditResidence=150000' +
      '&reserveSasu=225000&immobilierLocatif=300000&immobilierLocatif-loyer=12000';
    expect(minifier(longue).length).toBeLessThan(longue.length * 0.8);
  });

  it('laisse passer un ancien lien à clés longues', () => {
    // Rétrocompatibilité : une URL déjà en clés longues se lit inchangée.
    expect(etendre('?patrimoine=500000&pea=200000&scpi-loyer=8000')).toBe(
      '?patrimoine=500000&pea=200000&scpi-loyer=8000',
    );
  });

  it('gère la requête vide', () => {
    expect(minifier('')).toBe('');
    expect(minifier('?')).toBe('');
    expect(etendre('')).toBe('');
  });

  it('couvre toutes les lignes de patrimoine', () => {
    expect(actifsSansAlias()).toEqual([]);
  });
});
