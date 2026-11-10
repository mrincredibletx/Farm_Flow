'use client';

import React, { useState } from 'react';
import { ElevationProfilePoint } from '@/lib/types';
import { X, TrendingDown, Layers, Scissors, Shovel } from 'lucide-react';

interface ElevationProfileDrawerProps {
  points: ElevationProfilePoint[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const ElevationProfileDrawer: React.FC<ElevationProfileDrawerProps> = ({
  points,
  isOpen,
  onClose,
  onClear,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!isOpen || points.length === 0) return null;

  const totalDist = points[points.length - 1]?.distance_m || 100;
  const elevations = points.map((p) => p.elevation_m);
  const designElevations = points.map((p) => p.design_elevation_m);
  const allElevs = [...elevations, ...designElevations];

  const minElev = Math.min(...allElevs);
  const maxElev = Math.max(...allElevs);
  const elevRange = Math.max(maxElev - minElev, 0.5);

  const padBottom = 35;
  const padTop = 20;
  const padLeft = 55;
  const padRight = 25;
  const chartWidth = 720;
  const chartHeight = 200;

  const getX = (dist: number) => {
    return padLeft + (dist / (totalDist || 1)) * (chartWidth - padLeft - padRight);
  };

  const getY = (elev: number) => {
    return (
      chartHeight -
      padBottom -
      ((elev - minElev) / elevRange) * (chartHeight - padTop - padBottom)
    );
  };

  // Generate SVG path for existing ground
  const groundPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.distance_m).toFixed(1)} ${getY(p.elevation_m).toFixed(1)}`)
    .join(' ');

  // Generate SVG path for design grade
  const designPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.distance_m).toFixed(1)} ${getY(p.design_elevation_m).toFixed(1)}`)
    .join(' ');

  // Ground area closed path for fill
  const groundAreaPath = `${groundPath} L ${getX(totalDist)} ${chartHeight - padBottom} L ${padLeft} ${chartHeight - padBottom} Z`;

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-6 duration-300">
      <div className="glass-panel-elevated p-4 rounded-3xl border border-cyan-500/30 shadow-2xl backdrop-blur-xl bg-slate-950/95 space-y-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              Elevation Profile Cross-Section (Transect)
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
              {totalDist} m Span
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              <span className="text-slate-300">Existing Ground</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block border-b border-dashed border-cyan-400"></span>
              <span className="text-slate-300">Design Grade (Planar)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/60 inline-block"></span>
              <span className="text-slate-300">Cut Excess</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500/60 inline-block"></span>
              <span className="text-slate-300">Fill Low Spot</span>
            </div>

            <button
              onClick={onClear}
              className="px-2 py-0.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="relative w-full h-[200px] overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Grid Lines */}
            <line
              x1={padLeft}
              y1={chartHeight - padBottom}
              x2={chartWidth - padRight}
              y2={chartHeight - padBottom}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={chartHeight - padBottom}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* Y Axis Labels (Elevation in meters) */}
            <text
              x={padLeft - 8}
              y={getY(maxElev) + 4}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="end"
            >
              {maxElev.toFixed(1)}m
            </text>
            <text
              x={padLeft - 8}
              y={getY((maxElev + minElev) / 2) + 4}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="end"
            >
              {((maxElev + minElev) / 2).toFixed(1)}m
            </text>
            <text
              x={padLeft - 8}
              y={getY(minElev) + 4}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="end"
            >
              {minElev.toFixed(1)}m
            </text>

            {/* X Axis Labels (Distance in meters) */}
            <text
              x={padLeft}
              y={chartHeight - padBottom + 16}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              0m
            </text>
            <text
              x={padLeft + (chartWidth - padLeft - padRight) / 2}
              y={chartHeight - padBottom + 16}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {(totalDist / 2).toFixed(0)}m
            </text>
            <text
              x={chartWidth - padRight}
              y={chartHeight - padBottom + 16}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {totalDist.toFixed(0)}m
            </text>

            {/* Ground Area Fill */}
            <path d={groundAreaPath} fill="rgba(16, 185, 129, 0.12)" />

            {/* Design Leveled Grade Line (Cyan dashed) */}
            <path
              d={designPath}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2"
              strokeDasharray="5,4"
            />

            {/* Natural Ground Line (Emerald Solid) */}
            <path
              d={groundPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
            />

            {/* Interactive Hover Point Cursor */}
            {hoverIndex !== null && hoveredPoint && (
              <>
                <line
                  x1={getX(hoveredPoint.distance_m)}
                  y1={padTop}
                  x2={getX(hoveredPoint.distance_m)}
                  y2={chartHeight - padBottom}
                  stroke="#00F0FF"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={getX(hoveredPoint.distance_m)}
                  cy={getY(hoveredPoint.elevation_m)}
                  r="5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle
                  cx={getX(hoveredPoint.distance_m)}
                  cy={getY(hoveredPoint.design_elevation_m)}
                  r="4"
                  fill="#00F0FF"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </>
            )}

            {/* Transparent click/hover detection bars */}
            {points.map((p, i) => {
              const xPos = getX(p.distance_m);
              const barWidth = (chartWidth - padLeft - padRight) / points.length;
              return (
                <rect
                  key={i}
                  x={xPos - barWidth / 2}
                  y={padTop}
                  width={barWidth}
                  height={chartHeight - padTop - padBottom}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                  className="cursor-crosshair"
                />
              );
            })}
          </svg>

          {/* Hover Telemetry Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none p-2 rounded-xl glass-panel-elevated border border-cyan-400/50 shadow-2xl text-[10px] space-y-1 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(getX(hoveredPoint.distance_m) / chartWidth) * 100}%`,
                top: `${(getY(hoveredPoint.elevation_m) / chartHeight) * 100 - 10}%`,
              }}
            >
              <div className="font-bold text-white flex items-center justify-between gap-3">
                <span>Dist: {hoveredPoint.distance_m}m</span>
                <span className="text-cyan-300 font-mono">
                  {hoveredPoint.lat.toFixed(5)}, {hoveredPoint.lng.toFixed(5)}
                </span>
              </div>
              <div className="flex gap-3 text-slate-300">
                <span>
                  Ground: <strong className="text-emerald-400">{hoveredPoint.elevation_m}m</strong>
                </span>
                <span>
                  Design: <strong className="text-cyan-400">{hoveredPoint.design_elevation_m}m</strong>
                </span>
              </div>
              {hoveredPoint.cut_m > 0 && (
                <div className="text-rose-400 font-semibold flex items-center gap-1">
                  <Scissors className="w-3 h-3" /> Cut Depth: +{hoveredPoint.cut_m}m
                </div>
              )}
              {hoveredPoint.fill_m > 0 && (
                <div className="text-blue-400 font-semibold flex items-center gap-1">
                  <Shovel className="w-3 h-3" /> Fill Depth: -{hoveredPoint.fill_m}m
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
