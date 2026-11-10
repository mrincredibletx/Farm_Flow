'use client';

import React from 'react';
import { TerrainMetrics } from '@/lib/types';
import {
  Mountain,
  Compass,
  AlertTriangle,
  Maximize2,
  TrendingDown,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface TerrainMetricsCardProps {
  metrics: TerrainMetrics;
}

export const TerrainMetricsCard: React.FC<TerrainMetricsCardProps> = ({ metrics }) => {
  return (
    <div className="space-y-3.5">
      {/* Relief & Elevation Section */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Mountain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Elevation Profile</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">DEM Grid Analysis</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5">
            <div className="text-[10px] text-slate-400">Min Ground Elevation</div>
            <div className="font-mono text-emerald-400 font-bold text-sm">
              {metrics.min_elevation.toFixed(2)} m
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5">
            <div className="text-[10px] text-slate-400">Max Ground Elevation</div>
            <div className="font-mono text-cyan-400 font-bold text-sm">
              {metrics.max_elevation.toFixed(2)} m
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs">
          <span className="text-slate-300">Total Topographic Relief (ΔZ):</span>
          <span className="font-mono font-bold text-cyan-300">
            {metrics.elevation_range.toFixed(2)} m
          </span>
        </div>
      </div>

      {/* Surface Area & Slope Grade */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Field Area */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Maximize2 className="w-3 h-3 text-cyan-400" />
            <span>Field Area</span>
          </div>
          <div className="font-mono font-bold text-slate-100 text-sm">
            {metrics.total_area_acres.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">acres</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {metrics.total_area_hectares.toFixed(2)} ha / {Math.round(metrics.total_area_sqm).toLocaleString()} m²
          </div>
        </div>

        {/* Dominant Drainage Aspect */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Runoff Flow</span>
          </div>
          {metrics.is_watershed_divide && metrics.major_flow_directions && metrics.major_flow_directions.length >= 2 ? (
            <div className="space-y-0.5">
              <div className="font-mono font-bold text-cyan-300 text-xs truncate" title={metrics.major_flow_directions[0]}>
                🏔️ {metrics.major_flow_directions[0]}
              </div>
              <div className="font-mono font-bold text-amber-300 text-xs truncate" title={metrics.major_flow_directions[1]}>
                🏔️ {metrics.major_flow_directions[1]}
              </div>
            </div>
          ) : (
            <div className="font-mono font-bold text-cyan-300 text-sm truncate" title={metrics.dominant_slope_direction}>
              {metrics.dominant_slope_direction}
            </div>
          )}
          <div className="text-[10px] text-slate-400 font-mono">
            Avg Grade: {metrics.average_slope_percent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Waterlogging Risk Sinks Breakdown */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Waterlogging Vulnerability</span>
          </span>
          <span className="text-[10px] text-slate-400">NumPy Sinks</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
          {/* Severe */}
          <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30">
            <div className="text-[10px] text-rose-300 font-medium">Critical Sinks</div>
            <div className="font-mono font-bold text-rose-400 text-base">
              {metrics.high_risk_points_count}
            </div>
            <div className="text-[9px] text-rose-400/80">Severe Ponding</div>
          </div>

          {/* Moderate */}
          <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30">
            <div className="text-[10px] text-amber-300 font-medium">Moderate</div>
            <div className="font-mono font-bold text-amber-400 text-base">
              {metrics.moderate_risk_points_count}
            </div>
            <div className="text-[9px] text-amber-400/80">Sluggish Grade</div>
          </div>

          {/* Low */}
          <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-300 font-medium">Low Risk</div>
            <div className="font-mono font-bold text-emerald-400 text-base">
              {metrics.low_risk_points_count}
            </div>
            <div className="text-[9px] text-emerald-400/80">Good Runoff</div>
          </div>
        </div>

        {/* Topographic Risk Distribution Bar */}
        {(() => {
          const totalPts = metrics.high_risk_points_count + metrics.moderate_risk_points_count + metrics.low_risk_points_count;
          if (totalPts === 0) return null;
          const highPct = (metrics.high_risk_points_count / totalPts) * 100;
          const modPct = (metrics.moderate_risk_points_count / totalPts) * 100;
          const lowPct = (metrics.low_risk_points_count / totalPts) * 100;

          return (
            <div className="pt-2 space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Field Vulnerability Breakdown:</span>
                <span className="text-rose-300 font-mono font-medium">{Math.round(highPct)}% Severe Ponding</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex bg-slate-800">
                <div style={{ width: `${highPct}%` }} className="bg-rose-500 transition-all duration-500" title={`Critical: ${Math.round(highPct)}%`} />
                <div style={{ width: `${modPct}%` }} className="bg-amber-500 transition-all duration-500" title={`Moderate: ${Math.round(modPct)}%`} />
                <div style={{ width: `${lowPct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Normal: ${Math.round(lowPct)}%`} />
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

