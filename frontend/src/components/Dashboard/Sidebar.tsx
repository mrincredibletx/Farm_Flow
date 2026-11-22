'use client';

import React, { useState } from 'react';
import { TerrainAnalysisResponse } from '@/lib/types';
import { TerrainMetricsCard } from './TerrainMetricsCard';
import { generateAgronomicPDFReport } from '@/lib/pdfExport';
import {
  PenTool,
  RotateCcw,
  Trash2,
  Play,
  Loader2,
  Table,
  CheckCircle,
  FileDown,
  Navigation,
  CloudRain,
  Bot,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Coins,
  ShieldAlert,
  Compass,
  Pipette,
  Check,
} from 'lucide-react';

interface SidebarProps {
  coordinates: [number, number][];
  isDrawing: boolean;
  onToggleDrawing: () => void;
  onUndoPoint: () => void;
  onClear: () => void;
  onAnalyze: (soil?: string, crop?: string, rain?: number) => void;
  isAnalyzing: boolean;
  analysisData: TerrainAnalysisResponse | null;
  userLocation?: { lat: number; lng: number } | null;
  onLocateDevice?: () => void;
  onCenterUEM?: () => void;
  onOpenGridInspector: () => void;
  onOpenElevationProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  coordinates,
  isDrawing,
  onToggleDrawing,
  onUndoPoint,
  onClear,
  onAnalyze,
  isAnalyzing,
  analysisData,
  userLocation,
  onLocateDevice,
  onCenterUEM,
  onOpenGridInspector,
  onOpenElevationProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dem' | 'advisory'>('pipeline');
  const [soilType, setSoilType] = useState<string>('clay');
  const [cropType, setCropType] = useState<string>('Wheat');
  const [rainfallMm, setRainfallMm] = useState<number>(65);

  const handleTriggerAnalysis = () => {
    onAnalyze(soilType, cropType, rainfallMm);
  };

  const handleDownloadPDF = () => {
    if (!analysisData) return;
    generateAgronomicPDFReport(analysisData);
  };

  const pipe = analysisData?.pipeline_drainage;
  const metrics = analysisData?.metrics;

  return (
    <aside className="w-full lg:w-96 glass-panel border-r border-white/10 flex flex-col h-full overflow-hidden z-20 select-none">
      {/* Streamlined Clean Tab Bar */}
      <div className="flex border-b border-white/10 bg-slate-950/60 text-xs p-1.5 gap-1.5 shrink-0">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex-1 py-2 px-2 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'pipeline'
              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Pipeline Drainage</span>
        </button>

        <button
          onClick={() => setActiveTab('dem')}
          className={`flex-1 py-2 px-2 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'dem'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-400/40 shadow-neon-green'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Elevation DEM</span>
        </button>

        <button
          onClick={() => setActiveTab('advisory')}
          className={`flex-1 py-2 px-2 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'advisory'
              ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Agri Advisory</span>
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 lg:pb-4">
        {/* Map Focus / Center Controls */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Map Focus</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
              Active Focus
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950/60 border border-white/5">
            <span className="text-slate-400">Target Coordinates:</span>
            <span className="font-mono text-cyan-300 font-bold">
              27.21400° N, 75.70110° E
            </span>
          </div>

          {onCenterUEM && (
            <button
              onClick={onCenterUEM}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold glass-panel hover:bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Center to Field</span>
            </button>
          )}

          {userLocation && onLocateDevice && (
            <button
              onClick={onLocateDevice}
              className="w-full py-1 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Re-Center to Device GPS ({userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)})</span>
            </button>
          )}
        </div>

        {/* Boundary Mapping Controls */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Field Boundary Mapping</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {coordinates.length} {coordinates.length === 1 ? 'vertex' : 'vertices'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleDrawing}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isDrawing
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-neon-cyan'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isDrawing ? 'Finish Drawing' : 'Draw Boundary'}</span>
            </button>

            <button
              onClick={onUndoPoint}
              disabled={coordinates.length === 0}
              className="px-3 py-2 rounded-xl text-xs font-medium glass-panel hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Point</span>
            </button>
          </div>

          {coordinates.length > 0 && (
            <button
              onClick={onClear}
              className="w-full px-3 py-1 text-xs text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Current Polygon</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleTriggerAnalysis}
            disabled={coordinates.length < 3 || isAnalyzing}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
              coordinates.length >= 3 && !isAnalyzing
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-neon-cyan cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Calculating Real DEM &amp; Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Calculate Pipeline Drainage</span>
              </>
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PIPELINE DRAINAGE SYSTEM (Direct Sink -> Outlet)   */}
        {/* ======================================================== */}
        {activeTab === 'pipeline' && (
          <div className="space-y-3 animate-fade-in text-xs">
            {analysisData && pipe ? (
              <>
                {/* 1. SINKHOLE (KHADDHA) CARD */}
                <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                      <span>Lowest Point (Sinkhole / Khaddha)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                      Waterlogging Risk
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5">
                      <div className="text-slate-400 text-[10px]">Sea-Level Elevation:</div>
                      <div className="font-mono font-bold text-white text-sm">
                        {pipe.sink_elevation_m.toFixed(2)} m MSL
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5">
                      <div className="text-slate-400 text-[10px]">Depression Depth:</div>
                      <div className="font-mono font-bold text-rose-400 text-sm">
                        ▼ {pipe.sink_depth_below_mean_m.toFixed(2)} m
                      </div>
                      <div className="text-[9px] text-slate-400">below field average</div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/40 border border-white/5 text-[10px] font-mono text-slate-300 flex justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-rose-300 font-bold">
                      {pipe.sink_point[1].toFixed(5)}°N, {pipe.sink_point[0].toFixed(5)}°E
                    </span>
                  </div>
                </div>

                {/* 2. VIRTUAL BOUNDARY & DISCHARGE OUTLET */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-neon-green" />
                      <span>Natural Discharge Outlet</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      30m Virtual Perimeter
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5">
                      <div className="text-slate-400 text-[10px]">Outlet Elevation:</div>
                      <div className="font-mono font-bold text-emerald-300 text-sm">
                        {pipe.outlet_elevation_m.toFixed(2)} m MSL
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5">
                      <div className="text-slate-400 text-[10px]">Natural Head / Fall:</div>
                      <div className="font-mono font-bold text-cyan-300 text-sm">
                        {pipe.elevation_drop_meters.toFixed(2)} m drop
                      </div>
                      <div className="text-[9px] text-emerald-400 font-semibold">100% Gravity Runoff</div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/40 border border-white/5 text-[10px] font-mono text-slate-300 flex justify-between">
                    <span className="text-slate-400">Outlet Location:</span>
                    <span className="text-emerald-300 font-bold">
                      {pipe.outlet_point[1].toFixed(5)}°N, {pipe.outlet_point[0].toFixed(5)}°E
                    </span>
                  </div>
                </div>

                {/* 3. DIRECT PIPELINE ENGINEERING SPECIFICATIONS */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/25 border border-cyan-500/35 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Direct Pipeline Engineering</span>
                    </span>
                    <span className="font-mono text-xs font-black text-cyan-300">
                      ₹{Math.round(pipe.estimated_cost_inr).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5">
                      <div className="text-slate-400 text-[10px]">Pipeline Length:</div>
                      <div className="font-mono font-bold text-white text-sm">
                        {pipe.length_meters.toFixed(1)} meters
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5">
                      <div className="text-slate-400 text-[10px]">Slope Grade:</div>
                      <div className="font-mono font-bold text-cyan-300 text-sm">
                        {pipe.slope_percent.toFixed(2)}%
                      </div>
                      <div className="text-[9px] text-slate-400">≥ 0.8% ICAR standard</div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5">
                      <div className="text-slate-400 text-[10px]">Trench Depth (avg):</div>
                      <div className="font-mono font-bold text-slate-200">
                        {pipe.avg_trench_depth_m.toFixed(2)} m (width 0.6m)
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5">
                      <div className="text-slate-400 text-[10px]">Earthwork Volume:</div>
                      <div className="font-mono font-bold text-amber-300">
                        {pipe.excavation_volume_m3.toFixed(1)} m³ cut
                      </div>
                    </div>
                  </div>

                  {/* Material Spec Badge */}
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200 space-y-1">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Material: {pipe.pipe_diameter_mm}mm Dual-Wall Corrugated HDPE</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Perforated corrugated HDPE pipe wrapped in non-woven geotextile fabric with a 150mm gravel bed prevents silt clogging and ensures lifetime sub-surface drainage.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Navigation className="w-8 h-8 text-cyan-400/50 mx-auto" />
                <p className="text-xs">
                  Draw a field boundary on the map and click <strong>&quot;Calculate Pipeline Drainage&quot;</strong> to identify the sinkhole, 30m virtual boundary, and direct pipeline specs.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: FIELD ELEVATION DEM (True Sea Level Metrics)       */}
        {/* ======================================================== */}
        {activeTab === 'dem' && (
          <div className="space-y-3 animate-fade-in text-xs">
            {metrics ? (
              <>
                <TerrainMetricsCard metrics={metrics} />

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
                    <div className="text-slate-400 text-[10px]">Slope Direction:</div>
                    <div className="font-bold text-cyan-300">{metrics.dominant_slope_direction || 'South-East'}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
                    <div className="text-slate-400 text-[10px]">Avg Field Slope:</div>
                    <div className="font-mono font-bold text-white">{metrics.average_slope_percent?.toFixed(2) || '1.20'}%</div>
                  </div>
                </div>

                <button
                  onClick={onOpenGridInspector}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold glass-panel hover:bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Table className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect 2D Sea-Level Elevation Matrix</span>
                </button>

                {onOpenElevationProfile && (
                  <button
                    onClick={onOpenElevationProfile}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold glass-panel hover:bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Inspect Elevation Transect Profile</span>
                  </button>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Layers className="w-8 h-8 text-emerald-400/50 mx-auto" />
                <p className="text-xs">
                  Run terrain analysis to view true sea-level elevation metrics (min, max, average) and the DEM matrix.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: AGRI ADVISORY (Crop Protection & Maintenance)      */}
        {/* ======================================================== */}
        {activeTab === 'advisory' && (
          <div className="space-y-3 animate-fade-in text-xs">
            {/* Crop Selector Card */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-2.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>Field Agronomic Settings</span>
              </span>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Current Field Crop:</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs glass-input rounded-lg text-slate-200"
                >
                  <option value="Wheat">Wheat (Triticum aestivum - High Rot Risk)</option>
                  <option value="Mustard">Mustard (Brassica juncea - Moderate Sensitivity)</option>
                  <option value="Paddy">Paddy / Rice (Oryza sativa - High Inundation Tolerance)</option>
                  <option value="Cotton">Cotton (Gossypium - Extreme Root Hypoxia Risk)</option>
                  <option value="Maize">Maize / Corn (Zea mays - High Hypoxia Sensitivity)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Soil Hydrological Group:</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs glass-input rounded-lg text-slate-200"
                >
                  <option value="clay">Heavy Clay (Vertisol - Slow 1.2 mm/h)</option>
                  <option value="black_cotton">Black Cotton Soil (Very Slow 0.8 mm/h)</option>
                  <option value="alluvial">Indo-Gangetic Alluvial (Medium 9.0 mm/h)</option>
                  <option value="sandy_loam">Sandy Loam (Rapid 22.0 mm/h)</option>
                </select>
              </div>

              <button
                onClick={handleTriggerAnalysis}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                Update Advisory for {cropType}
              </button>
            </div>

            {/* Advisory Guidance Cards */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2">
              <span className="font-semibold text-cyan-300">Sinkhole Drain Maintenance</span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0">•</span>
                  <span>Install a 1m diameter concrete or HDPE catch basin with a debris grate over the sinkhole inlet.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0">•</span>
                  <span>Inspect and clean the silt trap before monsoon rains to avoid sediment deposition inside the pipe.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 shrink-0">•</span>
                  <span>Ensure the discharge outlet has a rodent guard and clear ditch connection outside the virtual boundary.</span>
                </li>
              </ul>
            </div>

            {analysisData?.ai_advisory && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <span className="font-semibold text-amber-300">Crop Health &amp; Inundation Advice</span>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {analysisData.ai_advisory.crop_vulnerability_advice.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global PDF Report Export Bar */}
      <div className="p-3 border-t border-white/10 bg-slate-950/70 space-y-2 shrink-0">
        <button
          onClick={handleDownloadPDF}
          disabled={!analysisData}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Export Agronomic &amp; Pipeline Report (PDF)</span>
        </button>

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Pipeline &amp; Hydrology System</span>
          <span className="font-mono text-cyan-400/80">v2.1.0</span>
        </div>
      </div>
    </aside>
  );
};
