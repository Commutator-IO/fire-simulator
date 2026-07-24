import { useEffect, useMemo, useState } from 'react';
import { Curseur, CurseurLog, Montant, Segments } from './components/Champs';
import { Verdict } from './components/Verdict';
import { Projection, type ModeAffichage, type Serie } from './components/Projection';
import { Detail } from './components/Detail';
import { Objectif } from './components/Objectif';
import { Comparaison } from './components/Comparaison';
import { Sources } from './components/Sources';
import { Patrimoine } from './components/Patrimoine';
import { Avertissement, Entete, Pied } from './components/Cadre';
import { BoutonPartage } from './components/BoutonPartage';
import { ContexteLangue, useFormats, useTextes, useTraduire } from './lib/contexte';
import { LANGUE_PAR_DEFAUT, type Langue } from './lib/i18n';
import { TEXTES } from './lib/textes';
import {
  BORNES,
  DEFAUTS,
  niveauDe,
  scenarios,
  scenariosPays,
  simuler,
  type Hypotheses,
} from './lib/fire';
import {
  PAYS,
  pays as paysDe,
  regimeCorrespondant,
  regimeParDefaut,
  type ClePays,
  type Regime,
} from './lib/pays';
import { charger, enregistrer, oublier } from './lib/stockage';
import {
  decoderComposition,
  decoderEtat,
  decoderLangue,
  decoderVue,
  encoderEtat,
  lienPartage,
  type Vue,
} from './lib/url';
import {
  bilan,
  compositionParDefaut,
  compositionVide,
  type CleActif,
  type Ligne,
} from './lib/patrimoine';

/**
 * A rate is held as a fraction and edited in percentage points.
 *
 * Three decimals, not one: the Japanese 20,315 % has to survive the trip to the
 * field and back to the tick marks, otherwise clicking its own tick would land
 * on 20,3 % and the regime would stop recognising itself. The rounding is only
 * there to clear the float noise of `× 100`.
 *
 * The rate sliders step by a tenth of a point, so a value like 20,315 sits
 * between two notches: the thumb settles on the nearest one while the field
 * keeps the exact figure. At this scale the offset is invisible, and it is the
 * figure that matters.
 */
const enPoints = (v: number) => Math.round(v * 100_000) / 1_000;

/**
 * Language ownership sits here, above the simulation itself.
 *
 * The application opens in French unless the URL says otherwise, and the URL
 * only carries `lang` once the visitor has picked a language themselves — a
 * link shared by someone who never touched the switcher stays neutral and
 * opens on the default, like any other unset parameter.
 */
export default function App() {
  const [langueUrl, setLangueUrl] = useState(() =>
    decoderLangue(typeof window === 'undefined' ? '' : window.location.search),
  );
  const [langue, setLangue] = useState<Langue>(() => langueUrl ?? LANGUE_PAR_DEFAUT);

  const choisir = (l: Langue) => {
    setLangue(l);
    setLangueUrl(l);
  };

  // The document has to follow: a screen reader announces the page in the
  // wrong voice otherwise, and the tab title is the first thing anyone sees.
  useEffect(() => {
    document.documentElement.lang = langue;
    document.title = TEXTES[langue].meta.titre;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', TEXTES[langue].meta.description);
  }, [langue]);

  return (
    <ContexteLangue value={langue}>
      <Simulateur langue={langue} langueUrl={langueUrl} onLangue={choisir} />
    </ContexteLangue>
  );
}

function Simulateur({
  langue,
  langueUrl,
  onLangue,
}: {
  langue: Langue;
  langueUrl: Langue | null;
  onLangue: (l: Langue) => void;
}) {
  const t = useTextes();
  const tr = useTraduire();
  const { eur, eurCompact, eurSigne, pct, points, tauxPct } = useFormats();

  // Initial state comes from the URL: a shared link must reopen exactly the
  // same simulation.
  const [h, setH] = useState<Hypotheses>(() =>
    decoderEtat(typeof window === 'undefined' ? '' : window.location.search),
  );
  const [mode, setMode] = useState<ModeAffichage>('courant');
  const [comparaison, setComparaison] = useState<'rendement' | 'pays'>('rendement');
  const [vue, setVue] = useState<Vue>(() =>
    decoderVue(typeof window === 'undefined' ? '' : window.location.search),
  );
  // L'adresse d'abord — c'est elle qu'on partage —, puis ce que le navigateur
  // a retenu de la dernière visite, puis l'exemple.
  const [composition, setComposition] = useState<Ligne[]>(
    () =>
      decoderComposition(typeof window === 'undefined' ? '' : window.location.search) ??
      charger() ??
      compositionParDefaut(),
  );
  const [avanceOuvert, setAvanceOuvert] = useState(
    () =>
      h.inflation !== DEFAUTS.inflation ||
      h.horizon !== DEFAUTS.horizon ||
      // The required duration decides the colour of the verdict: a link that
      // customises it must open on the setting that explains that colour.
      h.dureeExigee !== DEFAUTS.dureeExigee ||
      h.modeRetrait !== DEFAUTS.modeRetrait,
  );

  const maj = <K extends keyof Hypotheses>(cle: K, valeur: Hypotheses[K]) =>
    setH((etat) => ({ ...etat, [cle]: valeur }));

  const paysCourant = paysDe(h.pays);
  // Null when the rate has been moved off every preset: a deliberate
  // hypothesis, which the interface names instead of correcting.
  const regimeActif = regimeCorrespondant(h.pays, h.imposition);

  /**
   * Applies a tax regime, and with it a country.
   *
   * Changing country loads that country's whole starting set, not just its tax
   * rate: a plan that makes sense in France does not make the same sense in
   * Japan, and the withdrawal rate is where that shows most. Staying inside the
   * same country moves α alone, so switching envelopes never silently rewrites
   * a return you had chosen yourself.
   */
  const appliquerRegime = (cle: ClePays, regime: Regime) =>
    setH((etat) => ({
      ...etat,
      ...(cle === etat.pays ? {} : paysDe(cle).defauts),
      pays: cle,
      imposition: regime.imposition,
    }));

  const r = useMemo(() => simuler(h), [h]);
  const jeux = useMemo(() => scenarios(h), [h]);
  const central = jeux.find((s) => s.cle === 'central') ?? jeux[0];
  const jeuxPays = useMemo(() => scenariosPays(h), [h]);
  // The verdict is pronounced on the central scenario: it is the plan as the
  // user stated it, the other two being what-ifs around it.
  const niveau = niveauDe(h, central.projection);

  const libelleScenario = {
    pessimiste: t.projection.libellePessimiste,
    central: t.projection.libelleCentral,
    optimiste: t.projection.libelleOptimiste,
  };

  const series: Serie[] =
    comparaison === 'rendement'
      ? jeux.map((s) => ({
          cle: s.cle,
          libelle: libelleScenario[s.cle],
          legende: t.projection.serieTaux(libelleScenario[s.cle], pct(s.rendement, 1)),
          couleur:
            s.cle === 'central' ? 'var(--color-brand-600)' : 'var(--color-brand-400)',
          trajectoire: s.projection,
          secondaire: s.cle !== 'central',
        }))
      : jeuxPays.map((sp) => ({
          cle: sp.pays,
          libelle: tr(paysDe(sp.pays).libelle),
          legende: t.projection.seriePays(
            tr(paysDe(sp.pays).libelle),
            tauxPct(sp.hypotheses.retrait),
            eur(sp.resultat.revenuNetMensuel),
          ),
          couleur: paysDe(sp.pays).couleur,
          trajectoire: sp.projection,
        }));

  // The URL follows the state without pushing a history entry on every slider
  // notch. The delay avoids calling replaceState dozens of times during a
  // single drag.
  useEffect(() => {
    const minuteur = setTimeout(() => {
      const requete = encoderEtat(h, { langue: langueUrl, composition, vue });
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${requete}${window.location.hash}`,
      );
    }, 250);
    return () => clearTimeout(minuteur);
  }, [h, langueUrl, composition, vue]);

  // Rien ne quitte le navigateur : c'est un filet pour revenir sans lien, pas
  // un compte utilisateur.
  useEffect(() => {
    enregistrer(composition);
  }, [composition]);

  const capitalFinal =
    mode === 'courant'
      ? central.projection.capitalFinal
      : central.projection.capitalFinalReel;

  const lien = lienPartage(h, { langue: langueUrl, composition, vue });

  /**
   * Handing the statement over to the withdrawal plan.
   *
   * A one-way copy rather than a permanent link: once the figures are in, the
   * sliders of the other tab have to stay free. The button says so by going
   * quiet when the two already agree.
   */
  const bilanCourant = bilan(composition, h.pays);
  const dejaApplique =
    Math.round(bilanCourant.productif) === Math.round(h.patrimoine) &&
    Math.abs(bilanCourant.rendementRecompose - h.rendement) < 5e-6;

  const appliquerPatrimoine = (patrimoine: number, rendement: number) => {
    setH((etat) => ({ ...etat, patrimoine: Math.round(patrimoine), rendement }));
    setVue('fire');
    window.scrollTo({ top: 0 });
  };

  const majLigne = (cle: CleActif, maj: Partial<Ligne>) =>
    setComposition((lignes) =>
      lignes.map((l) => (l.cle === cle ? { ...l, ...maj } : l)),
    );

  return (
    <div className="min-h-screen">
      <Entete langue={langue} onLangue={onLangue} vue={vue} onVue={setVue} />

      {vue === 'patrimoine' ? (
        <Patrimoine
          composition={composition}
          pays={h.pays}
          imposition={h.imposition}
          // Le pays de résidence est un fait sur la personne, partagé par les
          // deux onglets ; en changer ici ne doit pas pour autant réécrire le
          // plan de retraits, que l'utilisateur a peut-être déjà réglé.
          onPays={(cle) => maj('pays', cle)}
          onLigne={majLigne}
          onEffacer={() => setComposition(compositionVide())}
          onReinitialiser={() => {
            oublier();
            setComposition(compositionParDefaut());
          }}
          onAppliquer={appliquerPatrimoine}
          dejaApplique={dejaApplique}
        />
      ) : (
      <main>
        {/* ---------------------------------------------------------- Hero */}
        <section className="border-b border-ink-200/70 bg-white">
          <div className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:pt-18 sm:pb-16">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {t.hero.badge}
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl">
              {t.hero.titre}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
              {t.hero.intro}
            </p>
            <Avertissement />
          </div>
        </section>

        {/* ----------------------------------------------- Inputs + verdict */}
        <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-ink-900">{t.saisie.titre}</h2>

                <div className="mt-6 rounded-2xl bg-ink-50 p-5 sm:p-6">
                  <Montant
                    label={t.saisie.patrimoineLabel}
                    valeur={h.patrimoine}
                    onChange={(v) => maj('patrimoine', v)}
                    max={BORNES.patrimoine.max}
                    hint={t.saisie.patrimoineHint}
                  />
                  <div className="mt-3">
                    <CurseurLog
                      label={t.saisie.patrimoineLabel}
                      valeur={h.patrimoine}
                      onChange={(v) => maj('patrimoine', v)}
                      reperes={[100_000, 1_000_000, 10_000_000].map((v) => ({
                        valeur: v,
                        label: eurCompact(v),
                      }))}
                    />
                  </div>
                </div>

                <div className="mt-8 grid gap-7 sm:grid-cols-2">
                  <Curseur
                    label={t.saisie.rendementLabel}
                    valeur={enPoints(h.rendement)}
                    min={enPoints(BORNES.rendement.min)}
                    max={enPoints(BORNES.rendement.max)}
                    pas={0.1}
                    onChange={(v) => maj('rendement', v / 100)}
                    rendu={(v) => tauxPct(v / 100)}
                    saisie={{ suffixe: '%', decimales: 2 }}
                    reperes={[0, 5, 8].map((v) => ({
                      valeur: v,
                      label: tauxPct(v / 100),
                    }))}
                    hint={t.saisie.rendementHint}
                  />
                  <Curseur
                    label={t.saisie.retraitLabel}
                    valeur={enPoints(h.retrait)}
                    min={enPoints(BORNES.retrait.min)}
                    max={enPoints(BORNES.retrait.max)}
                    pas={0.1}
                    onChange={(v) => maj('retrait', v / 100)}
                    rendu={(v) => tauxPct(v / 100)}
                    saisie={{ suffixe: '%', decimales: 1 }}
                    reperes={[3, 4, 6].map((v) => ({
                      valeur: v,
                      label: tauxPct(v / 100),
                    }))}
                    hint={t.saisie.retraitHint}
                  />
                </div>

                <div className="mt-8 rounded-2xl bg-ink-50 p-5 sm:p-6">
                  <Segments
                    label={t.saisie.paysLabel}
                    valeur={h.pays}
                    options={PAYS.map((p) => ({ valeur: p.cle, label: tr(p.libelle) }))}
                    onChange={(cle) => appliquerRegime(cle, regimeParDefaut(cle))}
                    hint={t.saisie.changementPays}
                  />

                  <div className="mt-5">
                    <Segments
                      label={t.saisie.enveloppeLabel}
                      // Empty when no preset matches: no segment lights up, and
                      // the note below says why.
                      valeur={regimeActif?.cle ?? ''}
                      options={paysCourant.regimes.map((rg) => ({
                        valeur: rg.cle,
                        label: tr(rg.libelleCourt),
                      }))}
                      onChange={(cle) => {
                        const choisi = paysCourant.regimes.find((rg) => rg.cle === cle);
                        if (choisi) appliquerRegime(h.pays, choisi);
                      }}
                    />
                  </div>

                  <div className="mt-6 border-t border-ink-200 pt-5">
                    <Curseur
                      label={t.saisie.impositionLabel}
                      valeur={enPoints(h.imposition)}
                      min={enPoints(BORNES.imposition.min)}
                      max={enPoints(BORNES.imposition.max)}
                      pas={0.1}
                      onChange={(v) => maj('imposition', v / 100)}
                      rendu={(v) => tauxPct(v / 100)}
                      saisie={{ suffixe: '%', decimales: 3 }}
                      reperes={paysCourant.regimes.map((rg) => ({
                        valeur: enPoints(rg.imposition),
                        label: tauxPct(rg.imposition),
                      }))}
                      hint={t.saisie.impositionHint}
                    />
                  </div>

                  <p className="mt-4 rounded-xl bg-white px-4 py-3 text-xs leading-relaxed text-ink-500">
                    {regimeActif ? (
                      <>
                        <strong className="font-semibold text-ink-900">
                          {tr(regimeActif.libelle)}
                        </strong>{' '}
                        — {tr(regimeActif.composition)} {tr(regimeActif.reserve)}
                      </>
                    ) : (
                      <>
                        <strong className="font-semibold text-ink-900">
                          {t.saisie.tauxPersonnaliseFort}
                        </strong>{' '}
                        {t.saisie.tauxPersonnaliseCorps(
                          tauxPct(h.imposition),
                          tr(paysCourant.libelle),
                        )}
                      </>
                    )}
                  </p>

                  <p className="mt-3 px-1 text-xs leading-relaxed text-ink-400">
                    {tr(paysCourant.justification)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAvanceOuvert((v) => !v)}
                  className="mt-7 text-sm font-medium text-brand-600 transition hover:text-brand-700"
                  aria-expanded={avanceOuvert}
                >
                  {avanceOuvert ? t.saisie.masquer : t.saisie.afficher}{' '}
                  {t.saisie.avanceSuite}
                </button>

                {avanceOuvert && (
                  <div className="mt-6 grid gap-7 border-t border-ink-200 pt-7 sm:grid-cols-2">
                    <Curseur
                      label={t.saisie.inflationLabel}
                      valeur={enPoints(h.inflation)}
                      min={enPoints(BORNES.inflation.min)}
                      max={enPoints(BORNES.inflation.max)}
                      pas={0.1}
                      onChange={(v) => maj('inflation', v / 100)}
                      rendu={(v) => tauxPct(v / 100)}
                      saisie={{ suffixe: '%', decimales: 1 }}
                      reperes={[
                        {
                          valeur: enPoints(paysCourant.defauts.inflation),
                          label: t.saisie.inflationRepere(tr(paysCourant.libelle)),
                        },
                      ]}
                      hint={t.saisie.inflationHint(tr(paysCourant.noteInflation))}
                    />
                    <Curseur
                      label={t.saisie.horizonLabel}
                      valeur={h.horizon}
                      min={BORNES.horizon.min}
                      max={BORNES.horizon.max}
                      pas={1}
                      onChange={(v) => maj('horizon', v)}
                      rendu={(v) => `${v} ${t.saisie.horizonUnite}`}
                      saisie={{ suffixe: t.saisie.horizonUnite }}
                      reperes={[20, 40, 60].map((v) => ({
                        valeur: v,
                        label: String(v),
                      }))}
                      hint={t.saisie.horizonHint}
                    />
                    <Curseur
                      label={t.saisie.dureeLabel}
                      valeur={h.dureeExigee}
                      min={BORNES.dureeExigee.min}
                      max={h.horizon}
                      pas={1}
                      onChange={(v) => maj('dureeExigee', v)}
                      rendu={(v) => `${v} ${t.saisie.horizonUnite}`}
                      saisie={{ suffixe: t.saisie.horizonUnite }}
                      reperes={[20, 30, 40]
                        .filter((v) => v <= h.horizon)
                        .map((v) => ({ valeur: v, label: String(v) }))}
                      hint={t.saisie.dureeHint}
                    />
                    <div className="sm:col-span-2">
                      <Segments
                        label={t.saisie.modeLabel}
                        valeur={h.modeRetrait}
                        options={[
                          { valeur: 'indexe' as const, label: t.saisie.modeIndexe },
                          {
                            valeur: 'proportionnel' as const,
                            label: t.saisie.modeProportionnel,
                          },
                        ]}
                        onChange={(v) => maj('modeRetrait', v)}
                        hint={
                          h.modeRetrait === 'indexe'
                            ? t.saisie.modeHintIndexe
                            : t.saisie.modeHintProportionnel
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              {/* Le panneau dépasse la hauteur d'un écran dès que le train de
                  vie est renseigné : collé par le haut, son bas restait hors
                  d'atteinte. Il défile donc dans lui-même au-delà. */}
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
                <div className="card overflow-hidden">
                  <Verdict h={h} r={r} niveau={niveau} projection={central.projection} />

                  <div className="px-6 py-6 sm:px-8">
                    <dl className="space-y-3">
                      <Stat
                        label={t.stats.retraitBrut}
                        valeur={eur(r.retraitBrut)}
                        annexe={pct(h.retrait, 1)}
                      />
                      <Stat
                        label={t.stats.impots}
                        valeur={eur(r.impots)}
                        annexe={tauxPct(h.imposition)}
                      />
                      <Stat
                        label={t.stats.rendementGenere}
                        valeur={eur(r.rendementGenere)}
                        annexe={pct(h.rendement, 1)}
                      />
                      <Stat
                        label={t.stats.variationCapital}
                        valeur={eurSigne(r.variationCapital)}
                        annexe={t.stats.margeAnnexe(points(r.marge))}
                      />
                      <Stat
                        label={t.stats.capitalDans(h.horizon)}
                        valeur={eur(capitalFinal)}
                        annexe={
                          mode === 'courant'
                            ? t.stats.eurosCourants
                            : t.stats.eurosAujourdhui
                        }
                      />
                    </dl>

                    <p className="mt-5 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
                      {t.stats.noteImpot}
                    </p>
                  </div>
                </div>

                <BoutonPartage lien={lien} />

                <p className="mt-4 px-2 text-xs leading-relaxed text-ink-400">
                  {t.stats.mentionLegale}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- Projection */}
        <section className="border-y border-ink-200/70 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
                  {t.projection.titre(h.horizon)}
                </h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-ink-500">
                  {comparaison === 'rendement'
                    ? t.projection.introRendement
                    : t.projection.introPays}
                </p>
              </div>
              <div className="grid w-full gap-3 sm:w-80">
                <Segments
                  valeur={comparaison}
                  options={[
                    {
                      valeur: 'rendement' as const,
                      label: t.projection.comparerRendement,
                    },
                    { valeur: 'pays' as const, label: t.projection.comparerPays },
                  ]}
                  onChange={setComparaison}
                />
                <Segments
                  valeur={mode}
                  options={[
                    { valeur: 'courant' as const, label: t.projection.eurosCourants },
                    { valeur: 'constant' as const, label: t.projection.pouvoirAchat },
                  ]}
                  onChange={setMode}
                />
              </div>
            </div>

            <div className="card mt-8 p-5 sm:p-8">
              <Projection
                series={series}
                bande={comparaison === 'rendement' ? ['pessimiste', 'optimiste'] : undefined}
                patrimoineInitial={h.patrimoine}
                mode={mode}
                dureeExigee={h.dureeExigee}
              />
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-500">
              {comparaison === 'pays' && `${t.projection.notePays} `}
              {mode === 'courant'
                ? t.projection.noteCourant
                : t.projection.noteConstant(pct(h.inflation, 1), h.horizon)}
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------- Detail */}
        <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-ink-900">
            {t.detail.titre}
          </h2>
          <Detail h={h} r={r} projection={central.projection} />
        </section>

        {/* ---------------------------------------------------- Comparaison */}
        <section className="border-t border-ink-200/70 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              {t.comparaison.titre}
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-ink-500">
              {t.comparaison.intro(eur(h.patrimoine), pct(h.retrait, 1))}
            </p>
            <div className="mt-8">
              <Comparaison h={h} onRegime={appliquerRegime} />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ Objectif */}
        <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t.objectif.titre}
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink-500">{t.objectif.intro}</p>
          <div className="mt-8">
            <Objectif
              h={h}
              requis={r.patrimoineRequis}
              onDepenses={(v) => maj('depensesCibles', v)}
              onPatrimoine={(v) => maj('patrimoine', Math.round(v))}
            />
          </div>
        </section>

        <Sources lienSimulation={lien} />
      </main>
      )}

      <Pied />

      {/* On mobile the verdict sits far above the sliders, so the answer is
          kept visible at all times. */}
      {vue === 'fire' && (
      <div className="sticky bottom-0 z-20 border-t border-ink-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <p className="text-xs text-ink-400">{t.mobile.revenu}</p>
            <p className="tabular text-xl font-semibold text-ink-900">
              {eur(r.revenuNetMensuel)}
            </p>
          </div>
          <span
            className={[
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium',
              niveau === 'insuffisant'
                ? 'bg-brique-50 text-brique-700'
                : niveau === 'suffisant'
                  ? 'bg-brand-50 text-brand-700'
                  : niveau === 'sans-patrimoine'
                    ? 'bg-ink-100 text-ink-600'
                    : 'bg-jade-50 text-jade-700',
            ].join(' ')}
          >
            {niveau === 'insuffisant'
              ? t.mobile.insuffisant
              : niveau === 'suffisant'
                ? t.mobile.suffisant
                : niveau === 'sans-patrimoine'
                  ? t.mobile.sans
                  : t.mobile.preserve}
          </span>
        </div>
      </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Stat({
  label,
  valeur,
  annexe,
}: {
  label: string;
  valeur: string;
  annexe?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="tabular shrink-0 text-sm font-semibold text-ink-900">
        {valeur}
        {annexe && <span className="ml-1.5 font-normal text-ink-400">{annexe}</span>}
      </dd>
    </div>
  );
}
