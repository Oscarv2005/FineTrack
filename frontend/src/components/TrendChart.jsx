import React, { useMemo, useState } from "react";

const WIDTH = 500;
const HEIGHT = 100;
const PADDING = 10;

/**
 * data: array of numbers, oldest first. Shows an empty state
 * when there's nothing to plot yet - no fake data ever shown.
 */
export default function TrendChart({ title = "Savings trend", data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const { linePath, areaPath, points, stepX } = useMemo(() => {
    if (!data || data.length < 2) {
      return { linePath: "", areaPath: "", points: [], stepX: 0 };
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = (WIDTH - PADDING * 2) / (data.length - 1);

    const pts = data.map((val, i) => ({
      x: PADDING + i * step,
      y: HEIGHT - PADDING - ((val - min) / range) * (HEIGHT - PADDING * 2),
      value: val,
    }));

    const line = pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
      )
      .join(" ");
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${HEIGHT - PADDING} L ${pts[0].x.toFixed(1)} ${HEIGHT - PADDING} Z`;

    return { linePath: line, areaPath: area, points: pts, stepX: step };
  }, [data]);

  const formatValue = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="section-card">
      <div className="section-header">{title}</div>
      <div className="chart-container">
        {!linePath ? (
          <p className="empty-state">Not enough data yet.</p>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="trend-line"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#E8A33D" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={areaPath} fill="url(#trendFill)" stroke="none" />
            <path
              d={linePath}
              fill="none"
              stroke="#E8A33D"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {hovered && (
              <line
                x1={hovered.x}
                y1={0}
                x2={hovered.x}
                y2={HEIGHT}
                stroke="#E8A33D"
                strokeWidth="1"
                strokeOpacity="0.35"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Invisible hit-zones, one per point, wider than the visible dot for easy hover */}
            {points.map((p, i) => (
              <rect
                key={i}
                x={p.x - stepX / 2}
                y={0}
                width={stepX}
                height={HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
              />
            ))}

            {hovered && (
              <circle
                cx={hovered.x}
                cy={hovered.y}
                r="3.5"
                fill="#0F1418"
                stroke="#E8A33D"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        )}

        {hovered && (
          <div
            className="trend-tooltip"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              top: `${(hovered.y / HEIGHT) * 100}%`,
            }}
          >
            {formatValue(hovered.value)}
          </div>
        )}
      </div>
    </div>
  );
}
