// Pure SVG bar chart (server-renderable, no client JS). Responsive via viewBox.
export default function BarChart({
  points,
  prefix = "",
}: {
  points: { label: string; value: number }[];
  prefix?: string;
}) {
  const W = 700;
  const H = 240;
  const padX = 16;
  const padTop = 28;
  const padBottom = 28;
  const max = Math.max(1, ...points.map((p) => p.value));
  const n = points.length;
  const slot = (W - padX * 2) / n;
  const barW = Math.min(48, slot * 0.55);
  const chartH = H - padTop - padBottom;

  const fmt = (v: number) =>
    v >= 1000 ? `${prefix}${(v / 1000).toFixed(1)}k` : `${prefix}${v}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {/* gridlines */}
      {[0, 0.5, 1].map((f) => {
        const y = padTop + chartH * (1 - f);
        return (
          <line
            key={f}
            x1={padX}
            x2={W - padX}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        );
      })}

      {points.map((p, i) => {
        const h = max > 0 ? (p.value / max) * chartH : 0;
        const x = padX + slot * i + (slot - barW) / 2;
        const y = padTop + (chartH - h);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx="6" fill="#c23c7d" />
            <text
              x={x + barW / 2}
              y={y - 8}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
              fontWeight="600"
            >
              {p.value > 0 ? fmt(p.value) : ""}
            </text>
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="12"
              fill="#9ca3af"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
