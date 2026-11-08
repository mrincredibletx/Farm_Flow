'use client';

import React, { useState } from 'react';
import { Table, X, Download, Code, Check } from 'lucide-react';

interface ElevationGridInspectorProps {
  grid: number[][];
  isOpen: boolean;
  onClose: () => void;
  minElevation: number;
  maxElevation: number;
}

export const ElevationGridInspector: React.FC<ElevationGridInspectorProps> = ({
  grid,
  isOpen,
  onClose,
  minElevation,
  maxElevation,
}) => {
  const [copied, setCopied] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number; val: number } | null>(null);

  if (!isOpen || !grid || grid.length === 0) return null;

  const rows = grid.length;
  const cols = grid[0].length;
  const range = Math.max(maxElevation - minElevation, 0.01);

  const getCellColor = (val: number) => {
    const norm = (val - minElevation) / range; // 0 to 1
    // Lower elevation -> Deep blue / Rose (Sink), Higher elevation -> Emerald / Cyan (Ridge)
    if (norm < 0.25) return 'bg-rose-900/60 text-rose-200 border-rose-500/30';
    if (norm < 0.5) return 'bg-amber-900/40 text-amber-200 border-amber-500/20';
    if (norm < 0.75) return 'bg-cyan-950/40 text-cyan-200 border-cyan-500/20';
    return 'bg-emerald-950/40 text-emerald-200 border-emerald-500/20';
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(grid, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-cyan-500/30">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Elevation Grid Matrix Inspector</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-white/10">
                  {rows} × {cols} Grid ({rows * cols} DEM Nodes)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct 2D array representation extracted via NumPy for terrain pooling calculations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyJson}
              className="px-3 py-1.5 rounded-lg text-xs font-medium glass-panel hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 flex items-center gap-1.5 transition-colors border border-white/10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON!' : 'Copy Matrix'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Matrix Container */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/70">
          <div className="inline-block min-w-full">
            <div
              className="grid gap-1.5 select-none"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(46px, 1fr))`,
              }}
            >
              {grid.map((row, rIdx) =>
                row.map((val, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx, val })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-9 flex items-center justify-center rounded border font-mono text-[10px] transition-all hover:scale-110 hover:z-10 cursor-pointer ${getCellColor(
                      val
                    )}`}
                  >
                    {val.toFixed(1)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer with Inspector Telemetry & Legend */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-4 text-slate-300">
            {hoveredCell ? (
              <span className="font-mono text-cyan-300">
                Cell [{hoveredCell.r}, {hoveredCell.c}] Elevation:{' '}
                <strong className="text-white font-bold">{hoveredCell.val.toFixed(2)} m</strong>
              </span>
            ) : (
              <span className="text-slate-400 text-xs">Hover over any matrix cell to inspect elevation</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-900/80 border border-rose-500/50" />
              <span>Depression / Sink</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-900/80 border border-amber-500/50" />
              <span>Mid-slope</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-950/80 border border-emerald-500/50" />
              <span>High Ground</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

