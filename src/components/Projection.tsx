import { useMemo, useRef, useState } from 'react';
import { useFormats, useTextes } from '../lib/contexte';
import type { Scenario } from '../lib/fire';

export type ModeAffichage = 'courant' | 'constant';

type Props = {
  scenarios: Scenario[];
  patrimoineInitial: number;
  mode: ModeAffichage;
};

const L = 64; // left margin
const R = 16;
const T = 16;
const B = 34;
const W = 720;
const H = 300;

/** Rounds an axis step to 1, 2, 2.5 or 5 times a power of ten. */
function pasLisible(brut: number): number {
  if (brut <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(brut));
  const normalise = brut / magnitude;
  const palier = [1, 2, 2.5, 5, 10].find((p) => normalise <= p) ?? 10;
  return palier * magnitude;
}

/**
 * Capital over the horizon, under the three compared returns.
 *
 * Drawn as SVG and scaled through the viewBox — no external dependency.
 *
 * Two decisions carry most of the meaning. The vertical axis starts at zero,
 * because on this chart zero is the event that matters and a truncated axis
 * would hide how close the curve gets to it. And the starting capital is drawn
 * as a horizontal reference: staying above that line *is* the answer to
 * "without touching the capital".
 */
export function Projection({ scenarios, patrimoineInitial, mode }: Props) {
  const t = useTextes();
  const { eur, eurCompact, pct } = useFormats();
  const svgRef = useRef<SVGSVGElement>(null);
  const [survol, setSurvol] = useState<number | null>(null);

  const central = scenarios.find((s) => s.cle === 'central') ?? scenarios[0];
  const pessimiste = scenarios.find((s) => s.cle === 'pessimiste') ?? central;
  const optimiste = scenarios.find((s) => s.cle === 'optimiste') ?? central;

  const horizon = central.projection.annees.length;

  // Year 0 is the starting capital: without it the curves would appear to
  // begin after the first withdrawal.
  const serie = useMemo(
    () => (s: Scenario) =>
      [
        patrimoineInitial,
        ...s.projection.annees.map((a) =>
          mode === 'courant' ? a.capitalFin : a.capitalFinReel,
        ),
      ],
    [patrimoineInitial, mode],
  );

  const { x, y, cheminDe, bande, graduationsY, graduationsX } = useMemo(() => {
    const toutes = scenarios.flatMap(serie);
    const maxBrut = Math.max(...toutes, patrimoineInitial, 1);
    const pasY = pasLisible(maxBrut / 4);
    const maxY = Math.ceil(maxBrut / pasY) * pasY;

    const x = (annee: number) => L + (annee / Math.max(1, horizon)) * (W - L - R);
    const y = (valeur: number) => T + (1 - valeur / maxY) * (H - T - B);

    const cheminDe = (valeurs: number[]) =>
      valeurs
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(' ');

    // Out along the optimistic curve, back along the pessimistic one: the
    // enclosed area is the spread between the two.
    const basses = serie(pessimiste);
    const retour = basses
      .map((valeur, annee) => ({ valeur, annee }))
      .reverse()
      .map(({ valeur, annee }) => `L${x(annee).toFixed(1)},${y(valeur).toFixed(1)}`)
      .join(' ');
    const bande = `${cheminDe(serie(optimiste))} ${retour} Z`;

    const graduationsY: number[] = [];
    for (let v = 0; v <= maxY + 1; v += pasY) graduationsY.push(v);

    const pasX = Math.max(1, pasLisible(horizon / 5));
    const graduationsX: number[] = [];
    for (let v = 0; v <= horizon; v += pasX) graduationsX.push(Math.round(v));

    return { x, y, cheminDe, bande, graduationsY, graduationsX };
  }, [scenarios, serie, patrimoineInitial, horizon, optimiste, pessimiste]);

  const anneeSurvolee = survol ?? horizon;
  const valeurA = (s: Scenario, annee: number) => serie(s)[annee] ?? 0;

  const anneeDepuisX = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const annee = Math.round(((ratio * W - L) / (W - L - R)) * horizon);
    return Math.min(horizon, Math.max(0, annee));
  };

  const epuisement = central.projection.anneeEpuisement;
  // Worth showing separately: the central scenario can hold while the
  // pessimistic one breaks, and that is exactly the risk being taken.
  const epuisementPessimiste = pessimiste.projection.anneeEpuisement;

  return (
    <figure className="m-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={t.projection.aria(horizon, mode === 'constant')}
        onMouseMove={(e) => setSurvol(anneeDepuisX(e.clientX))}
        onMouseLeave={() => setSurvol(null)}
      >
        <defs>
          <linearGradient id="degradeCapital" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid */}
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

        {/* X axis, in years */}
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

        {/* Spread between the pessimistic and optimistic scenarios */}
        <path d={bande} fill="var(--color-brand-500)" opacity="0.1" />
        <path
          d={`${cheminDe(serie(central))} L${x(horizon).toFixed(1)},${H - B} L${L},${H - B} Z`}
          fill="url(#degradeCapital)"
        />

        {/* Starting capital: the line that must not be crossed downwards.
            Neutral on purpose — it is a reference, not a value, and colouring
            it would put it in competition with the curves. */}
        <line
          x1={L}
          x2={W - R}
          y1={y(patrimoineInitial)}
          y2={y(patrimoineInitial)}
          stroke="var(--color-ink-400)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />

        <path
          d={cheminDe(serie(pessimiste))}
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d={cheminDe(serie(optimiste))}
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d={cheminDe(serie(central))}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {epuisementPessimiste !== null && epuisementPessimiste !== epuisement && (
          <circle
            cx={x(epuisementPessimiste)}
            cy={y(0)}
            r="4"
            fill="var(--color-brique-200)"
            stroke="#fff"
            strokeWidth="2"
          />
        )}

        {/* Depletion of the central scenario */}
        {epuisement !== null && (
          <>
            <line
              x1={x(epuisement)}
              x2={x(epuisement)}
              y1={T}
              y2={H - B}
              stroke="var(--color-brique-500)"
              strokeWidth="1.5"
            />
            <circle
              cx={x(epuisement)}
              cy={y(0)}
              r="5"
              fill="var(--color-brique-500)"
              stroke="#fff"
              strokeWidth="2"
            />
          </>
        )}

        {/* Hovered year */}
        <line
          x1={x(anneeSurvolee)}
          x2={x(anneeSurvolee)}
          y1={T}
          y2={H - B}
          stroke="var(--color-ink-300)"
          strokeWidth="1"
        />
        <circle
          cx={x(anneeSurvolee)}
          cy={y(valeurA(central, anneeSurvolee))}
          r="6"
          fill="var(--color-brand-600)"
          stroke="#fff"
          strokeWidth="2.5"
        />
      </svg>

      <figcaption className="mt-3 space-y-2 text-xs text-ink-500">
        <p className="font-medium text-ink-700">
          {anneeSurvolee === 0
            ? t.projection.survolAujourdhui
            : t.projection.survolAnnee(anneeSurvolee)}{' '}
          —{' '}
          {t.projection.survolCorps(
            eur(valeurA(central, anneeSurvolee)),
            eur(valeurA(pessimiste, anneeSurvolee)),
            eur(valeurA(optimiste, anneeSurvolee)),
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-brand-600" />
            {t.projection.legendeCentral(pct(central.rendement, 1))}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-brand-500/20" />
            {t.projection.legendeBande(
              pct(pessimiste.rendement, 1),
              pct(optimiste.rendement, 1),
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-ink-400" />
            {t.projection.legendeDepart(eur(patrimoineInitial))}
          </span>
          {epuisement !== null && (
            <span className="flex items-center gap-1.5 text-brique-600">
              <span className="h-2.5 w-0.5 rounded-full bg-brique-500" />
              {t.projection.legendeEpuisement(epuisement)}
            </span>
          )}
          {epuisementPessimiste !== null && epuisementPessimiste !== epuisement && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brique-200" />
              {t.projection.legendeEpuisementPessimiste(epuisementPessimiste)}
            </span>
          )}
        </p>
      </figcaption>
    </figure>
  );
}
