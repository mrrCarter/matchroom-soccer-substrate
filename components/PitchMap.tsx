"use client";

import type { EvidenceSummary, HeroReplay } from "@/lib/types";

type PitchMapProps = {
  replay: HeroReplay;
  summary: EvidenceSummary;
};

function sx(x: number) {
  return Math.max(0, Math.min(120, x)) * 10;
}

function sy(y: number) {
  return Math.max(0, Math.min(80, y)) * 10;
}

export default function PitchMap({ replay, summary }: PitchMapProps) {
  const points = replay.points;
  const path = points.map((point) => `${sx(point.x)},${sy(point.y)}`).join(" ");
  const firstTeam = summary.teams[0];
  const secondTeam = summary.teams[1];

  return (
    <div className="panel pitch-panel">
      <div className="pitch">
        <svg viewBox="0 0 1200 800" role="img" aria-label={replay.label}>
          <rect x="24" y="24" width="1152" height="752" fill="none" stroke="rgba(255,255,255,0.64)" strokeWidth="4" />
          <line x1="600" y1="24" x2="600" y2="776" stroke="rgba(255,255,255,0.42)" strokeWidth="3" />
          <circle cx="600" cy="400" r="82" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
          <rect x="24" y="220" width="170" height="360" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="3" />
          <rect x="1006" y="220" width="170" height="360" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="3" />
          <rect x="24" y="320" width="62" height="160" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="3" />
          <rect x="1114" y="320" width="62" height="160" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="3" />
          <line x1="0" y1="267" x2="1200" y2="267" stroke="rgba(98,181,255,0.22)" strokeWidth="2" strokeDasharray="10 12" />
          <line x1="0" y1="533" x2="1200" y2="533" stroke="rgba(98,181,255,0.22)" strokeWidth="2" strokeDasharray="10 12" />

          {points.length > 1 ? (
            <polyline
              points={path}
              fill="none"
              stroke="#3ce28f"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.88"
            />
          ) : null}

          {points.map((point, index) => (
            <g key={point.id}>
              <circle
                cx={sx(point.x)}
                cy={sy(point.y)}
                r={index === points.length - 1 ? 16 : 11}
                fill={point.type === "shot" ? "#f0c04e" : "#f7fbff"}
                stroke={point.team === secondTeam.team ? "#62b5ff" : "#3ce28f"}
                strokeWidth="5"
              />
              <text
                x={sx(point.x) + 18}
                y={sy(point.y) - 12}
                fill="#f7fbff"
                fontSize="28"
                fontWeight="800"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="pitch-caption">
        <span>{replay.label}</span>
        <span>
          {firstTeam.team}: {firstTeam.finalThirdEntries} final-third entries |{" "}
          {secondTeam.team}: {secondTeam.finalThirdEntries}
        </span>
      </div>
    </div>
  );
}
