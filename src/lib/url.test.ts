import { describe, expect, it } from 'vitest';
import { decoderComposition, decoderEtat, decoderVue, encoderEtat } from './url';
import { actif, compositionVide, type CleActif } from './patrimoine';
import { BORNES, DEFAUTS, type Hypotheses } from './fire';

const etat = (sur: Partial<Hypotheses> = {}): Hypotheses => ({ ...DEFAUTS, ...sur });

describe('encoding', () => {
  it('produces an empty query when everything is default', () => {
    expect(encoderEtat(DEFAUTS)).toBe('');
  });

  it('writes only what differs from the defaults', () => {
    expect(encoderEtat(etat({ patrimoine: 750_000 }))).toBe('?patrimoine=750000');
  });

  it('writes rates as percentage points', () => {
    const requete = encoderEtat(etat({ rendement: 0.07, imposition: 0.172 }));
    expect(requete).toContain('rendement=7');
    expect(requete).toContain('impots=17.2');
  });

  it('carries the withdrawal mode', () => {
    expect(encoderEtat(etat({ modeRetrait: 'proportionnel' }))).toBe(
      '?mode=proportionnel',
    );
  });

  it('carries the country of residence', () => {
    expect(encoderEtat(etat({ pays: 'japon' }))).toBe('?pays=japon');
  });

  it('carries the required duration', () => {
    expect(encoderEtat(etat({ dureeExigee: 25 }))).toBe('?duree=25');
  });

  it('keeps enough decimals for a rate such as 20.315%', () => {
    expect(encoderEtat(etat({ imposition: 0.20315 }))).toContain('impots=20.315');
  });
});

describe('decoding', () => {
  // Acceptance criterion no. 6: a shared link restores the simulation.
  it('makes the round trip without loss', () => {
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

  // Without this the link reopens on a rate that no longer matches any tax
  // regime, and the interface presents it as a custom one.
  it('gives back a three-decimal rate untouched', () => {
    const depart = etat({ pays: 'japon', imposition: 0.20315 });
    expect(decoderEtat(encoderEtat(depart)).imposition).toBeCloseTo(0.20315, 10);
  });

  it('falls back to the defaults when the query is empty', () => {
    expect(decoderEtat('')).toEqual(DEFAUTS);
    expect(decoderEtat('?')).toEqual(DEFAUTS);
  });

  it('clamps what the URL carries, it being untrusted input', () => {
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

  it('ignores anything that is not a number', () => {
    const h = decoderEtat('?patrimoine=beaucoup&rendement=&retrait=NaN');
    expect(h.patrimoine).toBe(DEFAUTS.patrimoine);
    expect(h.rendement).toBe(DEFAUTS.rendement);
    expect(h.retrait).toBe(DEFAUTS.retrait);
  });

  it('ignores an unknown withdrawal mode', () => {
    expect(decoderEtat('?mode=au-feeling').modeRetrait).toBe(DEFAUTS.modeRetrait);
  });

  it('ignores an unknown country', () => {
    expect(decoderEtat('?pays=atlantide').pays).toBe(DEFAUTS.pays);
  });

  it('accepts a query that already carries its question mark', () => {
    expect(decoderEtat('?patrimoine=800000').patrimoine).toBe(800_000);
  });
});

describe('holdings in the address', () => {
  const avec = (montants: Partial<Record<CleActif, number>>, taux: Partial<Record<CleActif, number>> = {}) =>
    compositionVide().map((l) => ({
      ...l,
      montant: montants[l.cle] ?? 0,
      rendement: taux[l.cle] ?? l.rendement,
    }));

  it('writes one parameter per line, and skips the empty ones', () => {
    const requete = encoderEtat(DEFAUTS, {
      composition: avec({ pea: 120_000, scpi: 40_000 }),
    });
    expect(requete).toContain('pea=120000');
    expect(requete).toContain('scpi=40000');
    expect(requete).not.toContain('livretA');
  });

  // A statement left at the catalogue's own rates is the common case, and it
  // should not double the length of the address.
  it('writes a rate only when it differs from the product’s own', () => {
    const defaut = actif('pea')!.rendementParDefaut;
    expect(encoderEtat(DEFAUTS, { composition: avec({ pea: 1_000 }) })).not.toContain(
      'pea-taux',
    );
    expect(
      encoderEtat(DEFAUTS, {
        composition: avec({ pea: 1_000 }, { pea: defaut + 0.01 }),
      }),
    ).toContain('pea-taux=8');
  });

  it('makes the round trip without loss', () => {
    const depart = avec(
      { livretA: 25_000, pea: 120_000, residencePrincipale: 350_000, creditResidence: 180_000 },
      { pea: 0.085, creditResidence: 0.021 },
    );
    expect(decoderComposition(encoderEtat(DEFAUTS, { composition: depart }))).toEqual(
      depart,
    );
  });

  // An address that says nothing is a first visit, not an emptied statement:
  // the interface opens on its example rather than on a blank form.
  it('says nothing when the address carries no holding', () => {
    expect(decoderComposition('')).toBeNull();
    expect(decoderComposition('?lang=fr')).toBeNull();
  });

  it('remembers a statement that was deliberately cleared', () => {
    const requete = encoderEtat(DEFAUTS, { composition: compositionVide() });
    expect(requete).toContain('vide=1');
    expect(decoderComposition(requete)).toEqual(compositionVide());
  });

  it('clamps what the address carries', () => {
    const lu = decoderComposition('?pea=-9000&livretA=1e12&scpi-taux=999')!;
    const trouve = (cle: CleActif) => lu.find((l) => l.cle === cle)!;
    expect(trouve('pea').montant).toBe(0);
    expect(trouve('livretA').montant).toBe(100_000_000);
    expect(trouve('scpi').rendement).toBeCloseTo(0.2, 10);
  });
});

describe('the active tab', () => {
  // The statement is where one starts, so it is what an address without a tab
  // opens on.
  it('opens on the statement unless told otherwise', () => {
    expect(decoderVue('')).toBe('patrimoine');
    expect(decoderVue('?vue=nimporte')).toBe('patrimoine');
    expect(decoderVue('?vue=fire')).toBe('fire');
    expect(decoderVue('?vue=synthese')).toBe('synthese');
  });

  it('is written only when it is not the default', () => {
    expect(encoderEtat(DEFAUTS, { vue: 'patrimoine' })).toBe('');
    expect(encoderEtat(DEFAUTS, { vue: 'fire' })).toBe('?vue=fire');
    expect(encoderEtat(DEFAUTS, { vue: 'synthese' })).toBe('?vue=synthese');
  });
});
