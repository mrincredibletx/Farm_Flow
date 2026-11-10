'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TerrainAnalysisResponse, ElevationProfilePoint } from '@/lib/types';
import { fetchElevationProfile } from '@/lib/api';
import {
  Layers,
  RotateCcw,
  Check,
  Sparkles,
  Navigation,
  TrendingDown,
  Scissors,
  Shovel,
  Compass,
} from 'lucide-react';

interface FieldMapProps {
  coordinates: [number, number][];
  onCoordinatesChange: (coords: [number, number][]) => void;
  analysisData: TerrainAnalysisResponse | null;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  overlayOpacity: number;
  showSinkMarkers: boolean;
  selectedLocation: { lat: number; lng: number } | null;
  mapMode: 'drainage' | 'grading';
  onToggleMapMode: (mode: 'drainage' | 'grading') => void;
  onProfileGenerated: (points: ElevationProfilePoint[]) => void;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  coordinates,
  onCoordinatesChange,
  analysisData,
  isDrawing,
  setIsDrawing,
  overlayOpacity,
  showSinkMarkers,
  selectedLocation,
  mapMode,
  onToggleMapMode,
  onProfileGenerated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{
    tileLayer: any;
    polygonLayer: any;
    vertexMarkers: any[];
    heatmapLayer: any;
    gradingLayer: any;
    sinkMarkersLayer: any;
    drainageRoutesLayer: any;
    flowArrowsLayer: any;
    profileLineLayer: any;
  }>({
    tileLayer: null,
    polygonLayer: null,
    vertexMarkers: [],
    heatmapLayer: null,
    gradingLayer: null,
    sinkMarkersLayer: null,
    drainageRoutesLayer: null,
    flowArrowsLayer: null,
    profileLineLayer: null,
  });

  const [activeBaseMap, setActiveBaseMap] = useState<'dark' | 'satellite' | 'osm'>('satellite');
  const [L, setL] = useState<any>(null);
  const [mouseElevation, setMouseElevation] = useState<{
    elev: number;
    lat: number;
    lng: number;
  } | null>(null);

  // Profile line drawing state
  const [isDrawingProfile, setIsDrawingProfile] = useState(false);
  const profilePointsRef = useRef<[number, number][]>([]);

  // Dynamically load Leaflet on client mount
  useEffect(() => {
    import('leaflet').then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = 26.9832;
    const initialLng = 75.9255;
    const initialZoom = 16;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
    });

    // Custom Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Satellite Tile layer (Esri World Imagery)
    const satTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri World Imagery',
        maxZoom: 19,
      }
    ).addTo(map);

    layersRef.current.tileLayer = satTiles;
    layersRef.current.heatmapLayer = L.layerGroup().addTo(map);
    layersRef.current.gradingLayer = L.layerGroup().addTo(map);
    layersRef.current.sinkMarkersLayer = L.layerGroup().addTo(map);
    layersRef.current.drainageRoutesLayer = L.layerGroup().addTo(map);
    layersRef.current.flowArrowsLayer = L.layerGroup().addTo(map);
    layersRef.current.profileLineLayer = L.layerGroup().addTo(map);

    // Mouse Move listener for real-time elevation & GPS HUD
    map.on('mousemove', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (!analysisData || !analysisData.elevation_grid || !analysisData.bounding_box) {
        setMouseElevation({ elev: 0, lat, lng });
        return;
      }

      const bbox = analysisData.bounding_box;
      const grid = analysisData.elevation_grid;
      const rows = grid.length;
      const cols = grid[0].length;

      if (
        lng >= bbox.min_lng &&
        lng <= bbox.max_lng &&
        lat >= bbox.min_lat &&
        lat <= bbox.max_lat
      ) {
        const col_f =
          ((lng - bbox.min_lng) / (bbox.max_lng - bbox.min_lng || 1)) * (cols - 1);
        const row_f =
          ((bbox.max_lat - lat) / (bbox.max_lat - bbox.min_lat || 1)) * (rows - 1);

        const r0 = Math.max(0, Math.min(rows - 1, Math.floor(row_f)));
        const r1 = Math.min(rows - 1, r0 + 1);
        const c0 = Math.max(0, Math.min(cols - 1, Math.floor(col_f)));
        const c1 = Math.min(cols - 1, c0 + 1);

        const dr = row_f - r0;
        const dc = col_f - c0;

        const elev =
          grid[r0][c0] * (1 - dc) * (1 - dr) +
          grid[r0][c1] * dc * (1 - dr) +
          grid[r1][c0] * (1 - dc) * dr +
          grid[r1][c1] * dc * dr;

        setMouseElevation({ elev: Math.round(elev * 100) / 100, lat, lng });
      } else {
        setMouseElevation({ elev: 0, lat, lng });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]);

  // Handle Base Map Switching
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (layersRef.current.tileLayer) {
      map.removeLayer(layersRef.current.tileLayer);
    }

    let newTileLayer;
    if (activeBaseMap === 'dark') {
      newTileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
          maxZoom: 20,
          subdomains: 'abcd',
        }
      );
    } else if (activeBaseMap === 'satellite') {
      newTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri World Imagery',
          maxZoom: 19,
        }
      );
    } else {
      newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
    }

    newTileLayer.addTo(map);
    layersRef.current.tileLayer = newTileLayer;
  }, [activeBaseMap, L]);

  // Handle Location Search Pan
  useEffect(() => {
    if (!selectedLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lng], 16, {
      duration: 1.5,
    });
  }, [selectedLocation]);

  // Map Click Handler for Field Drawing & Profile Transect
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = async (e: any) => {
      const clickPt: [number, number] = [
        parseFloat(e.latlng.lng.toFixed(6)),
        parseFloat(e.latlng.lat.toFixed(6)),
      ];

      // If user is drawing an Elevation Profile Transect line
      if (isDrawingProfile) {
        profilePointsRef.current.push(clickPt);

        if (profilePointsRef.current.length === 1) {
          // Draw start marker A
          layersRef.current.profileLineLayer.clearLayers();
          const startIcon = L.divIcon({
            className: 'profile-pin-a',
            html: `<div style="background:#00F0FF;color:#000;font-weight:900;font-size:10px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px #00F0FF;border:2px solid #fff;">A</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          L.marker([clickPt[1], clickPt[0]], { icon: startIcon }).addTo(
            layersRef.current.profileLineLayer
          );
        } else if (profilePointsRef.current.length >= 2) {
          // Draw end marker B and transect line
          const [ptA, ptB] = profilePointsRef.current;

          const endIcon = L.divIcon({
            className: 'profile-pin-b',
            html: `<div style="background:#10B981;color:#000;font-weight:900;font-size:10px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px #10B981;border:2px solid #fff;">B</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          L.marker([ptB[1], ptB[0]], { icon: endIcon }).addTo(
            layersRef.current.profileLineLayer
          );

          L.polyline(
            [
              [ptA[1], ptA[0]],
              [ptB[1], ptB[0]],
            ],
            {
              color: '#00F0FF',
              weight: 3,
              dashArray: '6, 6',
            }
          ).addTo(layersRef.current.profileLineLayer);

          setIsDrawingProfile(false);
          profilePointsRef.current = [];

          // Compute & fetch cross-section profile
          if (analysisData?.elevation_grid && analysisData.bounding_box) {
            const profile = await fetchElevationProfile(
              analysisData.elevation_grid,
              analysisData.bounding_box,
              ptA,
              ptB,
              analysisData.cut_fill_analysis?.design_elevation_grid
            );
            onProfileGenerated(profile);
          }
        }
        return;
      }

      // If user is drawing field boundary
      if (isDrawing) {
        onCoordinatesChange([...coordinates, clickPt]);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [L, isDrawing, isDrawingProfile, coordinates, analysisData, onCoordinatesChange, onProfileGenerated]);

  // Update Polygon Layer and Numbered Vertex Markers
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing polygon layer
    if (layersRef.current.polygonLayer) {
      map.removeLayer(layersRef.current.polygonLayer);
      layersRef.current.polygonLayer = null;
    }

    // Clear existing vertex markers
    layersRef.current.vertexMarkers.forEach((m) => map.removeLayer(m));
    layersRef.current.vertexMarkers = [];

    if (coordinates.length === 0) return;

    const latLngs = coordinates.map((c) => [c[1], c[0]]);

    if (coordinates.length >= 3) {
      // Draw Polygon
      const polygon = L.polygon(latLngs, {
        color: '#00F0FF',
        weight: 2.5,
        fillColor: '#00F0FF',
        fillOpacity: 0.12,
        dashArray: isDrawing ? '6, 6' : undefined,
      }).addTo(map);

      layersRef.current.polygonLayer = polygon;

      if (!isDrawing) {
        map.fitBounds(polygon.getBounds(), { padding: [60, 60], maxZoom: 18 });
      }
    } else if (coordinates.length >= 2) {
      // Draw Polyline while drawing
      const polyline = L.polyline(latLngs, {
        color: '#00F0FF',
        weight: 2.5,
        dashArray: '6, 6',
      }).addTo(map);
      layersRef.current.polygonLayer = polyline;
    }

    // Add CutSheetRx-style Numbered Vertex Badges [1], [2], [3]...
    coordinates.forEach((pt, idx) => {
      const markerIcon = L.divIcon({
        className: 'custom-vertex-badge',
        html: `
          <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid #F59E0B; color: #FCD34D; font-weight: 800; font-size: 11px; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(245, 158, 11, 0.7);">
            ${idx + 1}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([pt[1], pt[0]], { icon: markerIcon }).addTo(map);
      layersRef.current.vertexMarkers.push(marker);
    });
  }, [L, coordinates, isDrawing]);

  // Render Map Layers based on active mode (Drainage vs Grading)
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const heatmapGroup = layersRef.current.heatmapLayer;
    const gradingGroup = layersRef.current.gradingLayer;
    const sinksGroup = layersRef.current.sinkMarkersLayer;
    const routesGroup = layersRef.current.drainageRoutesLayer;
    const flowArrowsGroup = layersRef.current.flowArrowsLayer;

    heatmapGroup?.clearLayers();
    gradingGroup?.clearLayers();
    sinksGroup?.clearLayers();
    routesGroup?.clearLayers();
    flowArrowsGroup?.clearLayers();

    if (!analysisData) return;

    // ==========================================
    // MODE 1: DRAINAGE & HYDROLOGICAL FLOW
    // ==========================================
    if (mapMode === 'drainage' && analysisData.waterlogging_zones) {
      const zones = analysisData.waterlogging_zones;
      const sampleCount = zones.length;
      const pointRadius = sampleCount > 300 ? 10 : sampleCount > 150 ? 14 : 20;

      const detailsMap = new Map<string, any>();
      if (analysisData.zone_details) {
        analysisData.zone_details.forEach((d) => {
          detailsMap.set(`${d.lng.toFixed(5)}_${d.lat.toFixed(5)}`, d);
        });
      }

      // Render waterlogging risk circles
      zones.forEach(([lng, lat, severity]) => {
        const detail = detailsMap.get(`${lng.toFixed(5)}_${lat.toFixed(5)}`);
        const elevText = detail ? `${detail.elevation.toFixed(2)} m` : 'Calculating...';

        let fillColor = '#10B981';
        let strokeColor = '#059669';

        if (severity >= 0.7) {
          fillColor = '#F43F5E';
          strokeColor = '#BE123C';
        } else if (severity >= 0.4) {
          fillColor = '#F59E0B';
          strokeColor = '#D97706';
        } else if (severity >= 0.25) {
          fillColor = '#06B6D4';
          strokeColor = '#0891B2';
        }

        const circle = L.circle([lat, lng], {
          radius: pointRadius,
          stroke: true,
          weight: 0.5,
          color: strokeColor,
          opacity: overlayOpacity * 0.25,
          fillColor: fillColor,
          fillOpacity: overlayOpacity * 0.45,
        });

        circle.bindPopup(`
          <div class="p-1 space-y-1.5 text-xs">
            <div class="font-bold flex items-center gap-1.5 ${
              severity >= 0.7 ? 'text-rose-400' : severity >= 0.4 ? 'text-amber-400' : 'text-cyan-400'
            }">
              <span>${severity >= 0.7 ? 'Severe Risk' : severity >= 0.4 ? 'Moderate Risk' : 'Low Risk'}</span>
            </div>
            <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
              <div>Elevation:</div>
              <div class="font-mono text-cyan-300 text-right font-bold">${elevText}</div>
              <div>Waterlogging Risk:</div>
              <div class="font-mono text-right">${Math.round(severity * 100)}%</div>
            </div>
          </div>
        `);
        heatmapGroup.addLayer(circle);
      });

      // Primary Sinks
      if (showSinkMarkers && analysisData.drainage_routes) {
        analysisData.drainage_routes.forEach((r, idx) => {
          const pingIcon = L.divIcon({
            className: 'sink-radar-pin',
            html: `
              <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                <div class="sink-ping-ring" style="width: 36px; height: 36px;"></div>
                <div class="sink-core-dot" style="width: 14px; height: 14px; background: #F43F5E; border: 2px solid #FFFFFF; box-shadow: 0 0 12px #F43F5E;"></div>
                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(15,23,42,0.92); border: 1px solid #F43F5E; color: #FDA4AF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px;">
                  🔴 Sink #${idx + 1}
                </div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });
          const marker = L.marker([r.sink_point[1], r.sink_point[0]], { icon: pingIcon });
          sinksGroup.addLayer(marker);
        });
      }

      // Engineered Drainage Ditch Routes
      if (analysisData.drainage_routes) {
        analysisData.drainage_routes.forEach((route, idx) => {
          const latLngs = route.path_coordinates.map((pt) => [pt[1], pt[0]]);
          const ditchLine = L.polyline(latLngs, {
            color: '#00F0FF',
            weight: 4.5,
            opacity: 0.95,
            dashArray: '8, 8',
          });
          ditchLine.bindTooltip(`💧 Ditch #${idx + 1} (${route.length_meters.toFixed(0)}m)`, {
            permanent: true,
            direction: 'center',
            className: 'ditch-label-tooltip',
          });
          routesGroup.addLayer(ditchLine);

          // Outlet marker
          const outletIcon = L.divIcon({
            className: 'ditch-outlet-pin',
            html: `<div style="background:#10B981;width:16px;height:16px;border:2px solid #fff;border-radius:4px;box-shadow:0 0 12px #10B981;"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          const outletMarker = L.marker([route.outlet_point[1], route.outlet_point[0]], {
            icon: outletIcon,
          });
          routesGroup.addLayer(outletMarker);
        });
      }

      // Downhill Flow Vectors
      if (analysisData.flow_vectors && analysisData.bounding_box) {
        const bbox = analysisData.bounding_box;
        const spanLng = bbox.max_lng - bbox.min_lng;
        const arrowLen = Math.max(spanLng * 0.045, 0.00025);

        analysisData.flow_vectors.forEach((vec) => {
          const rad = (90 - vec.direction_deg) * (Math.PI / 180);
          const dx = Math.cos(rad) * arrowLen;
          const dy = Math.sin(rad) * arrowLen;

          const startLat = vec.lat - dy * 0.45;
          const startLng = vec.lng - dx * 0.45;
          const endLat = vec.lat + dy * 0.55;
          const endLng = vec.lng + dx * 0.55;

          const arrowShaft = L.polyline(
            [
              [startLat, startLng],
              [endLat, endLng],
            ],
            {
              color: '#00F0FF',
              weight: 2.2,
              opacity: 0.85,
              dashArray: '3, 3',
            }
          );

          const arrowHeadIcon = L.divIcon({
            className: 'flow-arrow-marker',
            html: `
              <div style="transform: rotate(${vec.direction_deg - 90}deg); color: #00F0FF; font-size: 16px; font-weight: 900; filter: drop-shadow(0 0 6px rgba(0,240,255,0.9)); line-height: 1;">
                ➔
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          const headMarker = L.marker([endLat, endLng], { icon: arrowHeadIcon });

          flowArrowsGroup.addLayer(arrowShaft);
          flowArrowsGroup.addLayer(headMarker);
        });
      }
    }

    // ==========================================
    // MODE 2: PRECISION LAND GRADING (CUT / FILL)
    // ==========================================
    if (mapMode === 'grading' && analysisData.cut_fill_analysis && analysisData.bounding_box) {
      const cutFill = analysisData.cut_fill_analysis;
      const matrix = cutFill.cut_fill_matrix;
      const rows = matrix.length;
      const cols = matrix[0].length;
      const bbox = analysisData.bounding_box;

      const dLng = (bbox.max_lng - bbox.min_lng) / cols;
      const dLat = (bbox.max_lat - bbox.min_lat) / rows;

      // Render Cut (Red) and Fill (Blue) shaded relief grid
      for (let r = 0; r < rows; r++) {
        const latCenter = bbox.max_lat - (r + 0.5) * dLat;
        for (let c = 0; c < cols; c++) {
          const lngCenter = bbox.min_lng + (c + 0.5) * dLng;
          const diff = matrix[r][c]; // positive = cut, negative = fill

          let color = '#3B82F6'; // Fill blue
          let opacity = 0.4;

          if (diff > 0.05) {
            // Cut (Red)
            color = '#EF4444';
            opacity = Math.min(0.75, 0.25 + (diff / (cutFill.max_cut_depth_m || 1)) * 0.5);
          } else if (diff < -0.05) {
            // Fill (Blue)
            color = '#3B82F6';
            opacity = Math.min(0.75, 0.25 + (Math.abs(diff) / (cutFill.max_fill_depth_m || 1)) * 0.5);
          } else {
            // Near Grade (Green/Cyan)
            color = '#10B981';
            opacity = 0.2;
          }

          const cellBounds: [[number, number], [number, number]] = [
            [latCenter - dLat * 0.48, lngCenter - dLng * 0.48],
            [latCenter + dLat * 0.48, lngCenter + dLng * 0.48],
          ];

          const rect = L.rectangle(cellBounds, {
            color: 'transparent',
            weight: 0,
            fillColor: color,
            fillOpacity: opacity * overlayOpacity,
          });

          rect.bindPopup(`
            <div class="p-1 space-y-1 text-xs font-sans">
              <div class="font-bold ${diff > 0 ? 'text-rose-400' : 'text-blue-400'}">
                ${diff > 0 ? `✂️ Cut (Remove Soil): +${diff.toFixed(2)}m` : `🚜 Fill (Deposit Soil): ${diff.toFixed(2)}m`}
              </div>
              <div class="text-[11px] text-slate-300">
                Ground: ${(analysisData.elevation_grid[r]?.[c] ?? 0).toFixed(2)}m | Design: ${(cutFill.design_elevation_grid[r]?.[c] ?? 0).toFixed(2)}m
              </div>
            </div>
          `);

          gradingGroup.addLayer(rect);
        }
      }

      // CutSheetRx Center Field Design Slope Indicator Arrow (e.g. "0.09% ↓")
      const centerLat = (bbox.min_lat + bbox.max_lat) / 2;
      const centerLng = (bbox.min_lng + bbox.max_lng) / 2;
      const heading = cutFill.design_heading_degrees;
      const slope = cutFill.design_slope_percent;

      const centerArrowIcon = L.divIcon({
        className: 'center-slope-indicator',
        html: `
          <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid #00F0FF; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 4px 15px rgba(0,240,255,0.4); display: flex; align-items: center; gap: 6px; white-space: nowrap; transform: translate(-50%, -50%);">
            <span style="display: inline-block; transform: rotate(${heading - 90}deg); color: #00F0FF; font-weight: 900; font-size: 14px;">➔</span>
            <span style="color: #fff; font-weight: 800; font-family: monospace; font-size: 12px;">${slope.toFixed(2)}%</span>
            <span style="color: #94a3b8; font-size: 10px;">${cutFill.heading_compass}</span>
          </div>
        `,
        iconSize: [110, 32],
        iconAnchor: [55, 16],
      });

      const centerMarker = L.marker([centerLat, centerLng], { icon: centerArrowIcon });
      gradingGroup.addLayer(centerMarker);
    }
  }, [L, analysisData, mapMode, overlayOpacity, showSinkMarkers]);

  return (
    <div className="relative w-full h-full select-none">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Mode Switcher Pill (Top Center) - CutSheetRx Style */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center p-1 glass-panel-elevated rounded-2xl border border-cyan-500/30 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => onToggleMapMode('drainage')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mapMode === 'drainage'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-neon-cyan'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Drainage & Sinks</span>
        </button>

        <button
          onClick={() => onToggleMapMode('grading')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mapMode === 'grading'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-rose-400" />
          <span>Cut / Fill Land Grading</span>
        </button>

        <span className="text-slate-600 text-xs px-1">|</span>

        {/* Draw Elevation Profile Button */}
        <button
          onClick={() => {
            setIsDrawingProfile(!isDrawingProfile);
            profilePointsRef.current = [];
            layersRef.current.profileLineLayer.clearLayers();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isDrawingProfile
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Click 2 points on field to draw an Elevation Cross-Section"
        >
          <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          <span>{isDrawingProfile ? 'Click 2 Points...' : 'Cross-Section Profile'}</span>
        </button>
      </div>

      {/* Top Right Quick Stats HUD Card - CutSheetRx Style */}
      {analysisData && (
        <div className="absolute top-16 right-4 z-20 glass-panel-elevated p-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md max-w-xs space-y-2 text-xs hidden sm:block animate-in fade-in duration-300">
          {mapMode === 'grading' && analysisData.cut_fill_analysis ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Earthwork Balance
                </span>
                <span className="font-mono text-[10px] text-cyan-300">Cut:Fill 1.20</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/30">
                  <div className="text-slate-400 text-[10px]">CUT (Excess):</div>
                  <div className="font-mono font-black text-rose-400 text-sm">
                    {analysisData.cut_fill_analysis.total_cut_m3.toLocaleString()} m³
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/30">
                  <div className="text-slate-400 text-[10px]">FILL (Deficit):</div>
                  <div className="font-mono font-black text-blue-400 text-sm">
                    {analysisData.cut_fill_analysis.total_fill_m3.toLocaleString()} m³
                  </div>
                </div>
              </div>
              <div className="pt-1 text-[10.5px] text-slate-300 flex justify-between">
                <span>Design Grade:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {analysisData.cut_fill_analysis.design_slope_percent}% toward{' '}
                  {analysisData.cut_fill_analysis.heading_compass}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Hydrology Telemetry
                </span>
                <span className="font-mono text-[10px] text-cyan-300">
                  {analysisData.drainage_routes?.length || 0} Ditches
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
                  <div className="text-slate-400 text-[10px]">Elev Range:</div>
                  <div className="font-mono font-bold text-cyan-300">
                    {analysisData.metrics?.elevation_range}m
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
                  <div className="text-slate-400 text-[10px]">Ponding Basins:</div>
                  <div className="font-mono font-bold text-rose-400">
                    {analysisData.metrics?.high_risk_points_count || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Basemap Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 p-1 glass-panel rounded-xl shadow-xl">
        <button
          onClick={() => setActiveBaseMap('satellite')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeBaseMap === 'satellite'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setActiveBaseMap('dark')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeBaseMap === 'dark'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => setActiveBaseMap('osm')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeBaseMap === 'osm'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Street
        </button>
      </div>

      {/* Real-time Cursor Elevation & GPS HUD (Bottom Center) - CutSheetRx Style */}
      {mouseElevation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 glass-panel-elevated rounded-full border border-white/10 text-xs text-slate-300 font-mono shadow-2xl backdrop-blur-md flex items-center gap-2.5">
          {mouseElevation.elev > 0 ? (
            <>
              <span className="text-cyan-300 font-bold">
                {mouseElevation.elev.toFixed(2)} m ({(mouseElevation.elev * 3.28084).toFixed(1)} ft)
              </span>
              <span className="text-slate-600">|</span>
            </>
          ) : null}
          <span className="text-slate-400 text-[11px]">
            {mouseElevation.lat.toFixed(5)}, {mouseElevation.lng.toFixed(5)}
          </span>
        </div>
      )}

      {/* Interactive Profile Drawing Instruction Banner */}
      {isDrawingProfile && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 glass-panel-elevated rounded-full border border-amber-400/60 shadow-2xl text-xs font-semibold text-amber-300 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>Click two points on the map to draw an Elevation Cross-Section Transect</span>
        </div>
      )}
    </div>
  );
};
