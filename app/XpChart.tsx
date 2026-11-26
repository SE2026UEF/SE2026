export type XpPoint = { expLevel: number; recordedAt: string };

const W = 600;
const H = 220;
const M = { top: 18, right: 44, bottom: 28, left: 42 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const SERIES = "#38bdf8";
const GRID = "#1e293b";
const MUTED = "#94a3b8";
const SURFACE = "#090d16";
const POINT_STROKE = "#0f172a";

const formatDate = (d: Date) =>
  d.toLocaleDateString("fi-FI", { day: "numeric", month: "numeric", year: "numeric" });

/** Tasaväliset kokonaislukutikit, jotka kattavat välin [min, max]. */
function niceTicks(min: number, max: number, count: number): number[] {
  const raw = Math.max(1, (max - min) / count);
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
    return <p className="muted-empty">Ei vielä tallennettua XP-historiaa.</p>;
  }

  const points = history.map((p) => {
    const date = new Date(p.recordedAt);
    return {
      date,
      t: date.getTime(),
      xp: p.expLevel,
    };
  });

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

  const xTicks =
    tMax === tMin ? [tMin] : [0, 1, 2, 3].map((i) => tMin + ((tMax - tMin) * i) / 3);

  const linePath = points.map((p, i) => `${i ? "L" : "M"}${x(p.t)},${y(p.xp)}`).join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L${x(points[points.length - 1].t)},${M.top + PLOT_H} L${x(points[0].t)},${M.top + PLOT_H} Z`
      : "";

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`XP-taso ${formatDate(points[0].date)}–${formatDate(last.date)}: ${points[0].xp} → ${last.xp}`}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize={12}
      style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px" }}
    >
      <defs>
        <linearGradient id="xpAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SERIES} stopOpacity="0.28" />
          <stop offset="100%" stopColor={SERIES} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={SURFACE} rx={8} />

      {/* Vaakaruudukko ja Y-akselin arvot */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={M.left}
            x2={W - M.right}
            y1={y(v)}
            y2={y(v)}
            stroke={GRID}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text x={M.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fill={MUTED}>
            {v}
          </text>
        </g>
      ))}

      {/* X-akselin päivämäärät */}
      {xTicks.map((t, i) => (
        <text
          key={`${t}-${i}`}
          x={x(t)}
          y={H - 8}
          fill={MUTED}
          textAnchor={
            xTicks.length === 1
              ? "middle"
              : i === 0
              ? "start"
              : i === xTicks.length - 1
              ? "end"
              : "middle"
          }
        >
          {formatDate(new Date(t))}
        </text>
      ))}

      {/* Liukuvärialue ja pääviiva */}
      {areaPath && <path d={areaPath} fill="url(#xpAreaFill)" />}
      <path
        d={linePath}
        fill="none"
        stroke={SERIES}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Pisteet ja hover-alueet */}
      {points.map((p, i) => (
        <g key={`${p.t}-${i}`}>
          <circle cx={x(p.t)} cy={y(p.xp)} r={3.5} fill={SERIES} stroke={POINT_STROKE} strokeWidth={1.5} />
          <circle cx={x(p.t)} cy={y(p.xp)} r={10} fill="transparent">
            <title>{`${formatDate(p.date)}: XP-taso ${p.xp}`}</title>
          </circle>
        </g>
      ))}

      {/* Nykyinen arvo viivan päässä */}
      <text
        x={Math.min(W - 6, x(last.t) + 8)}
        y={y(last.xp)}
        dominantBaseline="middle"
        fill="#f8fafc"
        fontWeight="700"
      >
        {last.xp}
      </text>
    </svg>
  );
}