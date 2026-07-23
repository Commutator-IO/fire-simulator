import { useFormats, useTextes } from '../lib/contexte';
import { BORNES, type Hypotheses } from '../lib/fire';
import { Montant } from './Champs';

/**
 * The question read backwards: how much capital does a given lifestyle need?
 *
 * Same hypotheses as the rest of the page — change Z or α above and the target
 * moves. It is the number most people actually come looking for, so it gets its
 * own section rather than a line in the breakdown.
 */
export function Objectif({
  h,
  requis,
  onDepenses,
  onPatrimoine,
}: {
  h: Hypotheses;
  requis: number | null;
  onDepenses: (v: number) => void;
  onPatrimoine: (v: number) => void;
}) {
  const t = useTextes();
  const { eur, pct, tauxPct } = useFormats();

  const manque = requis === null ? 0 : requis - h.patrimoine;
  const atteignable = requis !== null && requis <= BORNES.patrimoine.max;

  return (
    <div className="card grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
      <div>
        <Montant
          label={t.objectif.depensesLabel}
          valeur={h.depensesCibles}
          onChange={onDepenses}
          suffixe={t.objectif.depensesUnite}
          max={BORNES.depensesCibles.max}
          placeholder={t.objectif.depensesPlaceholder}
          hint={
            h.depensesCibles > 0
              ? t.objectif.depensesHintRempli(eur(h.depensesCibles / 12))
              : t.objectif.depensesHintVide
          }
        />

        <p className="mt-5 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          {t.objectif.explication(
            pct(h.retrait, 1),
            tauxPct(h.imposition),
            eur(h.retrait * (1 - h.imposition)),
          )}
        </p>
      </div>

      <div className="flex flex-col justify-center rounded-2xl bg-brand-50 p-6">
        {requis === null ? (
          <>
            <p className="text-sm font-medium text-brand-800">{t.objectif.aucunTitre}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {h.depensesCibles <= 0
                ? t.objectif.aucunCorpsVide
                : t.objectif.aucunCorpsImpossible}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-brand-700">{t.objectif.requisLabel}</p>
            <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {atteignable ? eur(requis) : t.objectif.horsEchelle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              {manque <= 0 ? (
                <>
                  {t.objectif.avanceCorpsDebut}
                  <strong className="font-semibold text-ink-900">
                    {t.objectif.avanceFort(eur(-manque))}
                  </strong>
                  {t.objectif.avanceCorpsFin}
                </>
              ) : (
                <>
                  {t.objectif.manqueDebut}
                  <strong className="font-semibold text-ink-900">{eur(manque)}</strong>
                  {t.objectif.manqueFin(pct(manque / Math.max(requis, 1), 0))}
                </>
              )}
            </p>

            {atteignable && manque > 0 && (
              <button
                type="button"
                onClick={() => onPatrimoine(requis)}
                className="mt-5 self-start rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {t.objectif.appliquer}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
