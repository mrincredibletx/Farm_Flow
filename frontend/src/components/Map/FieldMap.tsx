'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TerrainAnalysisResponse } from '@/lib/types';
import { Layers, RotateCcw, Check, Sparkles, Navigation } from 'lucide-react';

interface FieldMapProps {
  coordinates: [number, number][];
  onCoordinatesChange: (coords: [number, number][]) => void;
  analysisData: TerrainAnalysisResponse | null;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  overlayOpacity: number;
  showSinkMarkers: boolean;
  selectedLocation: { lat: number; lng: number } | null;
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{
    tileLayer: any;
    polygonLayer: any;
    vertexMarkers: any[];
    heatmapLayer: any;
    sinkMarkersLayer: any;
    drainageRoutesLayer: any;
  }>({
    tileLayer: null,
    polygonLayer: null,
    vertexMarkers: [],
    heatmapLayer: null,
    sinkMarkersLayer: null,
    drainageRoutesLayer: null,
  });

  const [activeBaseMap, setActiveBaseMap] = useState<'dark' | 'satellite' | 'osm'>('dark');
  const [L, setL] = useState<any>(null);

  // Dynamically load Leaflet on client mount
  useEffect(() => {
    import('leaflet').then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Default to Jaipur / UEM Jaipur area
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

    // Initial Dark Tile layer (CartoDB Dark Matter)
    const darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; CartoDB &copy; OpenStreetMap',
        maxZoom: 20,
        subdomains: 'abcd',
      }
    ).addTo(map);

    layersRef.current.tileLayer = darkTiles;
    layersRef.current.heatmapLayer = L.layerGroup().addTo(map);
    layersRef.current.sinkMarkersLayer = L.layerGroup().addTo(map);
    layersRef.current.drainageRoutesLayer = L.layerGroup().addTo(map);

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

  // Map Click Handler for Drawing Mode
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e: any) => {
      if (!isDrawing) return;

      const newPoint: [number, number] = [
        parseFloat(e.latlng.lng.toFixed(6)),
        parseFloat(e.latlng.lat.toFixed(6)),
      ];

      onCoordinatesChange([...coordinates, newPoint]);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [L, isDrawing, coordinates, onCoordinatesChange]);

  // Update Polygon Layer and Vertex Markers on coordinates change
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

    // Add glowing vertex markers
    if (isDrawing || coordinates.length < 3) {
      coordinates.forEach((pt, idx) => {
        const markerIcon = L.divIcon({
          className: 'custom-vertex-icon',
          html: `<div class="draw-vertex-marker" title="Point ${idx + 1}"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([pt[1], pt[0]], { icon: markerIcon }).addTo(map);
        layersRef.current.vertexMarkers.push(marker);
      });
    }
  }, [L, coordinates, isDrawing]);

  // Render 2D Heatmap & Waterlogging Zones
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const heatmapGroup = layersRef.current.heatmapLayer;
    const sinksGroup = layersRef.current.sinkMarkersLayer;

    heatmapGroup.clearLayers();
    sinksGroup.clearLayers();

    if (!analysisData || !analysisData.waterlogging_zones) return;

    const zones = analysisData.waterlogging_zones; // [[lng, lat, severity], ...]
    const detailsMap = new Map<string, any>();
    if (analysisData.zone_details) {
      analysisData.zone_details.forEach((d) => {
        detailsMap.set(`${d.lng.toFixed(5)}_${d.lat.toFixed(5)}`, d);
      });
    }

    // Compute bounding radius based on field resolution
    const sampleCount = zones.length;
    const pointRadius = sampleCount > 300 ? 10 : sampleCount > 150 ? 15 : 22;

    zones.forEach(([lng, lat, severity]) => {
      const detail = detailsMap.get(`${lng.toFixed(5)}_${lat.toFixed(5)}`);
      const elevText = detail ? `${detail.elevation.toFixed(2)} m` : 'Calculating...';
      const isSink = detail ? detail.is_local_min : severity >= 0.75;
      const depressionDepth = detail?.depression_depth || 0;
      const slopePercent = detail?.slope_percent;

      // Determine color based on waterlogging severity
      let fillColor = '#10B981'; // Low risk
      let strokeColor = '#059669';

      if (severity >= 0.7) {
        fillColor = '#F43F5E'; // Severe pooling
        strokeColor = '#BE123C';
      } else if (severity >= 0.4) {
        fillColor = '#F59E0B'; // Moderate pooling
        strokeColor = '#D97706';
      } else if (severity >= 0.25) {
        fillColor = '#06B6D4'; // Mild depression
        strokeColor = '#0891B2';
      }

      const circle = L.circle([lat, lng], {
        radius: pointRadius,
        stroke: true,
        weight: 1,
        color: strokeColor,
        opacity: overlayOpacity * 0.8,
        fillColor: fillColor,
        fillOpacity: overlayOpacity * 0.75,
      });

      const riskLabel =
        severity >= 0.7
          ? 'Severe Waterlogging Risk'
          : severity >= 0.4
            ? 'Moderate Waterlogging Risk'
            : 'Low / Normal Runoff';

      circle.bindPopup(`
        <div class="p-1 space-y-1.5 text-xs">
          <div class="font-bold flex items-center gap-1.5 ${severity >= 0.7 ? 'text-rose-400' : severity >= 0.4 ? 'text-amber-400' : 'text-cyan-400'
        }">
            <span class="w-2 h-2 rounded-full inline-block ${severity >= 0.7 ? 'bg-rose-500' : severity >= 0.4 ? 'bg-amber-500' : 'bg-cyan-500'
        }"></span>
            <span>${riskLabel}</span>
          </div>
          <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            <div>Ground Elevation:</div>
            <div class="font-mono font-semibold text-right text-cyan-300">${elevText}</div>
            <div>Risk Severity:</div>
            <div class="font-mono font-semibold text-right">${Math.round(severity * 100)}%</div>
            ${depressionDepth > 0 ? `<div>Depression Depth:</div><div class="font-mono text-rose-300 text-right">-${depressionDepth.toFixed(2)}m</div>` : ''}
            ${slopePercent !== undefined ? `<div>Surface Slope:</div><div class="font-mono text-slate-300 text-right">${slopePercent.toFixed(1)}%</div>` : ''}
            <div>Coordinates:</div>
            <div class="font-mono text-[10px] text-right">${lng.toFixed(5)}, ${lat.toFixed(5)}</div>
          </div>
        </div>
      `);

      heatmapGroup.addLayer(circle);

      // Radar ping marker for critical local minimums (severe sinks)
      if (showSinkMarkers && (isSink || severity >= 0.75)) {
        const pingIcon = L.divIcon({
          className: 'sink-radar-pin',
          html: `
            <div style="position: relative; width: 32px; height: 32px;">
              <div class="sink-ping-ring"></div>
              <div class="sink-core-dot"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const sinkMarker = L.marker([lat, lng], { icon: pingIcon });
        sinkMarker.bindPopup(`
          <div class="p-2 space-y-2 text-xs">
            <div class="font-bold text-rose-400 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>CRITICAL TERRAIN SINK (LOCAL MINIMUM)</span>
            </div>
            <p class="text-[11px] text-slate-300">
              Significant natural basin point where surface runoff accumulates, causing prolonged waterlogging.
            </p>
            <div class="bg-slate-900/80 p-2 rounded border border-rose-500/20 text-[11px] space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-400">Ground Elevation:</span>
                <span class="text-cyan-300 font-bold font-mono">${elevText}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Ponding Probability:</span>
                <span class="text-rose-300 font-bold font-mono">${Math.round(severity * 100)}%</span>
              </div>
              ${depressionDepth > 0 ? `
              <div class="flex justify-between">
                <span class="text-slate-400">Depression Depth:</span>
                <span class="text-amber-300 font-bold font-mono">-${depressionDepth.toFixed(2)}m</span>
              </div>` : ''}
              <div class="flex justify-between">
                <span class="text-slate-400">Position:</span>
                <span class="font-mono text-slate-300">${lng.toFixed(5)}, ${lat.toFixed(5)}</span>
              </div>
            </div>
          </div>
        `);
        sinksGroup.addLayer(sinkMarker);
      }
    });

    const routesGroup = layersRef.current.drainageRoutesLayer;
    if (routesGroup) {
      routesGroup.clearLayers();

      // Render Engineered Drainage Ditch Routes (A* Pathfinding)
      if (analysisData.drainage_routes && analysisData.drainage_routes.length > 0) {
      analysisData.drainage_routes.forEach((route, idx) => {
        const latLngs = route.path_coordinates.map((pt) => [pt[1], pt[0]]);

        // Ditch Polyline with glowing neon styling
        const ditchLine = L.polyline(latLngs, {
          color: '#00F0FF',
          weight: 4,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        });

        ditchLine.bindPopup(`
          <div class="p-2 space-y-2 text-xs">
            <div class="font-bold text-cyan-400 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>ENGINEERED DRAINAGE ROUTE #${idx + 1}</span>
            </div>
            <div class="p-2 rounded bg-slate-900/80 border border-cyan-500/20 text-[11px] space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-400">Total Length:</span>
                <span class="font-mono font-bold text-white">${route.length_meters.toFixed(1)} m</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Elevation Drop (ΔZ):</span>
                <span class="font-mono text-cyan-300 font-bold">${route.elevation_drop_meters.toFixed(2)} m</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Slope Gradient:</span>
                <span class="font-mono text-slate-200">${route.slope_percent.toFixed(2)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Earthwork Cut:</span>
                <span class="font-mono text-amber-300">${route.excavation_volume_m3.toFixed(1)} m³</span>
              </div>
              <div class="flex justify-between border-t border-white/10 pt-1">
                <span class="text-slate-400">Est. Excavation Cost:</span>
                <span class="font-mono text-emerald-400 font-bold">₹${route.estimated_cost_inr.toLocaleString()}</span>
              </div>
            </div>
            <p class="text-[10px] text-cyan-300/80 italic font-mono">
              Design: ${route.recommended_ditch_type}
            </p>
          </div>
        `);

        routesGroup.addLayer(ditchLine);

        // Discharge Outlet marker at the end of the ditch
        const outletCoord = route.outlet_point;
        const outletIcon = L.divIcon({
          className: 'ditch-outlet-pin',
          html: `
            <div style="background: #10B981; width: 14px; height: 14px; border: 2px solid #FFFFFF; border-radius: 3px; box-shadow: 0 0 10px #10B981;" title="Discharge Outlet"></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const outletMarker = L.marker([outletCoord[1], outletCoord[0]], { icon: outletIcon });
        outletMarker.bindPopup(`
          <div class="p-1.5 text-xs space-y-1">
            <div class="font-bold text-emerald-400">DISCHARGE OUTLET #${idx + 1}</div>
            <div class="text-[11px] text-slate-300">Natural field boundary drainage escape point.</div>
          </div>
        `);
        routesGroup.addLayer(outletMarker);
      });
    }
  }
  }, [L, analysisData, overlayOpacity, showSinkMarkers]);

  return (
    <div className="relative w-full h-full">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Basemap Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 glass-panel rounded-xl shadow-xl">
        <button
          onClick={() => setActiveBaseMap('dark')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeBaseMap === 'dark'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Dark
        </button>
        <button
          onClick={() => setActiveBaseMap('satellite')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeBaseMap === 'satellite'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setActiveBaseMap('osm')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeBaseMap === 'osm'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Street
        </button>
      </div>

      {/* In-Map Drawing Notification Bar */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 glass-panel-elevated rounded-full border border-cyan-400/40 shadow-neon-cyan animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-xs font-medium text-cyan-200">
            Click on map to mark field boundary vertices ({coordinates.length} points)
          </span>
          {coordinates.length >= 3 && (
            <button
              onClick={() => setIsDrawing(false)}
              className="ml-2 px-2.5 py-1 text-[11px] bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full transition-colors"
            >
              Finish Polygon
            </button>
          )}
        </div>
      )}
    </div>
  );
};

