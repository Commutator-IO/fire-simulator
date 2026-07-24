import { useFormats, useTextes, useTraduire } from '../lib/contexte';
import { PAYS, type ClePays } from '../lib/pays';
import {
  BORNES_LIGNE,
  CATEGORIES,
  COULEURS_CATEGORIES,
  actifsDe,
  ailleurs,
  bilan,
  coutDetention,
  locatif,
  rendementEffectif,
  type Actif,
  type CategorieActif,
  type CleActif,
  type Ligne,
} from '../lib/patrimoine';
import { useChampNumerique } from '../lib/champNumerique';
import { Segments } from './Champs';

/**
 * The second simulator: what you own, what it earns, and what it costs to keep.
 *
 * It exists because the first one opens on two questions most people cannot
 * answer — how much capital, at what return. Here the answer is assembled from
 * things one actually holds, and handed over in one click.
 */

type Props = {
  composition: Ligne[];
  pays: ClePays;
  imposition: number;
  onPays: (p: ClePays) => void;
  onLigne: (cle: CleActif, ligne: Partial<Ligne>) => void;
  onEffacer: () => void;
  onAppliquer: (patrimoine: number, rendement: number) => void;
  /** Whether the withdrawal simulator already runs on these figures. */
  dejaApplique: boolean;
};

export function Patrimoine({
  composition,
  pays,
  imposition,
  onPays,
  onLigne,
  onEffacer,
  onAppliquer,
  dejaApplique,
}: Props) {
  const t = useTextes();
  const tr = useTraduire();
  const { eur, pct, tauxPct } = useFormats();

  const catalogue = actifsDe(pays);
  const b = bilan(composition, pays);
  const cout = coutDetention(composition, pays, imposition);
  const horsPays = ailleurs(composition, pays);

  const lignesDe = (categorie: CategorieActif) =>
    catalogue
      .filter((a) => a.categorie === categorie)
      .map((a) => ({ actif: a, ligne: composition.find((l) => l.cle === a.cle) }))
      .filter((x): x is { actif: Actif; ligne: Ligne } => x.ligne !== undefined);

  return (
    <main>
      <section className="border-b border-ink-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:pt-16 sm:pb-14">
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink-900 sm:text-4xl">
            {t.patrimoine.titre}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
            {t.patrimoine.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* ------------------------------------------------------ Saisie */}
          <div className="lg:col-span-7">
            <div className="card mb-6 p-5 sm:p-6">
              <Segments
                label={t.saisie.paysLabel}
                valeur={pays}
                options={PAYS.map((p) => ({ valeur: p.cle, label: tr(p.libelle) }))}
                onChange={onPays}
                hint={t.patrimoine.paysHint}
              />
              {horsPays > 0 && (
                <p className="mt-3 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
                  {t.patrimoine.horsPays(eur(horsPays))}
                </p>
              )}
            </div>

            <div className="card overflow-hidden">
              {/* Une liste, pas un tableau : ce sont une douzaine de champs à
                  remplir, et sur un écran étroit la colonne de saisie d'un
                  tableau se réduit à quelques caractères. Ici l'intitulé passe
                  au-dessus et les champs se partagent la largeur. */}
              <div className="hidden items-baseline gap-3 border-b border-ink-200 px-5 py-3 text-xs uppercase tracking-wide text-ink-400 sm:flex">
                <span className="flex-1">{t.patrimoine.colActif}</span>
                <span className="w-32 text-right">{t.patrimoine.colMontant}</span>
                <span className="w-24 text-right">{t.patrimoine.colRendementCourt}</span>
              </div>

              {CATEGORIES.map((categorie) => {
                const lignes = lignesDe(categorie);
                if (lignes.length === 0) return null;
                return (
                  <section key={categorie}>
                    <h2 className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500 sm:px-5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: COULEURS_CATEGORIES[categorie] }}
                      />
                      {t.patrimoine.categorie[categorie]}
                    </h2>
                    {lignes.map(({ actif, ligne }) => (
                      <LigneActif
                        key={actif.cle}
                        actif={actif}
                        ligne={ligne}
                        onLigne={onLigne}
                      />
                    ))}
                  </section>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200/70 bg-ink-50 px-3 py-4 sm:px-5">
                <p className="max-w-xl text-xs leading-relaxed text-ink-500">
                  {t.patrimoine.note}
                </p>
                {b.renseigne && (
                  <button
                    type="button"
                    onClick={onEffacer}
                    className="shrink-0 text-xs font-medium text-ink-500 underline decoration-ink-300 underline-offset-2 transition hover:text-brique-600"
                  >
                    {t.patrimoine.effacer}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------- Bilan */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="card overflow-hidden">
                <div className="bg-brand-700 px-6 py-7 text-white sm:px-8">
                  <p className="text-sm text-brand-100">{t.patrimoine.productif}</p>
                  <p className="tabular mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                    {eur(b.productif)}
                  </p>
                  <p className="mt-1.5 text-sm text-brand-100">
                    {t.patrimoine.rendement} :{' '}
                    <strong className="font-semibold text-white">
                      {tauxPct(b.rendementRecompose)}
                    </strong>
                  </p>

                  {b.renseigne && b.productif <= 0 && (
                    <p className="mt-4 rounded-xl bg-black/15 px-4 py-3 text-xs leading-relaxed">
                      {t.patrimoine.negatif}
                    </p>
                  )}
                </div>

                <div className="px-6 py-6 sm:px-8">
                  {!b.renseigne ? (
                    <p className="text-sm leading-relaxed text-ink-500">
                      {t.patrimoine.vide}
                    </p>
                  ) : (
                    <>
                      <dl className="space-y-3">
                        <Poste label={t.patrimoine.brut} valeur={eur(b.brut)} />
                        {b.dettes > 0 && (
                          <Poste
                            label={t.patrimoine.dettes}
                            valeur={`− ${eur(b.dettes)}`}
                            teinte="text-brique-600"
                          />
                        )}
                        <Poste
                          label={t.patrimoine.net}
                          valeur={eur(b.net)}
                          aide={t.patrimoine.netAide}
                          fort
                        />
                        <Poste
                          label={t.patrimoine.productif}
                          valeur={eur(b.productif)}
                          aide={t.patrimoine.productifAide}
                        />
                        <Poste
                          label={t.patrimoine.rendement}
                          valeur={tauxPct(b.rendementRecompose)}
                          aide={t.patrimoine.rendementAide}
                        />
                        <Poste label={t.patrimoine.gains} valeur={eur(b.gainsAnnuels)} />
                      </dl>

                      {b.parCategorie.length > 0 && (
                        <div className="mt-6">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
                            {t.patrimoine.repartition}
                          </p>
                          <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100">
                            {b.parCategorie
                              .filter((c) => c.categorie !== 'dettes')
                              .map((c) => (
                                <span
                                  key={c.categorie}
                                  className="h-full"
                                  style={{
                                    width: `${c.part * 100}%`,
                                    backgroundColor: COULEURS_CATEGORIES[c.categorie],
                                  }}
                                />
                              ))}
                          </div>
                          <ul className="mt-3 space-y-1.5 text-xs text-ink-500">
                            {b.parCategorie.map((c) => (
                              <li key={c.categorie} className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: COULEURS_CATEGORIES[c.categorie],
                                  }}
                                />
                                <span className="flex-1">
                                  {t.patrimoine.categorie[c.categorie]}
                                </span>
                                <span className="tabular text-ink-700">
                                  {eur(c.montant)}
                                </span>
                                <span className="tabular w-12 text-right text-ink-400">
                                  {pct(c.part, 0)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {b.productif > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => onAppliquer(b.productif, b.rendementRecompose)}
                            disabled={dejaApplique}
                            className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-default disabled:bg-ink-200 disabled:text-ink-500"
                          >
                            {dejaApplique
                              ? t.patrimoine.dejaApplique
                              : t.patrimoine.appliquer}
                          </button>
                          {!dejaApplique && (
                            <p className="mt-2 px-1 text-xs leading-relaxed text-ink-400">
                              {t.patrimoine.applique(
                                eur(b.productif),
                                tauxPct(b.rendementRecompose),
                              )}
                            </p>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {b.renseigne && (
        <>
          <Graphique composition={composition} pays={pays} />
          <Detention cout={cout} bilan={b} imposition={imposition} />
        </>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Ce que la détention coûte
// ---------------------------------------------------------------------------

/**
 * The bill that falls due for owning, before anything is earned.
 *
 * Worth its own section because it is the one figure a net worth statement
 * never shows: a portfolio can be perfectly healthy and still oblige its owner
 * to produce an income simply to keep it.
 */
function Detention({
  cout,
  bilan: b,
  imposition,
}: {
  cout: ReturnType<typeof coutDetention>;
  bilan: ReturnType<typeof bilan>;
  imposition: number;
}) {
  const t = useTextes();
  const { eur, pct, tauxPct } = useFormats();

  return (
    <section className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
          {t.patrimoine.detentionTitre}
        </h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-ink-500">
          {t.patrimoine.detentionIntro}
        </p>

        {cout.total <= 0 ? (
          <p className="card mt-8 p-6 text-sm leading-relaxed text-ink-500">
            {t.patrimoine.detentionRien}
          </p>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-6 sm:p-8">
              <dl className="space-y-3">
                <Poste
                  label={t.patrimoine.taxeFonciere}
                  valeur={eur(cout.taxeFonciere)}
                  aide={t.patrimoine.taxeFonciereAide}
                />
                {cout.impotFortune > 0 && (
                  <Poste
                    label={t.patrimoine.impotFortune}
                    valeur={eur(cout.impotFortune)}
                    aide={t.patrimoine.impotFortuneAide}
                  />
                )}
                <Poste label={t.patrimoine.detentionTotal} valeur={eur(cout.total)} fort />
                <Poste
                  label={t.patrimoine.detentionPart}
                  valeur={pct(cout.partDuPatrimoine, 2)}
                  aide={t.patrimoine.detentionPartAide}
                />
              </dl>
            </div>

            <div className="flex flex-col justify-center rounded-2xl bg-brand-50 p-6 sm:p-8">
              <p className="text-sm text-brand-700">{t.patrimoine.revenuMinimum}</p>
              <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                {eur(cout.revenuMinimum)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {t.patrimoine.revenuMinimumAide(
                  eur(cout.total),
                  tauxPct(imposition),
                  eur(cout.revenuMinimum / 12),
                )}
              </p>
              {b.gainsAnnuels > 0 && (
                <p className="mt-3 border-t border-brand-200/70 pt-3 text-xs leading-relaxed text-ink-500">
                  {t.patrimoine.revenuMinimumPart(
                    pct(Math.min(1, cout.revenuMinimum / b.gainsAnnuels), 0),
                    eur(b.gainsAnnuels),
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Le graphique
// ---------------------------------------------------------------------------

/**
 * Every line drawn to scale, on a shared axis.
 *
 * A column of figures makes you compare numbers; bars make you see the shape of
 * a portfolio — which line dwarfs the others, how far the debts reach back.
 * Debts run leftwards from the zero line, because that is what they do.
 */
function Graphique({ composition, pays }: { composition: Ligne[]; pays: ClePays }) {
  const t = useTextes();
  const tr = useTraduire();
  const { eur, tauxPct } = useFormats();

  const lignes = actifsDe(pays)
    .map((a) => ({ actif: a, ligne: composition.find((l) => l.cle === a.cle) }))
    .filter((x): x is { actif: Actif; ligne: Ligne } => (x.ligne?.montant ?? 0) > 0);

  if (lignes.length === 0) return null;

  const maxi = Math.max(...lignes.map((x) => x.ligne.montant));
  const largeur = (montant: number) => (montant / maxi) * 100;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
        {t.patrimoine.graphiqueTitre}
      </h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-ink-500">
        {t.patrimoine.graphiqueIntro}
      </p>

      <div className="card mt-8 p-5 sm:p-8">
        <ul className="space-y-3">
          {lignes.map(({ actif, ligne }) => {
            const dette = actif.signe === -1;
            return (
              <li key={actif.cle}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-sm">
                  <span className="text-ink-700">
                    {tr(actif.libelle)}
                    {!actif.productif && (
                      <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                        {t.patrimoine.horsRetraits}
                      </span>
                    )}
                  </span>
                  <span className="tabular shrink-0 text-ink-500">
                    <strong
                      className={`font-semibold ${dette ? 'text-brique-600' : 'text-ink-900'}`}
                    >
                      {dette ? `− ${eur(ligne.montant)}` : eur(ligne.montant)}
                    </strong>{' '}
                    {tauxPct(rendementEffectif(ligne))}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${largeur(ligne.montant)}%`,
                      backgroundColor: COULEURS_CATEGORIES[actif.categorie],
                      opacity: actif.productif ? 1 : 0.45,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-400">
          {t.patrimoine.graphiqueNote}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function LigneActif({
  actif,
  ligne,
  onLigne,
}: {
  actif: Actif;
  ligne: Ligne;
  onLigne: (cle: CleActif, maj: Partial<Ligne>) => void;
}) {
  const tr = useTraduire();
  const t = useTextes();
  const { eur, tauxPct } = useFormats();
  const depasse = actif.plafond !== undefined && ligne.montant > actif.plafond;

  return (
    <div className="border-b border-ink-100 px-3 py-3 last:border-0 sm:px-5">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
          <p
            className={
              ligne.montant > 0
                ? 'text-sm font-semibold text-ink-900'
                : 'text-sm text-ink-700'
            }
          >
            {tr(actif.libelle)}
          </p>
          <p className="mt-0.5 max-w-sm text-xs leading-relaxed text-ink-400">
            {tr(actif.note)}
          </p>
          {depasse && (
            <p className="mt-1 text-xs font-medium text-gold-600">
              {t.patrimoine.depasse(eur(actif.plafond!))}
            </p>
          )}
        </div>

        <div className="flex flex-1 gap-2 sm:flex-none">
          <Cellule
            label={`${tr(actif.libelle)} — ${t.patrimoine.colMontant}`}
            valeur={ligne.montant}
            min={BORNES_LIGNE.montant.min}
            max={BORNES_LIGNE.montant.max}
            suffixe="€"
            largeur="flex-1 sm:w-32 sm:flex-none"
            onChange={(montant) => onLigne(actif.cle, { montant })}
          />
          {actif.revenus ? (
            <span
              className="tabular flex w-24 shrink-0 items-center justify-end px-2 py-1.5 text-sm font-semibold text-ink-500"
              aria-label={`${tr(actif.libelle)} — ${t.patrimoine.colRendement}`}
            >
              {tauxPct(locatif(ligne).rendement)}
            </span>
          ) : (
            <Cellule
              label={`${tr(actif.libelle)} — ${t.patrimoine.colRendement}`}
              valeur={Math.round(ligne.rendement * 100_000) / 1_000}
              min={BORNES_LIGNE.rendement.min * 100}
              max={BORNES_LIGNE.rendement.max * 100}
              decimales={2}
              suffixe="%"
              largeur="w-24 shrink-0"
              onChange={(taux) => onLigne(actif.cle, { rendement: taux / 100 })}
            />
          )}
        </div>
      </div>

      {actif.revenus && <Loyers actif={actif} ligne={ligne} onLigne={onLigne} />}
    </div>
  );
}

/**
 * The rent, what it costs, and what the taxman keeps.
 *
 * Its own block because a let property is the one line whose return is a result
 * rather than an assumption — and because the whole gap between the yield people
 * quote and the one they get lives in these three figures.
 */
function Loyers({
  actif,
  ligne,
  onLigne,
}: {
  actif: Actif;
  ligne: Ligne;
  onLigne: (cle: CleActif, maj: Partial<Ligne>) => void;
}) {
  const t = useTextes();
  const { eur, tauxPct } = useFormats();
  const l = locatif(ligne);

  return (
    <div className="mt-3 rounded-xl bg-ink-50 p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <ChampLoyer
          label={t.patrimoine.loyer}
          valeur={ligne.loyer}
          max={BORNES_LIGNE.loyer.max}
          suffixe="€"
          onChange={(loyer) => onLigne(actif.cle, { loyer })}
        />
        <ChampLoyer
          label={t.patrimoine.charges}
          valeur={ligne.charges}
          max={BORNES_LIGNE.loyer.max}
          suffixe="€"
          onChange={(charges) => onLigne(actif.cle, { charges })}
        />
        <ChampLoyer
          label={t.patrimoine.impositionLoyers}
          valeur={Math.round(ligne.impositionRevenus * 100_000) / 1_000}
          max={BORNES_LIGNE.impositionRevenus.max * 100}
          decimales={2}
          suffixe="%"
          onChange={(taux) => onLigne(actif.cle, { impositionRevenus: taux / 100 })}
        />
      </div>

      {ligne.loyer > 0 && (
        <p className="mt-2.5 text-xs leading-relaxed text-ink-500">
          {t.patrimoine.detailLoyers(
            eur(ligne.loyer),
            eur(ligne.charges),
            eur(l.impots),
            eur(l.net),
          )}
          {ligne.montant > 0 && (
            <>
              {' '}
              <strong className="font-semibold text-ink-800">
                {t.patrimoine.rendementLoyers(tauxPct(l.rendement))}
              </strong>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function ChampLoyer({
  label,
  valeur,
  max,
  suffixe,
  decimales = 0,
  onChange,
}: {
  label: string;
  valeur: number;
  max: number;
  suffixe: string;
  decimales?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-500">{label}</span>
      <Cellule
        label={label}
        valeur={valeur}
        min={0}
        max={max}
        suffixe={suffixe}
        decimales={decimales}
        largeur="w-full"
        onChange={onChange}
      />
    </label>
  );
}

/**
 * A compact numeric cell: the field carries no visible label of its own, the
 * row already saying what it is, so the list stays readable at a dozen lines.
 */
function Cellule({
  label,
  valeur,
  min,
  max,
  suffixe,
  largeur,
  decimales = 0,
  onChange,
}: {
  label: string;
  valeur: number;
  min: number;
  max: number;
  suffixe: string;
  largeur: string;
  decimales?: number;
  onChange: (v: number) => void;
}) {
  const champ = useChampNumerique(
    valeur,
    { min, max, decimales, videSiZero: true },
    onChange,
  );

  return (
    <span
      className={`flex items-center justify-end gap-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 ${largeur}`}
    >
      <input
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        placeholder="0"
        value={champ.brouillon}
        onChange={(e) => champ.saisir(e.target.value)}
        onBlur={champ.quitter}
        className="tabular w-full min-w-0 bg-transparent text-right text-sm font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-300"
      />
      <span className="shrink-0 text-xs text-ink-400">{suffixe}</span>
    </span>
  );
}

function Poste({
  label,
  valeur,
  aide,
  fort = false,
  teinte,
}: {
  label: string;
  valeur: string;
  aide?: string;
  fort?: boolean;
  teinte?: string;
}) {
  return (
    <div className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        <dt className={fort ? 'text-sm font-medium text-ink-800' : 'text-sm text-ink-500'}>
          {label}
        </dt>
        <dd
          className={[
            'tabular shrink-0 font-semibold',
            fort ? 'text-base text-ink-900' : 'text-sm',
            teinte ?? 'text-ink-900',
          ].join(' ')}
        >
          {valeur}
        </dd>
      </div>
      {aide && <p className="mt-1 text-xs leading-relaxed text-ink-400">{aide}</p>}
    </div>
  );
}
