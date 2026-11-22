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
import { AlertCircle, X, Box, Map as MapIcon, Loader2 } from 'lucide-react';

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
      <div className="flex-1 flex flex-col-reverse lg:flex-row relative overflow-hidden">
        {/* Left Control & Telemetry Sidebar */}
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

        {/* Center / Right Visual Area: 2D GIS Map or 3D Terrain Mesh */}
        <div className="flex-1 relative h-[50vh] lg:h-full">
          {viewMode === '2D' ? (
            <>
              {/* Floating Search Bar (Top Left over 2D map) */}
              <div className="absolute top-4 left-4 z-20">
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
