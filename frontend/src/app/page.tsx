'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Dashboard/Header';
import { Sidebar } from '@/components/Dashboard/Sidebar';
import { SearchBar } from '@/components/Map/SearchBar';
import { MapLegend } from '@/components/Map/MapLegend';
import { ElevationGridInspector } from '@/components/Dashboard/ElevationGridInspector';
import { ElevationProfileDrawer } from '@/components/Map/ElevationProfileDrawer';
import { analyzeTerrain } from '@/lib/api';
import { TerrainAnalysisResponse, ElevationProfilePoint } from '@/lib/types';
import { generateAgronomicPDFReport } from '@/lib/pdfExport';
import { AlertCircle, X, Box, Map as MapIcon, Loader2, Sliders, PenTool, RotateCcw, Play } from 'lucide-react';

// Dynamic import of FieldMap to disable SSR for Leaflet
const FieldMap = dynamic(
  () => import('@/components/Map/FieldMap').then((mod) => mod.FieldMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-cyan-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Initializing 2D GIS Map...
        </span>
      </div>
    ),
  }
);

// Dynamic import of Three.js 3D Terrain Viewer
const TerrainViewer3D = dynamic(
  () => import('@/components/Terrain3D/TerrainViewer3D').then((mod) => mod.TerrainViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-cyan-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Generating Three.js 3D Terrain Mesh...
        </span>
      </div>
    ),
  }
);

export default function Home() {
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<TerrainAnalysisResponse | null>(null);
  // Default Landing Location: UEM Jaipur (27.2140, 75.7011)
  const UEM_JAIPUR_LOCATION = {
    lat: 27.2140,
    lng: 75.7011,
  };

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(UEM_JAIPUR_LOCATION);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);
  const [showSinkMarkers, setShowSinkMarkers] = useState(true);
  const [isGridInspectorOpen, setIsGridInspectorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Precision Land Grading & Elevation Transect States (CutSheetRx Style)
  const [mapMode, setMapMode] = useState<'drainage' | 'grading'>('drainage');
  const [profilePoints, setProfilePoints] = useState<ElevationProfilePoint[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'panel'>('map');

  // Automatically detect user's device coordinates for the GPS badge (without overriding UEM Jaipur default landing)
  const locateUserDevice = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
        },
        async (error) => {
          console.warn('Browser geolocation failed or permission denied, using IP fallback:', error);
          try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                const loc = { lat: data.latitude, lng: data.longitude };
                setUserLocation(loc);
              }
            }
          } catch (e) {
            console.warn('IP fallback failed:', e);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleLocateDevice = () => {
    if (userLocation) {
      setSelectedLocation(userLocation);
    } else {
      locateUserDevice();
    }
  };

  const handleCenterUEM = () => {
    setSelectedLocation({ lat: 27.2140, lng: 75.7011 });
  };

  useEffect(() => {
    locateUserDevice();
  }, []);

  // Run Hydrology & Phase II Analysis
  const handleAnalyze = async (
    customCoords?: [number, number][],
    soil: string = 'clay',
    crop: string = 'Wheat',
    rainfall: number = 65
  ) => {
    const coordsToAnalyze = customCoords || coordinates;
    if (coordsToAnalyze.length < 3) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsDrawing(false);

    try {
      const data = await analyzeTerrain(coordsToAnalyze, 20, soil, crop, rainfall);
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Terrain analysis error:', err);
      setErrorMessage(err.message || 'Failed to complete terrain analysis. Please check your boundary.');
    } finally {
      setIsAnalyzing(false);
    }
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

  const handleDownloadPDF = () => {
    if (!analysisData) return;
    generateAgronomicPDFReport(analysisData);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-brand-void">
      {/* Top Header */}
      <Header
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onDownloadPDF={handleDownloadPDF}
        hasAnalysisData={!!analysisData}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Control & Telemetry Sidebar */}
        <div className={`w-full lg:w-96 flex-col h-full z-20 ${mobileTab === 'panel' ? 'flex flex-1' : 'hidden lg:flex'}`}>
          <Sidebar
            coordinates={coordinates}
            isDrawing={isDrawing}
            onToggleDrawing={() => setIsDrawing(!isDrawing)}
            onUndoPoint={handleUndoPoint}
            onClear={handleClear}
            onAnalyze={(soil, crop, rain) => handleAnalyze(coordinates, soil, crop, rain)}
            isAnalyzing={isAnalyzing}
            analysisData={analysisData}
            userLocation={userLocation}
            onLocateDevice={handleLocateDevice}
            onCenterUEM={handleCenterUEM}
            onOpenGridInspector={() => setIsGridInspectorOpen(true)}
            onOpenElevationProfile={() => {
              if (profilePoints.length > 0) {
                setIsProfileOpen(true);
              } else if (analysisData?.bounding_box && analysisData?.elevation_grid) {
                // Generate automatic diagonal cross-section transect across the field
                const bbox = analysisData.bounding_box;
                const ptA: [number, number] = [bbox.min_lng, bbox.max_lat];
                const ptB: [number, number] = [bbox.max_lng, bbox.min_lat];
                import('@/lib/api').then(({ fetchElevationProfile }) => {
                  fetchElevationProfile(
                    analysisData.elevation_grid,
                    bbox,
                    ptA,
                    ptB,
                    analysisData.cut_fill_analysis?.design_elevation_grid
                  ).then((pts) => {
                    setProfilePoints(pts);
                    setIsProfileOpen(true);
                  });
                });
              }
            }}
          />
        </div>

        {/* Center / Right Visual Area: 2D GIS Map or 3D Terrain Mesh */}
        <div className={`flex-1 relative h-full w-full ${mobileTab === 'map' ? 'block' : 'hidden lg:block'}`}>
          {viewMode === '2D' ? (
            <>
              {/* Floating Search Bar (Top Left over 2D map) */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 w-36 sm:w-56 md:w-80">
                <SearchBar onSelectLocation={handleSelectLocation} />
              </div>

              {/* Floating Map Legend (Bottom Left over 2D map) */}
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
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-[90%] px-4 py-3 glass-panel-elevated rounded-xl border border-rose-500/50 text-xs text-rose-300 flex items-center justify-between gap-3 shadow-2xl">
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

              {/* 2D Interactive Leaflet Map with Cut/Fill & Numbered Vertices */}
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
                mapMode={mapMode}
                onToggleMapMode={setMapMode}
                onProfileGenerated={(pts) => {
                  setProfilePoints(pts);
                  setIsProfileOpen(true);
                }}
                onLocateDevice={locateUserDevice}
              />

              {/* Mobile Floating Action Bar for Quick Field Drawing (Active on < lg screens) */}
              {isDrawing && (
                <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 glass-panel-elevated rounded-2xl border border-cyan-400/40 shadow-2xl backdrop-blur-md">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold whitespace-nowrap">
                    {coordinates.length} pts
                  </span>
                  <button
                    onClick={handleUndoPoint}
                    disabled={coordinates.length === 0}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/10 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                  {coordinates.length >= 3 && (
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={isAnalyzing}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-neon-cyan flex items-center gap-1"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Analyze</span>
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            /* 3D Three.js Interactive Terrain Mesh Viewer with Rain Simulation */
            <TerrainViewer3D
              analysisData={analysisData}
              onBackToMap={() => setViewMode('2D')}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on < lg screens) */}
      <div className="lg:hidden flex items-center justify-around bg-slate-950/95 border-t border-white/10 px-3 py-2 z-30 backdrop-blur-xl shrink-0">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl text-xs font-semibold transition-all ${
            mobileTab === 'map'
              ? 'text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="w-4 h-4 mb-0.5" />
          <span>GIS Map</span>
        </button>

        <button
          onClick={() => {
            setMobileTab('map');
            setIsDrawing(!isDrawing);
          }}
          className={`mx-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
            isDrawing
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-neon-cyan'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isDrawing ? 'Done' : 'Draw Boundary'}</span>
        </button>

        <button
          onClick={() => setMobileTab('panel')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl text-xs font-semibold transition-all relative ${
            mobileTab === 'panel'
              ? 'text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {analysisData && (
            <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <Sliders className="w-4 h-4 mb-0.5" />
          <span>Controls &amp; AI</span>
        </button>
      </div>

      {/* Interactive Elevation Profile Cross-Section Drawer */}
      <ElevationProfileDrawer
        points={profilePoints}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onClear={() => {
          setProfilePoints([]);
          setIsProfileOpen(false);
        }}
      />

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
