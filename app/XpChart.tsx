export type XpPoint = { expLevel: number; recordedAt: string };

// Pelkkä SVG, ei kaaviokirjastoa. Arvot ovat viewBox-yksiköitä.
const W = 600;
const H = 240;
const M = { top: 16, right: 44, bottom: 28, left: 40 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const SERIES = "#2a78d6";
const GRID = "#e4e3df";
const MUTED = "#52514e";
const SURFACE = "#ffffff";

const formatDate = (d: Date) =>
  d.toLocaleDateString("fi-FI", { day: "numeric", month: "numeric", year: "numeric" });

/** Tasaväliset kokonaislukutikit, jotka kattavat välin [min, max]. */
function niceTicks(min: number, max: number, count: number): number[] {
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!);
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step; v += step) {
    ticks.push(v);
  }
  return ticks;
}

export default function XpChart({ history }: { history: XpPoint[] }) {
  if (history.length === 0) {
    return <p>Ei vielä tallennettua XP-historiaa.</p>;
  }

  const points = history.map((p) => ({
    date: new Date(p.recordedAt),
    t: new Date(p.recordedAt).getTime(),
    xp: p.expLevel,
  }));

  const tMin = points[0].t;
  const tMax = points[points.length - 1].t;
  const xpValues = points.map((p) => p.xp);
  let lo = Math.min(...xpValues);
  let hi = Math.max(...xpValues);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const yTicks = niceTicks(lo, hi, 4);
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];

  const x = (t: number) =>
    tMax === tMin ? M.left + PLOT_W / 2 : M.left + ((t - tMin) / (tMax - tMin)) * PLOT_W;
  const y = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * PLOT_H;

  // X-akselille 4 tasavälistä päivämäärää (tai yksi, jos pisteitä on vain yksi).
  const xTicks =
    tMax === tMin ? [tMin] : [0, 1, 2, 3].map((i) => tMin + ((tMax - tMin) * i) / 3);

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.t)},${y(p.xp)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={`XP-taso ${formatDate(points[0].date)}–${formatDate(last.date)}: ${points[0].xp} → ${last.xp}`}
      fontFamily="sans-serif"
      fontSize={12}
    >
      <rect width={W} height={H} fill={SURFACE} />

      {/* Vaakaruudukko ja Y-akselin arvot */}
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
          <text x={M.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fill={MUTED}>
            {v}
          </text>
        </g>
      ))}

      {/* X-akselin päivämäärät; reunimmaiset ankkuroidaan sisäänpäin */}
      {xTicks.map((t, i) => (
        <text
          key={t}
          x={x(t)}
          y={H - 8}
          fill={MUTED}
          textAnchor={
            xTicks.length === 1 ? "middle" : i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"
          }
        >
          {formatDate(new Date(t))}
        </text>
      ))}

      <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p) => (
        <g key={p.t}>
          <circle cx={x(p.t)} cy={y(p.xp)} r={4} fill={SERIES} stroke={SURFACE} strokeWidth={2} />
          {/* Pistettä suurempi, näkymätön alue hover-vihjettä varten */}
          <circle cx={x(p.t)} cy={y(p.xp)} r={10} fill="transparent">
            <title>{`${formatDate(p.date)}: XP-taso ${p.xp}`}</title>
          </circle>
        </g>
      ))}

      {/* Nykyinen arvo viivan päässä */}
      <text x={x(last.t) + 8} y={y(last.xp)} dominantBaseline="middle" fill="#0b0b0b" fontWeight="bold">
        {last.xp}
      </text>
    </svg>
  );
}
