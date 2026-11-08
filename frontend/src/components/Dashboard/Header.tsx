'use client';

import React, { useEffect, useState } from 'react';
import { Droplets, Cpu, Sparkles, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';

export const Header: React.FC = () => {
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
    <header className="w-full glass-panel border-b border-white/10 px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 z-30 select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-neon-cyan p-0.5">
          <div className="w-full h-full bg-slate-950/70 rounded-[10px] flex items-center justify-center">
            <Droplets className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>Smart Agricultural Drainage System</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
                Phase I MVP
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Terrain Intelligence &amp; Inundation Analysis</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">7th Semester Capstone Project</span>
          </p>
        </div>
      </div>

      {/* Academic Credential & Backend Status */}
      <div className="flex items-center gap-3 self-end md:self-auto">
        {/* Project Owner Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
          <div className="text-left">
            <div className="text-[10px] text-slate-400 leading-none">Developer &amp; Researcher</div>
            <div className="text-slate-200 font-semibold text-[11px]">Rakesh Bangra (UEM Jaipur)</div>
          </div>
        </div>

        {/* Backend API Health Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-white/10 text-xs">
          {backendHealthy === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-[11px] font-mono font-medium">FastAPI Online</span>
            </>
          ) : backendHealthy === false ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300 text-[11px] font-mono font-medium">Local Simulator Mode</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
              <span className="text-slate-400 text-[11px] font-mono">Connecting...</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

