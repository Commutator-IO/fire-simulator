import { useFormats, useTextes } from '../lib/contexte';
import { AVenir } from './AVenir';

/**
 * A tracker for a stock portfolio, computing profit and loss.
 *
 * Not built yet — this tab states the intent and shows the shape of the screen
 * to come. The figures below are an illustration, chosen to add up so the total
 * P/L is checkable, never a live quote.
 */

type Position = {
  titre: string;
  quantite: number;
  /** Average cost per share paid. */
  pru: number;
  /** Last illustrative price. */
  cours: number;
};

const POSITIONS: Position[] = [
  { titre: 'ETF MSCI World', quantite: 120, pru: 88, cours: 112 },
  { titre: 'Apple', quantite: 40, pru: 150, cours: 205 },
  { titre: 'ASML', quantite: 10, pru: 560, cours: 700 },
  { titre: 'LVMH', quantite: 15, pru: 720, cours: 610 },
  { titre: 'TotalEnergies', quantite: 60, pru: 52, cours: 58 },
];

export function Bourse() {
  const t = useTextes();
  const { eur, eurSigne, tauxPct } = useFormats();

  const lignes = POSITIONS.map((p) => {
    const revient = p.quantite * p.pru;
    const valeur = p.quantite * p.cours;
    const pl = valeur - revient;
    return { ...p, revient, valeur, pl, rendement: revient > 0 ? pl / revient : 0 };
  });
  const revient = lignes.reduce((s, l) => s + l.revient, 0);
  const valeur = lignes.reduce((s, l) => s + l.valeur, 0);
  const pl = valeur - revient;

  const apercu = (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 text-left font-medium">{t.bourse.colTitre}</th>
              <th className="px-4 py-3 text-right font-medium">{t.bourse.colQuantite}</th>
              <th className="px-4 py-3 text-right font-medium">{t.bourse.colPru}</th>
              <th className="px-4 py-3 text-right font-medium">{t.bourse.colCours}</th>
              <th className="px-4 py-3 text-right font-medium">{t.bourse.colValeur}</th>
              <th className="px-4 py-3 text-right font-medium">{t.bourse.colPl}</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.titre} className="border-b border-ink-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-800">{l.titre}</td>
                <td className="tabular px-4 py-3 text-right text-ink-600">{l.quantite}</td>
                <td className="tabular px-4 py-3 text-right text-ink-600">{eur(l.pru)}</td>
                <td className="tabular px-4 py-3 text-right text-ink-600">{eur(l.cours)}</td>
                <td className="tabular px-4 py-3 text-right text-ink-800">{eur(l.valeur)}</td>
                <td
                  className={`tabular px-4 py-3 text-right font-medium ${
                    l.pl >= 0 ? 'text-jade-600' : 'text-brique-600'
                  }`}
                >
                  {eurSigne(l.pl)}
                  <span className="ml-1.5 text-xs font-normal text-ink-400">
                    {tauxPct(l.rendement)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-900">
              <td className="px-4 py-3" colSpan={4}>
                {t.bourse.total}
              </td>
              <td className="tabular px-4 py-3 text-right">{eur(valeur)}</td>
              <td
                className={`tabular px-4 py-3 text-right ${
                  pl >= 0 ? 'text-jade-600' : 'text-brique-600'
                }`}
              >
                {eurSigne(pl)}
                <span className="ml-1.5 text-xs font-normal text-ink-400">
                  {tauxPct(revient > 0 ? pl / revient : 0)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <AVenir
      titre={t.bourse.titre}
      intro={t.bourse.intro}
      promesses={t.bourse.promesses}
      apercu={apercu}
    />
  );
}
