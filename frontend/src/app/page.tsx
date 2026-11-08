'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Dashboard/Header';
import { Sidebar } from '@/components/Dashboard/Sidebar';
import { SearchBar } from '@/components/Map/SearchBar';
import { MapLegend } from '@/components/Map/MapLegend';
import { ElevationGridInspector } from '@/components/Dashboard/ElevationGridInspector';
import { analyzeTerrain, fetchSampleFields } from '@/lib/api';
import { TerrainAnalysisResponse, SampleField } from '@/lib/types';
import { AlertCircle, X } from 'lucide-react';

// Dynamic import of FieldMap to disable SSR for Leaflet
const FieldMap = dynamic(
  () => import('@/components/Map/FieldMap').then((mod) => mod.FieldMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-cyan-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Initializing Map Canvas...
        </span>
      </div>
    ),
  }
);

export default function Home() {
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<TerrainAnalysisResponse | null>(null);
  const [sampleFields, setSampleFields] = useState<SampleField[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);
  const [showSinkMarkers, setShowSinkMarkers] = useState(true);
  const [isGridInspectorOpen, setIsGridInspectorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load sample fields and initialize with UEM Jaipur demo field
  useEffect(() => {
    fetchSampleFields().then((fields) => {
      setSampleFields(fields);
      if (fields.length > 0) {
        const uem = fields.find((f) => f.id === 'uem-jaipur-demo') || fields[0];
        setCoordinates(uem.coordinates);
        setSelectedLocation({ lat: uem.center[1], lng: uem.center[0] });
        // Automatically analyze initial field for instant evaluation presentation
        handleAnalyze(uem.coordinates);
      }
    });
  }, []);

  // Run Hydrology Analysis
  const handleAnalyze = async (customCoords?: [number, number][]) => {
    const coordsToAnalyze = customCoords || coordinates;
    if (coordsToAnalyze.length < 3) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsDrawing(false);

    try {
      const data = await analyzeTerrain(coordsToAnalyze);
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Terrain analysis error:', err);
      setErrorMessage(err.message || 'Failed to complete terrain analysis. Please check your network or boundary.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSampleField = (field: SampleField) => {
    setCoordinates(field.coordinates);
    setSelectedLocation({ lat: field.center[1], lng: field.center[0] });
    setAnalysisData(null);
    // Auto-run analysis for seamless presentation demo
    handleAnalyze(field.coordinates);
  };

  const handleUndoPoint = () => {
    if (coordinates.length > 0) {
      setCoordinates(coordinates.slice(0, -1));
      setAnalysisData(null);
    }
  };

  const handleClear = () => {
    setCoordinates([]);
    setAnalysisData(null);
    setIsDrawing(false);
  };

  const handleSelectLocation = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-brand-void">
      {/* Top Header */}
      <Header />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col-reverse lg:flex-row relative overflow-hidden">
        {/* Left Control & Telemetry Sidebar */}
        <Sidebar
          coordinates={coordinates}
          isDrawing={isDrawing}
          onToggleDrawing={() => setIsDrawing(!isDrawing)}
          onUndoPoint={handleUndoPoint}
          onClear={handleClear}
          onAnalyze={() => handleAnalyze()}
          isAnalyzing={isAnalyzing}
          analysisData={analysisData}
          sampleFields={sampleFields}
          onSelectSampleField={handleSelectSampleField}
          onOpenGridInspector={() => setIsGridInspectorOpen(true)}
        />

        {/* Center / Right 2D Map Area */}
        <div className="flex-1 relative h-[50vh] lg:h-full">
          {/* Floating Search Bar (Top Left over map) */}
          <div className="absolute top-4 left-4 z-20">
            <SearchBar onSelectLocation={handleSelectLocation} />
          </div>

          {/* Floating Map Legend (Bottom Left over map) */}
          <div className="absolute bottom-6 left-4 z-20 hidden sm:block">
            <MapLegend
              opacity={overlayOpacity}
              onOpacityChange={setOverlayOpacity}
              showMarkers={showSinkMarkers}
              onToggleMarkers={() => setShowSinkMarkers(!showSinkMarkers)}
              minElevation={analysisData?.metrics?.min_elevation}
              maxElevation={analysisData?.metrics?.max_elevation}
            />
          </div>

          {/* Error Banner Notification */}
          {errorMessage && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 py-3 glass-panel-elevated rounded-xl border border-rose-500/50 text-xs text-rose-300 flex items-center justify-between gap-3 shadow-2xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 2D Interactive Leaflet Map */}
          <FieldMap
            coordinates={coordinates}
            onCoordinatesChange={(newCoords) => {
              setCoordinates(newCoords);
              if (analysisData) setAnalysisData(null);
            }}
            analysisData={analysisData}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            overlayOpacity={overlayOpacity}
            showSinkMarkers={showSinkMarkers}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>

      {/* Raw 2D Elevation NumPy Grid Matrix Inspector Modal */}
      {analysisData && (
        <ElevationGridInspector
          grid={analysisData.elevation_grid}
          isOpen={isGridInspectorOpen}
          onClose={() => setIsGridInspectorOpen(false)}
          minElevation={analysisData.metrics?.min_elevation || 0}
          maxElevation={analysisData.metrics?.max_elevation || 10}
        />
      )}
    </div>
  );
}

