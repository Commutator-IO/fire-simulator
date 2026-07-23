import { describe, expect, it } from 'vitest';
import { decoderEtat, encoderEtat } from './url';
import { BORNES, DEFAUTS, type Hypotheses } from './fire';

const etat = (sur: Partial<Hypotheses> = {}): Hypotheses => ({ ...DEFAUTS, ...sur });

describe('encodage', () => {
  it('produit une adresse vide quand tout est par défaut', () => {
    expect(encoderEtat(DEFAUTS)).toBe('');
  });

  it('n’écrit que ce qui diffère des valeurs par défaut', () => {
    expect(encoderEtat(etat({ patrimoine: 750_000 }))).toBe('?patrimoine=750000');
  });

  it('exprime les taux en points de pourcentage', () => {
    const requete = encoderEtat(etat({ rendement: 0.07, imposition: 0.172 }));
    expect(requete).toContain('rendement=7');
    expect(requete).toContain('impots=17.2');
  });

  it('transporte le mode de retrait', () => {
    expect(encoderEtat(etat({ modeRetrait: 'proportionnel' }))).toBe(
      '?mode=proportionnel',
    );
  });

  it('transporte le pays de résidence', () => {
    expect(encoderEtat(etat({ pays: 'japon' }))).toBe('?pays=japon');
  });

  it('transporte la durée exigée', () => {
    expect(encoderEtat(etat({ dureeExigee: 25 }))).toBe('?duree=25');
  });

  it('garde assez de décimales pour un taux comme 20,315 %', () => {
    expect(encoderEtat(etat({ imposition: 0.20315 }))).toContain('impots=20.315');
  });
});

describe('décodage', () => {
  // Critère d'acceptation nº 6 : un lien partagé restitue la simulation.
  it('fait l’aller-retour sans perte', () => {
    const depart = etat({
      patrimoine: 1_250_000,
      rendement: 0.062,
      retrait: 0.035,
      imposition: 0.172,
      depensesCibles: 42_000,
      inflation: 0.015,
      horizon: 25,
      dureeExigee: 20,
      modeRetrait: 'proportionnel',
      pays: 'japon',
    });
    expect(decoderEtat(encoderEtat(depart))).toEqual(depart);
  });

  // Sans cela le lien rouvre sur un taux qui ne correspond plus à aucune
  // enveloppe, et l'interface le présente comme personnalisé.
  it('restitue un taux à trois décimales sans le dénaturer', () => {
    const depart = etat({ pays: 'japon', imposition: 0.20315 });
    expect(decoderEtat(encoderEtat(depart)).imposition).toBeCloseTo(0.20315, 10);
  });

  it('retombe sur les valeurs par défaut quand la requête est vide', () => {
    expect(decoderEtat('')).toEqual(DEFAUTS);
    expect(decoderEtat('?')).toEqual(DEFAUTS);
  });

  it('borne les valeurs de l’adresse, qui n’est pas une entrée de confiance', () => {
    const h = decoderEtat(
      '?patrimoine=-500&rendement=999&retrait=-4&impots=90&horizon=1000&duree=999',
    );
    expect(h.patrimoine).toBe(BORNES.patrimoine.min);
    expect(h.rendement).toBe(BORNES.rendement.max);
    expect(h.retrait).toBe(BORNES.retrait.min);
    expect(h.imposition).toBe(BORNES.imposition.max);
    expect(h.horizon).toBe(BORNES.horizon.max);
    expect(h.dureeExigee).toBe(BORNES.dureeExigee.max);
  });

  it('ignore ce qui n’est pas un nombre', () => {
    const h = decoderEtat('?patrimoine=beaucoup&rendement=&retrait=NaN');
    expect(h.patrimoine).toBe(DEFAUTS.patrimoine);
    expect(h.rendement).toBe(DEFAUTS.rendement);
    expect(h.retrait).toBe(DEFAUTS.retrait);
  });

  it('ignore un mode de retrait inconnu', () => {
    expect(decoderEtat('?mode=au-feeling').modeRetrait).toBe(DEFAUTS.modeRetrait);
  });

  it('ignore un pays inconnu', () => {
    expect(decoderEtat('?pays=atlantide').pays).toBe(DEFAUTS.pays);
  });

  it('accepte une adresse déjà pourvue de son point d’interrogation', () => {
    expect(decoderEtat('?patrimoine=800000').patrimoine).toBe(800_000);
  });
});
