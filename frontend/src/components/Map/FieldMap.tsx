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
    flowArrowsLayer: any;
  }>({
    tileLayer: null,
    polygonLayer: null,
    vertexMarkers: [],
    heatmapLayer: null,
    sinkMarkersLayer: null,
    drainageRoutesLayer: null,
    flowArrowsLayer: null,
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
    layersRef.current.flowArrowsLayer = L.layerGroup().addTo(map);

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

  // Compute dominant flow aspect angle for UI badge
  const aspectAngle = React.useMemo(() => {
    if (!analysisData?.metrics) return 90;
    if (analysisData.metrics.dominant_aspect_degrees !== undefined) {
      return analysisData.metrics.dominant_aspect_degrees;
    }
    const match = analysisData.metrics.dominant_slope_direction?.match(/\(([\d.]+)°\)/);
    return match ? parseFloat(match[1]) : 90;
  }, [analysisData]);

  // Render 2D Heatmap, Waterlogging Zones, Primary Sinks, Drainage Ditches, and Flow Arrows
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const heatmapGroup = layersRef.current.heatmapLayer;
    const sinksGroup = layersRef.current.sinkMarkersLayer;
    const routesGroup = layersRef.current.drainageRoutesLayer;
    const flowArrowsGroup = layersRef.current.flowArrowsLayer;

    heatmapGroup?.clearLayers();
    sinksGroup?.clearLayers();
    routesGroup?.clearLayers();
    flowArrowsGroup?.clearLayers();

    if (!analysisData || !analysisData.waterlogging_zones) return;

    const zones = analysisData.waterlogging_zones; // [[lng, lat, severity], ...]
    const detailsMap = new Map<string, any>();
    if (analysisData.zone_details) {
      analysisData.zone_details.forEach((d) => {
        detailsMap.set(`${d.lng.toFixed(5)}_${d.lat.toFixed(5)}`, d);
      });
    }

    // 1. Render continuous translucent heatmap overlay (no heavy borders)
    const sampleCount = zones.length;
    const pointRadius = sampleCount > 300 ? 10 : sampleCount > 150 ? 14 : 20;

    zones.forEach(([lng, lat, severity]) => {
      const detail = detailsMap.get(`${lng.toFixed(5)}_${lat.toFixed(5)}`);
      const elevText = detail ? `${detail.elevation.toFixed(2)} m` : 'Calculating...';
      const depressionDepth = detail?.depression_depth || 0;
      const slopePercent = detail?.slope_percent;

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
        weight: 0.5,
        color: strokeColor,
        opacity: overlayOpacity * 0.25,
        fillColor: fillColor,
        fillOpacity: overlayOpacity * 0.45,
      });

      const riskLabel =
        severity >= 0.7
          ? 'Severe Waterlogging Risk (Ponding Basin)'
          : severity >= 0.4
            ? 'Moderate Waterlogging Risk'
            : 'Low / Safe Drainage';

      circle.bindPopup(`
        <div class="p-1 space-y-1.5 text-xs">
          <div class="font-bold flex items-center gap-1.5 ${
            severity >= 0.7 ? 'text-rose-400' : severity >= 0.4 ? 'text-amber-400' : 'text-cyan-400'
          }">
            <span class="w-2 h-2 rounded-full inline-block ${
              severity >= 0.7 ? 'bg-rose-500' : severity >= 0.4 ? 'bg-amber-500' : 'bg-cyan-500'
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
    });

    // 2. Render Top Primary Critical Sinks with clear, labeled focal pins (De-cluttered)
    if (showSinkMarkers) {
      const primarySinks: { lng: number; lat: number; depth: number; elev: string; sev: number }[] = [];

      // Prefer start coordinates of engineered drainage routes as primary focal sinks
      if (analysisData.drainage_routes && analysisData.drainage_routes.length > 0) {
        analysisData.drainage_routes.forEach((r) => {
          const detail = detailsMap.get(`${r.sink_point[0].toFixed(5)}_${r.sink_point[1].toFixed(5)}`);
          primarySinks.push({
            lng: r.sink_point[0],
            lat: r.sink_point[1],
            depth: detail?.depression_depth || 0.45,
            elev: detail ? `${detail.elevation.toFixed(2)} m` : '461.0 m',
            sev: r.severity || 0.85,
          });
        });
      } else {
        // Fallback: top 3 highest severity points
        const sorted = [...zones].sort((a, b) => b[2] - a[2]).slice(0, 3);
        sorted.forEach(([lng, lat, sev]) => {
          const detail = detailsMap.get(`${lng.toFixed(5)}_${lat.toFixed(5)}`);
          primarySinks.push({
            lng,
            lat,
            depth: detail?.depression_depth || 0.35,
            elev: detail ? `${detail.elevation.toFixed(2)} m` : 'Calculating...',
            sev,
          });
        });
      }

      primarySinks.forEach((sink, idx) => {
        const pingIcon = L.divIcon({
          className: 'sink-radar-pin',
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
              <div class="sink-ping-ring" style="width: 36px; height: 36px;"></div>
              <div class="sink-core-dot" style="width: 14px; height: 14px; background: #F43F5E; border: 2px solid #FFFFFF; box-shadow: 0 0 12px #F43F5E;"></div>
              <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(15,23,42,0.92); border: 1px solid #F43F5E; color: #FDA4AF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
                🔴 Sink #${idx + 1}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const sinkMarker = L.marker([sink.lat, sink.lng], { icon: pingIcon });
        sinkMarker.bindPopup(`
          <div class="p-2 space-y-2 text-xs">
            <div class="font-bold text-rose-400 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>PRIMARY PONDING SINK #${idx + 1}</span>
            </div>
            <p class="text-[11px] text-slate-300">
              Low-lying basin depression where rainwater naturally pools and cannot drain away.
            </p>
            <div class="bg-slate-900/80 p-2 rounded border border-rose-500/20 text-[11px] space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-400">Ground Elevation:</span>
                <span class="text-cyan-300 font-bold font-mono">${sink.elev}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Waterlogging Probability:</span>
                <span class="text-rose-300 font-bold font-mono">${Math.round(sink.sev * 100)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Depression Depth:</span>
                <span class="text-amber-300 font-bold font-mono">-${sink.depth.toFixed(2)}m</span>
              </div>
            </div>
          </div>
        `);
        sinksGroup.addLayer(sinkMarker);
      });
    }

    // 3. Render Engineered Drainage Ditch Routes (A* Pathfinding) with on-line labels
    if (routesGroup && analysisData.drainage_routes && analysisData.drainage_routes.length > 0) {
      analysisData.drainage_routes.forEach((route, idx) => {
        const latLngs = route.path_coordinates.map((pt) => [pt[1], pt[0]]);

        const ditchLine = L.polyline(latLngs, {
          color: '#00F0FF',
          weight: 4.5,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Permanent on-line label badge
        ditchLine.bindTooltip(`💧 Ditch #${idx + 1} (${route.length_meters.toFixed(0)}m)`, {
          permanent: true,
          direction: 'center',
          className: 'ditch-label-tooltip',
        });

        ditchLine.bindPopup(`
          <div class="p-2 space-y-2 text-xs">
            <div class="font-bold text-cyan-400 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>ENGINEERED DRAINAGE DITCH #${idx + 1}</span>
            </div>
            <p class="text-[11px] text-slate-300">
              Excavate this trench path from the waterlogged sink to the safe boundary outlet to drain surface water by gravity.
            </p>
            <div class="p-2 rounded bg-slate-900/80 border border-cyan-500/20 text-[11px] space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-400">Trench Length:</span>
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
                <span class="text-slate-400">Excavation Volume:</span>
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
            <div style="background: #10B981; width: 16px; height: 16px; border: 2px solid #FFFFFF; border-radius: 4px; box-shadow: 0 0 12px #10B981; display: flex; align-items: center; justify-content: center;" title="Discharge Outlet">
              <div style="width: 6px; height: 6px; background: white; border-radius: 1px;"></div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const outletMarker = L.marker([outletCoord[1], outletCoord[0]], { icon: outletIcon });
        outletMarker.bindTooltip(`🟢 Outlet #${idx + 1}`, {
          permanent: true,
          direction: 'top',
          className: 'outlet-label-tooltip',
        });
        outletMarker.bindPopup(`
          <div class="p-2 text-xs space-y-1">
            <div class="font-bold text-emerald-400">DISCHARGE OUTLET #${idx + 1}</div>
            <div class="text-[11px] text-slate-300">
              Safe natural field boundary exit point where trench water discharges into surrounding drains or swales.
            </div>
          </div>
        `);
        routesGroup.addLayer(outletMarker);
      });
    }

    // 4. Render Local Downhill Water Runoff Flow Direction Vectors (Multi-directional)
    if (flowArrowsGroup && analysisData.bounding_box) {
      flowArrowsGroup.clearLayers();

      const vectors = analysisData.flow_vectors || [];
      const bbox = analysisData.bounding_box;
      const spanLng = bbox.max_lng - bbox.min_lng;

      if (vectors.length > 0) {
        // Multi-directional local flow vector field across mountain / undulating terrain
        const arrowLen = Math.max(spanLng * 0.045, 0.00025);

        vectors.forEach((vec) => {
          // Flow direction angle (0=N, 90=E, 180=S, 270=W)
          const rad = (90 - vec.direction_deg) * (Math.PI / 180);
          const dx = Math.cos(rad) * arrowLen;
          const dy = Math.sin(rad) * arrowLen;

          const startLat = vec.lat - dy * 0.45;
          const startLng = vec.lng - dx * 0.45;
          const endLat = vec.lat + dy * 0.55;
          const endLng = vec.lng + dx * 0.55;

          // Glowing cyan polyline shaft
          const arrowShaft = L.polyline([[startLat, startLng], [endLat, endLng]], {
            color: '#00F0FF',
            weight: 2.2,
            opacity: 0.85,
            dashArray: '3, 3',
          });

          // Arrowhead marker rotated in exact local flow direction
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

          const tooltipHtml = `
            <div class="text-[11px] p-1 font-sans space-y-0.5">
              <div class="font-bold text-cyan-300">Runoff Flow: ${vec.cardinal_direction} (${vec.direction_deg.toFixed(1)}°)</div>
              <div class="text-slate-300 text-[10px]">Elevation: <strong class="text-white">${vec.elevation.toFixed(1)}m</strong> | Slope: <strong class="text-amber-300">${vec.slope_percent.toFixed(1)}%</strong></div>
            </div>
          `;
          arrowShaft.bindTooltip(tooltipHtml);
          headMarker.bindTooltip(tooltipHtml);

          flowArrowsGroup.addLayer(arrowShaft);
          flowArrowsGroup.addLayer(headMarker);
        });
      } else if (analysisData.metrics) {
        // Fallback global arrows if no vector field provided
        let deg = analysisData.metrics.dominant_aspect_degrees ?? 90;
        if (analysisData.metrics.dominant_slope_direction) {
          const match = analysisData.metrics.dominant_slope_direction.match(/\(([\d.]+)°\)/);
          if (match) deg = parseFloat(match[1]);
        }

        const centerLng = (bbox.min_lng + bbox.max_lng) / 2;
        const centerLat = (bbox.min_lat + bbox.max_lat) / 2;
        const spanLat = bbox.max_lat - bbox.min_lat;
        const rad = (90 - deg) * (Math.PI / 180);
        const dirLng = Math.cos(rad);
        const dirLat = Math.sin(rad);

        const offsets = [-0.25, 0.0, 0.25];
        const perpLng = -dirLat;
        const perpLat = dirLng;

        offsets.forEach((off) => {
          const startLng = centerLng + off * spanLng * 0.7 * perpLng - dirLng * spanLng * 0.28;
          const startLat = centerLat + off * spanLat * 0.7 * perpLat - dirLat * spanLat * 0.28;
          const endLng = centerLng + off * spanLng * 0.7 * perpLng + dirLng * spanLng * 0.28;
          const endLat = centerLat + off * spanLat * 0.7 * perpLat + dirLat * spanLat * 0.28;

          const arrowLine = L.polyline([[startLat, startLng], [endLat, endLng]], {
            color: '#38BDF8',
            weight: 2.5,
            opacity: 0.8,
            dashArray: '5, 5',
          });
          flowArrowsGroup.addLayer(arrowLine);

          const arrowHeadIcon = L.divIcon({
            className: 'flow-arrow-marker',
            html: `
              <div style="transform: rotate(${deg - 90}deg); color: #38BDF8; font-size: 18px; font-weight: 900; filter: drop-shadow(0 0 6px #0284c7); line-height: 1;">
                ➔
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          const arrowHeadMarker = L.marker([endLat, endLng], { icon: arrowHeadIcon });
          flowArrowsGroup.addLayer(arrowHeadMarker);
        });
      }
    }
  }, [L, analysisData, overlayOpacity, showSinkMarkers]);

  return (
    <div className="relative w-full h-full">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Center Flow Direction Indicator (Telemetry HUD) */}
      {analysisData?.metrics && !isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 glass-panel-elevated rounded-full border border-cyan-400/40 shadow-neon-cyan animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            {analysisData.metrics.is_watershed_divide ? (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <span className="text-sm">⛰️</span>
                  <span>Watershed Divide:</span>
                </span>
                <span className="font-bold text-xs text-cyan-300 font-mono">
                  {analysisData.metrics.major_flow_directions?.join(' & ') || analysisData.metrics.dominant_slope_direction}
                </span>
                <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-semibold shadow-sm">
                  Dual Opposing Flow (2 Flanks)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400/50 shadow-sm">
                  <span
                    style={{
                      display: 'inline-block',
                      transform: `rotate(${aspectAngle - 90}deg)`,
                      transition: 'transform 0.5s ease',
                    }}
                    className="text-cyan-400 font-black text-xs"
                  >
                    ➔
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400">Surface Runoff Direction: </span>
                  <span className="font-bold text-cyan-300 font-mono">
                    {analysisData.metrics.dominant_slope_direction}
                  </span>
                  <span className="text-cyan-400 font-medium ml-1.5">(Downhill ➔)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Floating Map Visual Guide & Legend Card */}
      {analysisData && (
        <div className="absolute bottom-6 left-6 z-20 glass-panel-elevated p-3.5 rounded-2xl border border-cyan-500/30 max-w-xs shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-neon-cyan"></span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Map Visual Guide</h4>
            </div>
            <span className="text-[10px] text-cyan-300/80 font-mono font-medium">How To Read</span>
          </div>

          <div className="space-y-2 text-[11px]">
            {analysisData.metrics?.is_watershed_divide && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10.5px] space-y-1 mb-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⛰️ Mountain Ridge Watershed Divide</span>
                </div>
                <p className="text-slate-300 leading-tight">
                  Polygon traverses a mountain ridge crest. Water divides naturally into two opposing flow sides (West flank vs East flank) as shown by the diverging local flow vectors.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shadow-sm shrink-0"></span>
              <div>
                <span className="font-semibold text-rose-300">Red Sinks: </span>
                <span className="text-slate-300">Depression where rainwater traps & pools</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-white shadow-sm shrink-0"></span>
              <div>
                <span className="font-semibold text-emerald-300">Green Square: </span>
                <span className="text-slate-300">Field Outlet (Where water leaves your land)</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-1 bg-cyan-400 border-t border-b border-dashed border-cyan-200 shrink-0"></div>
              <div>
                <span className="font-semibold text-cyan-300">Cyan Dashed Line: </span>
                <span className="text-slate-300">Trench to Dig (Recommended drainage ditch)</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-cyan-400 font-bold shrink-0 text-sm leading-none">➔</span>
              <div>
                <span className="font-semibold text-cyan-300">Local Flow Vectors: </span>
                <span className="text-slate-300">Exact downhill direction at each point (shows both mountain sides)</span>
              </div>
            </div>
          </div>
        </div>
      )}

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

