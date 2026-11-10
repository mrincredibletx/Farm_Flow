'use client';

import React, { useState } from 'react';
import { TerrainAnalysisResponse, SampleField } from '@/lib/types';
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
  Scissors,
  Shovel,
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
  sampleFields: SampleField[];
  onSelectSampleField: (field: SampleField) => void;
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
  sampleFields,
  onSelectSampleField,
  onOpenGridInspector,
  onOpenElevationProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'hydrology' | 'drainage' | 'grading' | 'simulator' | 'advisory'>('hydrology');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [soilType, setSoilType] = useState<string>('clay');
  const [cropType, setCropType] = useState<string>('Wheat');
  const [rainfallMm, setRainfallMm] = useState<number>(65);

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = e.target.value;
    setSelectedFieldId(fieldId);
    const field = sampleFields.find((f) => f.id === fieldId);
    if (field) {
      onSelectSampleField(field);
    }
  };

  const handleTriggerAnalysis = () => {
    onAnalyze(soilType, cropType, rainfallMm);
  };

  const handleDownloadPDF = () => {
    if (!analysisData) return;
    generateAgronomicPDFReport(analysisData);
  };

  return (
    <aside className="w-full lg:w-96 glass-panel border-r border-white/10 flex flex-col h-full overflow-hidden z-20 select-none">
      {/* Phase II Feature Tab Bar */}
      <div className="flex border-b border-white/10 bg-slate-950/40 text-[11px] p-1 gap-1">
        <button
          onClick={() => setActiveTab('hydrology')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
            activeTab === 'hydrology'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Hydrology</span>
        </button>

        <button
          onClick={() => setActiveTab('drainage')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
            activeTab === 'drainage'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3 h-3" />
          <span>A* Ditching</span>
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
            activeTab === 'grading'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-3 h-3 text-rose-400" />
          <span>Cut/Fill</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
            activeTab === 'simulator'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudRain className="w-3 h-3" />
          <span>ML Risk</span>
        </button>

        <button
          onClick={() => setActiveTab('advisory')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
            activeTab === 'advisory'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3 h-3" />
          <span>Gemini AI</span>
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preset Agricultural Fields Selector */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preset Agricultural Fields</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400">1-Click Demo</span>
          </div>

          <select
            value={selectedFieldId}
            onChange={handleFieldChange}
            className="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-slate-200 cursor-pointer focus:outline-none"
          >
            <option value="" className="bg-slate-900 text-slate-400">
              Select or load test field...
            </option>
            {sampleFields.map((field) => (
              <option key={field.id} value={field.id} className="bg-slate-900 text-slate-100">
                {field.name} ({field.location})
              </option>
            ))}
          </select>
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
                <span>Computing Full Hydrology &amp; Routes...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Analyze Terrain &amp; Drainage</span>
              </>
            )}
          </button>
        </div>

        {/* TAB 1: HYDROLOGY & ELEVATION (Phase I) */}
        {activeTab === 'hydrology' && analysisData && analysisData.metrics && (
          <div className="space-y-3 animate-fade-in">
            {analysisData.summary && (
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-1">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hydrology Assessment</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {analysisData.summary}
                </p>
              </div>
            )}

            <TerrainMetricsCard metrics={analysisData.metrics} />

            <button
              onClick={onOpenGridInspector}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium glass-panel hover:bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect NumPy 2D Elevation Matrix</span>
            </button>
          </div>
        )}

        {/* TAB 2: A* DRAINAGE ROUTING (Phase II) */}
        {activeTab === 'drainage' && analysisData && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Optimal A* Drainage Routes</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                  {analysisData.drainage_routes?.length || 0} Channels
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                A* cost function minimizes earthwork excavation while following the steepest natural gravity-fed descent.
              </p>
            </div>

            {analysisData.drainage_routes && analysisData.drainage_routes.map((route, idx) => (
              <div
                key={route.route_id}
                className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-2 text-xs hover:border-cyan-400/40 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Channel #{idx + 1}</span>
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                    ₹{route.estimated_cost_inr.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Trench Length</div>
                    <div className="font-mono font-bold text-slate-100">{route.length_meters.toFixed(1)} m</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Elevation Fall (ΔZ)</div>
                    <div className="font-mono font-bold text-cyan-300">{route.elevation_drop_meters.toFixed(2)} m</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Slope Grade</div>
                    <div className="font-mono font-bold text-slate-200">{route.slope_percent.toFixed(2)}%</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Excavation Cut</div>
                    <div className="font-mono font-bold text-amber-300">{route.excavation_volume_m3.toFixed(1)} m³</div>
                  </div>
                </div>

                <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-[10px] text-cyan-200 font-mono">
                  Recommended: {route.recommended_ditch_type}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2.5: CUT / FILL LAND GRADING (CutSheetRx Precision Leveling) */}
        {activeTab === 'grading' && analysisData?.cut_fill_analysis && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-rose-400" />
                  <span>Precision Land Leveling</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Cut:Fill 1.20 Target
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Calculates the best-fit planar grading slope to balance soil cut and fill volumes for uniform gravity runoff.
              </p>
            </div>

            {/* Big Cut & Fill Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                <div className="text-slate-400 text-[10px] flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-rose-400" />
                  <span>TOTAL CUT</span>
                </div>
                <div className="font-mono font-black text-rose-400 text-base">
                  {analysisData.cut_fill_analysis.total_cut_m3.toLocaleString()} m³
                </div>
                <div className="text-[10px] text-slate-400">
                  {analysisData.cut_fill_analysis.cut_per_acre_m3} m³/ac
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-1">
                <div className="text-slate-400 text-[10px] flex items-center gap-1">
                  <Shovel className="w-3 h-3 text-blue-400" />
                  <span>TOTAL FILL</span>
                </div>
                <div className="font-mono font-black text-blue-400 text-base">
                  {analysisData.cut_fill_analysis.total_fill_m3.toLocaleString()} m³
                </div>
                <div className="text-[10px] text-slate-400">
                  Ratio: {analysisData.cut_fill_analysis.cut_fill_ratio}
                </div>
              </div>
            </div>

            {/* Design Planar Slope Specs */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-2 text-[11px]">
              <span className="font-semibold text-slate-200">Grading Specifications</span>
              <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                <div className="p-2 rounded bg-slate-950/50 border border-white/5">
                  <div className="text-slate-400 text-[10px]">Design Slope:</div>
                  <div className="font-mono font-bold text-cyan-300">
                    {analysisData.cut_fill_analysis.design_slope_percent}% Grade
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950/50 border border-white/5">
                  <div className="text-slate-400 text-[10px]">Fall Azimuth:</div>
                  <div className="font-mono font-bold text-slate-100">
                    {analysisData.cut_fill_analysis.heading_compass} ({analysisData.cut_fill_analysis.design_heading_degrees}°)
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950/50 border border-white/5">
                  <div className="text-slate-400 text-[10px]">Max Cut Depth:</div>
                  <div className="font-mono font-bold text-rose-400">
                    +{analysisData.cut_fill_analysis.max_cut_depth_m} m
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950/50 border border-white/5">
                  <div className="text-slate-400 text-[10px]">Max Fill Depth:</div>
                  <div className="font-mono font-bold text-blue-400">
                    -{analysisData.cut_fill_analysis.max_fill_depth_m} m
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/20 flex justify-between items-center text-xs">
                <span className="text-slate-300">Est. Leveling Cost:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{analysisData.cut_fill_analysis.estimated_leveling_cost_inr.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Transect Trigger Button */}
            {onOpenElevationProfile && (
              <button
                onClick={onOpenElevationProfile}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold glass-panel hover:bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inspect Elevation Profile Transect</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 3: SOIL & RAINFALL ML SIMULATOR (Phase II) */}
        {activeTab === 'simulator' && (
          <div className="space-y-3 animate-fade-in text-xs">
            {/* Live Meteorological Feed Badge */}
            {analysisData?.live_weather && (
              <div className="p-3 rounded-xl bg-blue-950/25 border border-blue-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    <span>Live Meteorological Feed</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-medium">
                    {analysisData.live_weather.is_live ? "Live Station" : "Simulation"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Condition:</div>
                    <div className="font-semibold text-white">{analysisData.live_weather.condition}</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Temperature:</div>
                    <div className="font-mono font-semibold text-cyan-300">{analysisData.live_weather.temperature_c}°C</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Humidity:</div>
                    <div className="font-mono text-slate-200">{analysisData.live_weather.humidity_percent}%</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/50 border border-white/5">
                    <div className="text-slate-400 text-[10px]">Recorded Rain (1h):</div>
                    <div className="font-mono font-bold text-blue-300">{analysisData.live_weather.recorded_rain_1h_mm || 0} mm</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between items-center">
                  <span>Location: {analysisData.live_weather.location_name || "Field Coordinates"}</span>
                  <span className="text-blue-400 font-mono text-[9px]">{analysisData.live_weather.source}</span>
                </div>
              </div>
            )}

            {/* Input Controls */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-3">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Simulation Parameters</span>
              </span>

              {/* Soil Selector */}
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
                  <option value="silt_loam">Silt Loam (Moderate 8.5 mm/h)</option>
                  <option value="sandy_loam">Sandy Loam (Rapid 22.0 mm/h)</option>
                </select>
              </div>

              {/* Rainfall Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Precipitation Event:</span>
                  <span className="font-mono text-cyan-300 font-bold">{rainfallMm} mm / 24h</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="5"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Light (15mm)</span>
                  <span>Monsoon (60mm)</span>
                  <span>Cloudburst (180mm)</span>
                </div>
              </div>

              <button
                onClick={handleTriggerAnalysis}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
              >
                Re-calculate Runoff Kinetics
              </button>
            </div>

            {/* Results Card */}
            {analysisData?.risk_simulation && (
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Inundation &amp; Hypoxia Risk</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-rose-400">
                    {analysisData.risk_simulation.crop_loss_risk_percent}%
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-950/70 border border-rose-500/20 text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Runoff Volume:</span>
                    <span className="font-mono text-slate-200">
                      {analysisData.risk_simulation.runoff_volume_m3.toLocaleString()} m³ ({analysisData.risk_simulation.runoff_volume_megaliters} ML)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Depression Ponding:</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {analysisData.risk_simulation.estimated_ponding_depth_cm} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Saturation Drainage Time:</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {analysisData.risk_simulation.drainage_time_hours} hours
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-slate-400">Severity Level:</span>
                    <span className="text-rose-400 font-semibold text-[10px]">
                      {analysisData.risk_simulation.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GEMINI AI ADVISORY (Phase II) */}
        {activeTab === 'advisory' && (
          <div className="space-y-3 animate-fade-in text-xs">
            {/* Crop Selector */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
              <label className="text-[10px] text-slate-400">Current Field Crop:</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs glass-input rounded-lg text-slate-200"
              >
                <option value="Wheat">Wheat (Triticum aestivum - High Rot Risk)</option>
                <option value="Paddy">Paddy / Rice (Oryza sativa - High Tolerance)</option>
                <option value="Mustard">Mustard (Brassica juncea - Moderate)</option>
                <option value="Cotton">Cotton (Gossypium - Extreme Root Rot Risk)</option>
                <option value="Maize">Maize / Corn (Zea mays - High Hypoxia)</option>
              </select>
            </div>

            {analysisData?.ai_advisory && (
              <div className="space-y-3">
                {/* Advisory Header */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{analysisData.ai_advisory.headline}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Engineered by {analysisData.ai_advisory.generated_by}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
                  <span className="font-semibold text-cyan-300">Drainage Interventions</span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {analysisData.ai_advisory.drainage_recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 shrink-0">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Crop Vulnerability Advice */}
                <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
                  <span className="font-semibold text-rose-300">Crop Health &amp; Hypoxia</span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {analysisData.ai_advisory.crop_vulnerability_advice.map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ROI Assessment */}
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] space-y-1">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Economic ROI Forecast</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {analysisData.ai_advisory.estimated_roi_assessment}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global PDF Report Export Bar */}
      <div className="p-3 border-t border-white/10 bg-slate-950/60 space-y-2">
        <button
          onClick={handleDownloadPDF}
          disabled={!analysisData}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Export Agronomic Report (PDF)</span>
        </button>

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Phase II Integrated MVP</span>
          <span className="font-mono text-cyan-400/80">v2.0.0</span>
        </div>
      </div>
    </aside>
  );
};
