import { useMemo, useRef, useState } from 'react';
import { useFormats, useTextes } from '../lib/contexte';
import type { AnneeDetention } from '../lib/patrimoine';

/**
 * What the loan and the taxman weigh, year after year.
 *
 * The two move in opposite directions, and the second move is the one nobody
 * expects: repaying a mortgage lowers the debt but raises the wealth tax base,
 * loans being deductible from it. Drawn together, the crossing is visible.
 *
 * Cumulative rather than yearly, because a single year's property tax is a
 * rounding error next to a mortgage — it is only over twenty years that the two
 * become comparable, and that is exactly the comparison worth making.
 */

const L = 64;
const R = 16;
const T = 16;
const B = 34;
const W = 720;
const H = 280;

function pasLisible(brut: number): number {
  if (brut <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(brut));
  const normalise = brut / magnitude;
  const palier = [1, 2, 2.5, 5, 10].find((p) => normalise <= p) ?? 10;
  return palier * magnitude;
}

export function Chronique({ annees }: { annees: AnneeDetention[] }) {
  const t = useTextes();
  const { eur, eurCompact, pct } = useFormats();
  const svgRef = useRef<SVGSVGElement>(null);
  const [survol, setSurvol] = useState<number | null>(null);

  const horizon = annees.length;

  const series = useMemo(
    () => [
      {
        cle: 'dette',
        libelle: t.chronique.dette,
        couleur: 'var(--color-brique-500)',
        valeurs: annees.map((a) => a.detteRestante),
      },
      {
        cle: 'interets',
        libelle: t.chronique.interets,
        couleur: 'var(--color-brique-200)',
        valeurs: annees.map((a) => a.interetsCumules),
      },
      {
        cle: 'impots',
        libelle: t.chronique.impots,
        couleur: 'var(--color-ink-400)',
        valeurs: annees.map((a) => a.impotsCumules),
      },
    ],
    [annees, t],
  );

  const { x, y, cheminDe, graduationsY, graduationsX } = useMemo(() => {
    const maxBrut = Math.max(1, ...series.flatMap((s) => s.valeurs));
    const pasY = pasLisible(maxBrut / 4);
    const maxY = Math.ceil(maxBrut / pasY) * pasY;

    const x = (annee: number) => L + (annee / Math.max(1, horizon)) * (W - L - R);
    const y = (v: number) => T + (1 - v / maxY) * (H - T - B);

    // L'année 0 est le point de départ : la dette entière, rien encore payé.
    const cheminDe = (valeurs: number[], depart: number) =>
      [depart, ...valeurs]
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(' ');

    const graduationsY: number[] = [];
    for (let v = 0; v <= maxY + 1; v += pasY) graduationsY.push(v);

    const pasX = Math.max(1, pasLisible(horizon / 5));
    const graduationsX: number[] = [];
    for (let v = 0; v <= horizon; v += pasX) graduationsX.push(Math.round(v));

    return { x, y, cheminDe, graduationsY, graduationsX };
  }, [series, horizon]);

  const depart = (cle: string) =>
    cle === 'dette' ? (annees[0]?.detteRestante ?? 0) + (annees[0]?.interets ?? 0) : 0;

  const anneeSurvolee = survol ?? horizon;
  const courante = annees[anneeSurvolee - 1] ?? annees.at(-1)!;

  const anneeDepuisX = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return horizon;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.min(horizon, Math.max(1, Math.round(((ratio * W - L) / (W - L - R)) * horizon)));
  };

  return (
    <figure className="m-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={t.chronique.aria(horizon)}
        onMouseMove={(e) => setSurvol(anneeDepuisX(e.clientX))}
        onMouseLeave={() => setSurvol(null)}
      >
        {graduationsY.map((v) => (
          <g key={v}>
            <line
              x1={L}
              x2={W - R}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-ink-200)"
              strokeDasharray="3 4"
            />
            <text
              x={L - 10}
              y={y(v) + 4}
              textAnchor="end"
              className="tabular"
              fontSize="11"
              fill="var(--color-ink-400)"
            >
              {eurCompact(v)}
            </text>
          </g>
        ))}

        {graduationsX.map((v, i) => (
          <text
            key={v}
            x={x(v)}
            y={H - B + 20}
            textAnchor={i === 0 ? 'start' : 'middle'}
            className="tabular"
            fontSize="11"
            fill="var(--color-ink-400)"
          >
            {v === 0 ? t.projection.aujourdhui : t.projection.an(v)}
          </text>
        ))}

        {series.map((s) => (
          <path
            key={s.cle}
            d={cheminDe(s.valeurs, depart(s.cle))}
            fill="none"
            stroke={s.couleur}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        <line
          x1={x(anneeSurvolee)}
          x2={x(anneeSurvolee)}
          y1={T}
          y2={H - B}
          stroke="var(--color-ink-300)"
          strokeWidth="1"
        />
        {series.map((s) => (
          <circle
            key={`point-${s.cle}`}
            cx={x(anneeSurvolee)}
            cy={y(s.valeurs[anneeSurvolee - 1] ?? 0)}
            r="5"
            fill={s.couleur}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>

      <figcaption className="mt-3 space-y-2 text-xs text-ink-500">
        <p className="font-medium text-ink-700">
          {t.projection.survolAnnee(anneeSurvolee)} —{' '}
          {series
            .map((s) => `${s.libelle} ${eur(s.valeurs[anneeSurvolee - 1] ?? 0)}`)
            .join(' · ')}
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {series.map((s) => (
            <span key={`legende-${s.cle}`} className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: s.couleur }}
              />
              {s.libelle}
            </span>
          ))}
        </p>
        {courante !== undefined && (
          <p>
            {t.chronique.poids(
              pct(
                courante.patrimoineNet > 0
                  ? (courante.detteRestante + courante.impots) / courante.patrimoineNet
                  : 0,
                1,
              ),
              eur(courante.patrimoineNet),
            )}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
