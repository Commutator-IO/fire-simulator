import { useFormats, useTextes, useTraduire } from '../lib/contexte';
import {
  BORNES_LIGNE,
  CATEGORIES,
  COULEURS_CATEGORIES,
  actif,
  bilan,
  type CategorieActif,
  type CleActif,
  type Ligne,
} from '../lib/patrimoine';
import { useChampNumerique } from '../lib/champNumerique';

/**
 * The second simulator: what you own, and what it earns.
 *
 * It exists because the first one opens on two questions most people cannot
 * answer — how much capital, at what return. Here the answer is assembled from
 * things one actually holds, and handed over in one click.
 */

type Props = {
  composition: Ligne[];
  onLigne: (cle: CleActif, ligne: Partial<Ligne>) => void;
  onEffacer: () => void;
  onAppliquer: (patrimoine: number, rendement: number) => void;
  /** Whether the withdrawal simulator already runs on these figures. */
  dejaApplique: boolean;
};

export function Patrimoine({
  composition,
  onLigne,
  onEffacer,
  onAppliquer,
  dejaApplique,
}: Props) {
  const t = useTextes();
  const { eur, pct, tauxPct } = useFormats();
  const b = bilan(composition);

  const lignesDe = (categorie: CategorieActif) =>
    composition.filter((l) => actif(l.cle).categorie === categorie);

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
            <div className="card overflow-hidden">
              {/* Une liste, pas un tableau : ce sont quatorze champs à
                  remplir, et sur un écran étroit la colonne de saisie d'un
                  tableau se réduit à quelques caractères. Ici l'intitulé passe
                  au-dessus et les deux champs se partagent la largeur. */}
              <div className="hidden items-baseline gap-3 border-b border-ink-200 px-5 py-3 text-xs uppercase tracking-wide text-ink-400 sm:flex">
                <span className="flex-1">{t.patrimoine.colActif}</span>
                <span className="w-32 text-right">{t.patrimoine.colMontant}</span>
                <span className="w-24 text-right">{t.patrimoine.colRendementCourt}</span>
              </div>

              {CATEGORIES.map((categorie) => (
                <section key={categorie}>
                  <h2 className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500 sm:px-5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COULEURS_CATEGORIES[categorie] }}
                    />
                    {t.patrimoine.categorie[categorie]}
                  </h2>
                  {lignesDe(categorie).map((ligne) => (
                    <LigneActif key={ligne.cle} ligne={ligne} onLigne={onLigne} />
                  ))}
                </section>
              ))}

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
            <div className="lg:sticky lg:top-24">
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
                      )}

                      {b.productif > 0 && !dejaApplique && (
                        <p className="mt-2 px-1 text-xs leading-relaxed text-ink-400">
                          {t.patrimoine.applique(
                            eur(b.productif),
                            tauxPct(b.rendementRecompose),
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------

function LigneActif({
  ligne,
  onLigne,
}: {
  ligne: Ligne;
  onLigne: (cle: CleActif, maj: Partial<Ligne>) => void;
}) {
  const tr = useTraduire();
  const t = useTextes();
  const { eur } = useFormats();
  const a = actif(ligne.cle);
  const depasse = a.plafond !== undefined && ligne.montant > a.plafond;

  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-ink-100 px-3 py-3 last:border-0 sm:px-5">
      <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
        <p
          className={
            ligne.montant > 0
              ? 'text-sm font-semibold text-ink-900'
              : 'text-sm text-ink-700'
          }
        >
          {tr(a.libelle)}
        </p>
        <p className="mt-0.5 max-w-sm text-xs leading-relaxed text-ink-400">
          {tr(a.note)}
        </p>
        {depasse && (
          <p className="mt-1 text-xs font-medium text-gold-600">
            {t.patrimoine.depasse(eur(a.plafond!))}
          </p>
        )}
      </div>

      <div className="flex flex-1 gap-2 sm:flex-none">
        <Cellule
          label={`${tr(a.libelle)} — ${t.patrimoine.colMontant}`}
          valeur={ligne.montant}
          min={BORNES_LIGNE.montant.min}
          max={BORNES_LIGNE.montant.max}
          suffixe="€"
          largeur="flex-1 sm:w-32 sm:flex-none"
          onChange={(montant) => onLigne(ligne.cle, { montant })}
        />
        <Cellule
          label={`${tr(a.libelle)} — ${t.patrimoine.colRendement}`}
          valeur={Math.round(ligne.rendement * 100_000) / 1_000}
          min={BORNES_LIGNE.rendement.min * 100}
          max={BORNES_LIGNE.rendement.max * 100}
          decimales={2}
          suffixe="%"
          largeur="w-24 shrink-0"
          onChange={(taux) => onLigne(ligne.cle, { rendement: taux / 100 })}
        />
      </div>
    </div>
  );
}

/**
 * A compact numeric cell: the field carries no visible label, the row already
 * saying what it is, so the table stays readable at fourteen lines.
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
    { min, max, decimales, videSiZero: suffixe === '€' },
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
        className="tabular w-full min-w-0 bg-transparent text-right font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-300"
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
