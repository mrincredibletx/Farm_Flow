'use client';

import React, { useEffect, useState } from 'react';
import {
  Droplets,
  GraduationCap,
  Map as MapIcon,
  Box,
  FileDown,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  viewMode?: '2D' | '3D';
  onToggleViewMode?: (mode: '2D' | '3D') => void;
  onDownloadPDF?: () => void;
  hasAnalysisData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode = '2D',
  onToggleViewMode,
  onDownloadPDF,
  hasAnalysisData = false,
}) => {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/health')
      .then((res) => {
        if (res.ok) setBackendHealthy(true);
        else setBackendHealthy(false);
      })
      .catch(() => setBackendHealthy(false));
  }, []);

  return (
    <header className="w-full glass-panel border-b border-white/10 px-5 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 z-30 select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-neon-cyan p-0.5">
          <div className="w-full h-full bg-slate-950/70 rounded-[10px] flex items-center justify-center">
            <Droplets className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Smart Agricultural Drainage System</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 font-semibold">
                Phase II Full System
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Terrain Intelligence • 3D Mesh • A* Ditching • Gemini AI</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">UEM Jaipur Capstone</span>
          </p>
        </div>
      </div>

      {/* Center 2D / 3D View Switcher */}
      {onToggleViewMode && (
        <div className="flex items-center p-1 rounded-xl glass-panel-elevated border border-white/10 shadow-xl self-center">
          <button
            onClick={() => onToggleViewMode('2D')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === '2D'
                ? 'bg-cyan-500 text-slate-950 shadow-neon-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>2D GIS Map</span>
          </button>

          <button
            onClick={() => onToggleViewMode('3D')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === '3D'
                ? 'bg-cyan-500 text-slate-950 shadow-neon-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Terrain Mesh</span>
          </button>
        </div>
      )}

      {/* Right Controls & Badges */}
      <div className="flex items-center gap-2.5 self-end md:self-auto">
        {/* PDF Export Button */}
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            disabled={!hasAnalysisData}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            title="Download Official Agronomic Report (PDF)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        )}

        {/* Project Owner Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
          <div className="text-left">
            <div className="text-[9px] text-slate-400 leading-none">Researcher</div>
            <div className="text-slate-200 font-semibold text-[11px]">Rakesh Bangra (UEM)</div>
          </div>
        </div>

        {/* Backend API Health Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/70 border border-white/10 text-xs">
          {backendHealthy === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-[10px] font-mono font-medium">FastAPI v2 Online</span>
            </>
          ) : backendHealthy === false ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300 text-[10px] font-mono font-medium">Local Simulator</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
              <span className="text-slate-400 text-[10px] font-mono">Connecting...</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
