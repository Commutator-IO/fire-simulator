import { describe, expect, it } from 'vitest';
import { formats } from './format';
import { LANGUES } from './i18n';

const fr = formats('fr');
const en = formats('en');

describe('montants', () => {
  it('suit les conventions de chaque langue', () => {
    // Espace insécable et symbole après le nombre en français, symbole avant
    // et virgule de millier en anglais.
    expect(fr.eur(500_000)).toMatch(/^500.000\s?€$/u);
    expect(en.eur(500_000)).toBe('€500,000');
  });

  it('arrondit à l’euro', () => {
    for (const langue of LANGUES) {
      expect(formats(langue).eur(1234.6)).toContain('1');
      expect(formats(langue).eur(1234.6)).not.toContain(',6');
    }
  });

  it('abrège les grands montants dans l’unité du lecteur', () => {
    expect(fr.eurCompact(1_200_000)).toMatch(/1,2\s?M/u);
    expect(en.eurCompact(1_200_000)).toMatch(/1\.2m/u);
  });
});

describe('taux', () => {
  it('supprime les zéros inutiles et garde les décimales qui comptent', () => {
    // Espace insécable avant le signe, comme le veut la typographie française :
    // le pourcentage ne doit jamais passer seul à la ligne suivante.
    expect(fr.tauxPct(0.314)).toBe('31,4\u00a0%');
    expect(fr.tauxPct(0.20315)).toBe('20,315\u00a0%');
    expect(fr.tauxPct(0)).toBe('0\u00a0%');
    // L'anglais colle le signe au nombre.
    expect(en.tauxPct(0.20315)).toBe('20.315%');
  });

  it('complète les décimales quand une colonne doit s’aligner', () => {
    expect(fr.pct(0.05, 1)).toMatch(/^5,0\s?%$/u);
    expect(en.pct(0.05, 1)).toBe('5.0%');
  });
});

describe('points de pourcentage', () => {
  it('accorde le pluriel selon la langue', () => {
    expect(fr.points(0.01)).toBe('1 point');
    expect(fr.points(0.03)).toBe('3 points');
    // Le français pluralise à partir de deux, l'anglais dès que ce n'est pas un.
    expect(fr.points(0.015)).toBe('1,5 point');
    expect(en.points(0.015)).toBe('1.5 points');
    expect(en.points(0.01)).toBe('1 point');
  });

  it('emploie le vrai signe moins', () => {
    for (const langue of LANGUES) {
      expect(formats(langue).points(-0.01)).toContain('−');
      expect(formats(langue).points(-0.01)).not.toContain('-');
    }
  });
});

describe('robustesse', () => {
  it('ne laisse jamais fuir NaN ni Infinity', () => {
    for (const langue of LANGUES) {
      const f = formats(langue);
      for (const rendu of [f.eur, f.num, f.eurCompact, f.tauxPct, f.points, f.eurSigne]) {
        for (const valeur of [Number.NaN, Number.POSITIVE_INFINITY, -Infinity]) {
          expect(rendu(valeur)).not.toMatch(/NaN|∞|Infinity/);
        }
      }
    }
  });

  it('renvoie le même objet pour une langue donnée', () => {
    // Les formateurs Intl sont coûteux à construire et servent de dépendance
    // à un hook : leur identité doit rester stable d'un rendu à l'autre.
    expect(formats('fr')).toBe(fr);
  });

  it('expose le séparateur décimal attendu', () => {
    expect(fr.separateurDecimal).toBe(',');
    expect(en.separateurDecimal).toBe('.');
  });
});
