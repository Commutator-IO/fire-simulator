import { useMemo, useRef, useState } from 'react';
import { useFormats, useTextes } from '../lib/contexte';
import type { Projection as Trajectoire } from '../lib/fire';

export type ModeAffichage = 'courant' | 'constant';

/**
 * One curve on the chart.
 *
 * The component knows nothing of returns or countries: it draws whatever series
 * it is handed. That is what lets the same chart compare three returns in one
 * view and two countries in the next, without a branch per comparison.
 */
export type Serie = {
  cle: string;
  /** Short form, used in the hovered read-out where space is scarce. */
  libelle: string;
  /** Long form for the legend; falls back to the short one. */
  legende?: string;
  couleur: string;
  trajectoire: Trajectoire;
  /** Drawn thin and dashed, and left out of the hovered read-out. */
  secondaire?: boolean;
};

type Props = {
  series: Serie[];
  /** Keys of the two series enclosing the shaded band, when there is one. */
  bande?: [string, string];
  patrimoineInitial: number;
  mode: ModeAffichage;
  /** Year the capital is required to reach, drawn as a vertical marker. */
  dureeExigee: number;
  /** Year a future pension starts, drawn as a vertical marker; 0 for none. */
  anneeRente?: number;
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
 * Capital over the horizon.
 *
 * Drawn as SVG and scaled through the viewBox — no external dependency.
 *
 * Two decisions carry most of the meaning. The vertical axis starts at zero,
 * because on this chart zero is the event that matters and a truncated axis
 * would hide how close the curve gets to it. And the starting capital is drawn
 * as a horizontal reference: staying above that line *is* the answer to
 * "without touching the capital".
 */
export function Projection({
  series,
  bande,
  patrimoineInitial,
  mode,
  dureeExigee,
  anneeRente = 0,
}: Props) {
  const t = useTextes();
  const { eur, eurCompact } = useFormats();
  const svgRef = useRef<SVGSVGElement>(null);
  const [survol, setSurvol] = useState<number | null>(null);

  const principale = series.find((s) => !s.secondaire) ?? series[0];
  const horizon = principale.trajectoire.annees.length;

  // Year 0 is the starting capital: without it the curves would appear to
  // begin after the first withdrawal.
  const valeurs = useMemo(
    () => (s: Serie) =>
      [
        patrimoineInitial,
        ...s.trajectoire.annees.map((a) =>
          mode === 'courant' ? a.capitalFin : a.capitalFinReel,
        ),
      ],
    [patrimoineInitial, mode],
  );

  const { x, y, cheminDe, aireBande, graduationsY, graduationsX } = useMemo(() => {
    const toutes = series.flatMap(valeurs);
    const maxBrut = Math.max(...toutes, patrimoineInitial, 1);
    const pasY = pasLisible(maxBrut / 4);
    const maxY = Math.ceil(maxBrut / pasY) * pasY;

    const x = (annee: number) => L + (annee / Math.max(1, horizon)) * (W - L - R);
    const y = (valeur: number) => T + (1 - valeur / maxY) * (H - T - B);

    const cheminDe = (points: number[]) =>
      points
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(' ');

    // Out along the upper curve, back along the lower one: the enclosed area is
    // the spread between the two.
    const haute = bande && series.find((s) => s.cle === bande[1]);
    const basse = bande && series.find((s) => s.cle === bande[0]);
    const aireBande =
      haute && basse
        ? `${cheminDe(valeurs(haute))} ${valeurs(basse)
            .map((valeur, annee) => ({ valeur, annee }))
            .reverse()
            .map(({ valeur, annee }) => `L${x(annee).toFixed(1)},${y(valeur).toFixed(1)}`)
            .join(' ')} Z`
        : null;

    const graduationsY: number[] = [];
    for (let v = 0; v <= maxY + 1; v += pasY) graduationsY.push(v);

    const pasX = Math.max(1, pasLisible(horizon / 5));
    const graduationsX: number[] = [];
    for (let v = 0; v <= horizon; v += pasX) graduationsX.push(Math.round(v));

    return { x, y, cheminDe, aireBande, graduationsY, graduationsX };
  }, [series, valeurs, bande, patrimoineInitial, horizon]);

  const anneeSurvolee = survol ?? horizon;
  const valeurA = (s: Serie, annee: number) => valeurs(s)[annee] ?? 0;

  const anneeDepuisX = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const annee = Math.round(((ratio * W - L) / (W - L - R)) * horizon);
    return Math.min(horizon, Math.max(0, annee));
  };

  const principales = series.filter((s) => !s.secondaire);

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
            <stop offset="0%" stopColor={principale.couleur} stopOpacity="0.16" />
            <stop offset="100%" stopColor={principale.couleur} stopOpacity="0" />
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

        {aireBande && <path d={aireBande} fill={principale.couleur} opacity="0.1" />}

        {/* Only a single leading curve gets a filled area: two of them would
            muddy each other exactly where the comparison is read. */}
        {principales.length === 1 && (
          <path
            d={`${cheminDe(valeurs(principale))} L${x(horizon).toFixed(1)},${H - B} L${L},${H - B} Z`}
            fill="url(#degradeCapital)"
          />
        )}

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

        {/* The year the capital is asked to reach. */}
        {dureeExigee > 0 && dureeExigee < horizon && (
          <g>
            <line
              x1={x(dureeExigee)}
              x2={x(dureeExigee)}
              y1={T}
              y2={H - B}
              stroke="var(--color-ink-300)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <text
              x={x(dureeExigee) + 5}
              y={T + 11}
              fontSize="10"
              fill="var(--color-ink-400)"
            >
              {t.projection.repereDuree(dureeExigee)}
            </text>
          </g>
        )}

        {/* The year a future pension starts and begins sparing the capital. */}
        {anneeRente > 0 && anneeRente < horizon && (
          <g>
            <line
              x1={x(anneeRente)}
              x2={x(anneeRente)}
              y1={T}
              y2={H - B}
              stroke="var(--color-brand-400)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <text
              x={x(anneeRente) + 5}
              y={T + 24}
              fontSize="10"
              fill="var(--color-brand-600)"
            >
              {t.projection.repereRente(anneeRente)}
            </text>
          </g>
        )}

        {series.map((s) => (
          <path
            key={s.cle}
            d={cheminDe(valeurs(s))}
            fill="none"
            stroke={s.couleur}
            strokeWidth={s.secondaire ? 1.5 : 2.5}
            strokeDasharray={s.secondaire ? '4 3' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={s.secondaire ? 0.8 : 1}
          />
        ))}

        {/* Depletion, in the colour of the curve it belongs to. */}
        {series.map((s) => {
          const epuisement = s.trajectoire.anneeEpuisement;
          if (epuisement === null) return null;
          return (
            <g key={`fin-${s.cle}`}>
              {!s.secondaire && (
                <line
                  x1={x(epuisement)}
                  x2={x(epuisement)}
                  y1={T}
                  y2={H - B}
                  stroke={s.couleur}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}
              <circle
                cx={x(epuisement)}
                cy={y(0)}
                r={s.secondaire ? 4 : 5.5}
                fill={s.couleur}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Hovered year */}
        <line
          x1={x(anneeSurvolee)}
          x2={x(anneeSurvolee)}
          y1={T}
          y2={H - B}
          stroke="var(--color-ink-300)"
          strokeWidth="1"
        />
        {principales.map((s) => (
          <circle
            key={`point-${s.cle}`}
            cx={x(anneeSurvolee)}
            cy={y(valeurA(s, anneeSurvolee))}
            r="6"
            fill={s.couleur}
            stroke="#fff"
            strokeWidth="2.5"
          />
        ))}
      </svg>

      <figcaption className="mt-3 space-y-2 text-xs text-ink-500">
        <p className="font-medium text-ink-700">
          {anneeSurvolee === 0
            ? t.projection.survolAujourdhui
            : t.projection.survolAnnee(anneeSurvolee)}{' '}
          — {series.map((s) => `${s.libelle} ${eur(valeurA(s, anneeSurvolee))}`).join(' · ')}
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {series.map((s) => (
            <span key={`legende-${s.cle}`} className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: s.couleur }}
              />
              {s.legende ?? s.libelle}
              {s.trajectoire.anneeEpuisement !== null && (
                <span className="text-brique-600">
                  {t.projection.legendeEpuisement(s.trajectoire.anneeEpuisement)}
                </span>
              )}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 shrink-0 rounded-full bg-ink-400" />
            {t.projection.legendeDepart(eur(patrimoineInitial))}
          </span>
        </p>
      </figcaption>
    </figure>
  );
}
