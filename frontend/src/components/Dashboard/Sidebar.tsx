'use client';

import React, { useState } from 'react';
import { TerrainAnalysisResponse, SampleField } from '@/lib/types';
import { TerrainMetricsCard } from './TerrainMetricsCard';
import {
  PenTool,
  RotateCcw,
  Trash2,
  Play,
  Loader2,
  Table,
  CheckCircle,
  HelpCircle,
  Sliders,
  ChevronRight,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  coordinates: [number, number][];
  isDrawing: boolean;
  onToggleDrawing: () => void;
  onUndoPoint: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisData: TerrainAnalysisResponse | null;
  sampleFields: SampleField[];
  onSelectSampleField: (field: SampleField) => void;
  onOpenGridInspector: () => void;
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
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = e.target.value;
    setSelectedFieldId(fieldId);
    const field = sampleFields.find((f) => f.id === fieldId);
    if (field) {
      onSelectSampleField(field);
    }
  };

  return (
    <aside className="w-full lg:w-96 glass-panel border-r border-white/10 flex flex-col h-full overflow-hidden z-20">
      {/* Scrollable controls & telemetry */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Sample Field Quick Selector */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preset Agricultural Fields</span>
            </span>
            <span className="text-[10px] uppercase font-mono text-cyan-400">1-Click Demo</span>
          </div>

          <select
            value={selectedFieldId}
            onChange={handleFieldChange}
            className="w-full px-3 py-2 text-xs glass-input rounded-lg text-slate-200 cursor-pointer focus:outline-none"
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

          {selectedFieldId && (
            <p className="text-[11px] text-slate-400 italic">
              {sampleFields.find((f) => f.id === selectedFieldId)?.description}
            </p>
          )}
        </div>

        {/* Boundary Mapping Actions */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Field Boundary Mapping</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
              {coordinates.length} {coordinates.length === 1 ? 'vertex' : 'vertices'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleDrawing}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isDrawing
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-neon-rose animate-pulse'
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
              className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Current Boundary</span>
            </button>
          )}

          {/* Primary CTA: Analyze Terrain */}
          <button
            onClick={onAnalyze}
            disabled={coordinates.length < 3 || isAnalyzing}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
              coordinates.length >= 3 && !isAnalyzing
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-neon-cyan cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Computing Elevation &amp; Sinks...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Hydrology Analysis</span>
              </>
            )}
          </button>

          {coordinates.length < 3 && (
            <p className="text-[11px] text-slate-400 text-center">
              Mark at least 3 points on the map or select a preset field to run analysis.
            </p>
          )}
        </div>

        {/* Analysis Results Telemetry */}
        {analysisData && analysisData.metrics && (
          <div className="space-y-3 animate-fade-in">
            {/* Hydro Summary */}
            {analysisData.summary && (
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-1.5">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hydrology Assessment</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {analysisData.summary}
                </p>
              </div>
            )}

            {/* Metrics Breakdown */}
            <TerrainMetricsCard metrics={analysisData.metrics} />

            {/* Matrix Inspector Modal Trigger */}
            <button
              onClick={onOpenGridInspector}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-medium glass-panel hover:bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect NumPy 2D Elevation Matrix</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer / Academic Attribution */}
      <div className="p-3 border-t border-white/10 bg-slate-950/40 text-[10px] text-slate-500 flex justify-between items-center select-none">
        <span>B.Tech CSE Project • 7th Sem</span>
        <span className="font-mono text-cyan-400/70">v1.0.0-Phase-I</span>
      </div>
    </aside>
  );
};

