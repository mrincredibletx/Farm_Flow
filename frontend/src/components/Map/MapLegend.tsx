'use client';

import React from 'react';
import { Layers, Droplets, Info } from 'lucide-react';

interface MapLegendProps {
  opacity: number;
  onOpacityChange: (val: number) => void;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  minElevation?: number;
  maxElevation?: number;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  opacity,
  onOpacityChange,
  showMarkers,
  onToggleMarkers,
  minElevation,
  maxElevation,
}) => {
  return (
    <div className="glass-panel p-3.5 rounded-xl text-xs space-y-3 w-64 shadow-2xl border border-white/10 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          <span>Waterlogging Risk Index</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-mono">Phase I</span>
      </div>

      {/* Risk Color Gradient */}
      <div className="space-y-1.5">
        <div className="h-2.5 rounded-full w-full bg-gradient-to-r from-emerald-400 via-cyan-400 via-amber-400 to-rose-600 shadow-inner" />
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Low Risk (&lt;40%)</span>
          <span>Moderate</span>
          <span className="text-rose-400 font-semibold">Severe (&gt;70%)</span>
        </div>
      </div>

      {/* Elevation Relief Range if available */}
      {minElevation !== undefined && maxElevation !== undefined && (
        <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5 flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Elevation Relief:</span>
          <span className="font-mono text-cyan-300 font-semibold">
            {minElevation.toFixed(1)}m – {maxElevation.toFixed(1)}m
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="pt-2 border-t border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>Overlay Intensity:</span>
          <span className="font-mono text-cyan-400">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={onToggleMarkers}
              className="accent-cyan-400 rounded cursor-pointer"
            />
            <span>Critical Sinks Radar Pins</span>
          </label>
        </div>
      </div>
    </div>
  );
};

