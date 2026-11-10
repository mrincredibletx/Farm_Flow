'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TerrainAnalysisResponse } from '@/lib/types';
import {
  RotateCcw,
  Play,
  Pause,
  Box,
  Compass,
  Map as MapIcon,
  CloudRain,
  Sliders,
  CheckCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TerrainViewer3DProps {
  analysisData: TerrainAnalysisResponse | null;
  onBackToMap?: () => void;
}

export const TerrainViewer3D: React.FC<TerrainViewer3DProps> = ({
  analysisData,
  onBackToMap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const routesGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Simulation Controls (CutSheetRx Style)
  const [terrainMode, setTerrainMode] = useState<'existing' | 'design'>('existing');
  const [isRaining, setIsRaining] = useState(false);
  const [simTimeSeconds, setSimTimeSeconds] = useState(0);
  const [rainRateMmHr, setRainRateMmHr] = useState(45); // mm per hour
  const [verticalExaggeration, setVerticalExaggeration] = useState(4.0);
  const [simSpeed, setSimSpeed] = useState<number>(1.0); // 0.5, 1.0, 2.5
  const [isWireframe, setIsWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  // Mouse interaction state for camera orbit
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 140 });

  // 1. Setup Three.js Scene, Camera, Renderer, Rain, Lighting
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.0035);
    sceneRef.current = scene;

    // Camera setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight.position.set(80, 120, 60);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const secondaryLight = new THREE.DirectionalLight(0x10b981, 0.6);
    secondaryLight.position.set(-60, 80, -60);
    scene.add(secondaryLight);

    // Ditch routes group
    const routesGroup = new THREE.Group();
    scene.add(routesGroup);
    routesGroupRef.current = routesGroup;

    // Rain Particle System
    const rainCount = 1800;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 120;
      rainPositions[i * 3 + 1] = Math.random() * 80;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.75,
      transparent: true,
      opacity: 0.0, // hidden until isRaining is true
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    scene.add(rainParticles);
    rainParticlesRef.current = rainParticles;

    // Mouse drag controls
    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2.05, cameraAngleRef.current.phi - deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(
        40,
        Math.min(300, cameraAngleRef.current.radius + e.deltaY * 0.1)
      );
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Handle window resize
    const onResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        cameraAngleRef.current.theta += 0.002;
      }

      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);

      // Animate Rain Particles
      if (rainParticlesRef.current && (rainParticlesRef.current.material as THREE.PointsMaterial).opacity > 0) {
        const positions = rainParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < rainCount; i++) {
          positions[i * 3 + 1] -= 2.2; // Fall speed
          if (positions[i * 3 + 1] < -15) {
            positions[i * 3 + 1] = 65; // Reset to clouds
          }
        }
        rainParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Dynamic Rain Physics & Simulation Clock
  useEffect(() => {
    let interval: any;
    if (isRaining) {
      if (rainParticlesRef.current) {
        (rainParticlesRef.current.material as THREE.PointsMaterial).opacity = 0.75;
      }
      interval = setInterval(() => {
        setSimTimeSeconds((prev) => prev + 1 * simSpeed);
      }, 1000 / Math.max(simSpeed, 0.5));
    } else {
      if (rainParticlesRef.current) {
        (rainParticlesRef.current.material as THREE.PointsMaterial).opacity = 0.0;
      }
    }
    return () => clearInterval(interval);
  }, [isRaining, simSpeed]);

  // Total accumulated rain in mm
  const totalFallenMm = Math.round((rainRateMmHr / 3600) * simTimeSeconds * 60 * 10) / 10;

  // 3. Update 3D Terrain Geometry, Colors, Water Puddle Physics, and Routes
  useEffect(() => {
    if (!sceneRef.current || !analysisData || !analysisData.elevation_grid) return;
    const scene = sceneRef.current;

    // Clear old meshes
    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      (terrainMeshRef.current.material as THREE.Material).dispose();
      terrainMeshRef.current = null;
    }
    if (waterMeshRef.current) {
      scene.remove(waterMeshRef.current);
      waterMeshRef.current.geometry.dispose();
      (waterMeshRef.current.material as THREE.Material).dispose();
      waterMeshRef.current = null;
    }
    if (routesGroupRef.current) {
      while (routesGroupRef.current.children.length > 0) {
        const obj = routesGroupRef.current.children[0] as any;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        routesGroupRef.current.remove(obj);
      }
    }

    // Grid selection: Existing Terrain vs Design Graded Plane
    const grid =
      terrainMode === 'design' && analysisData.cut_fill_analysis?.design_elevation_grid
        ? analysisData.cut_fill_analysis.design_elevation_grid
        : analysisData.elevation_grid;

    const rows = grid.length;
    const cols = grid[0].length;
    const terrainWidth = 80;
    const terrainHeight = 80;

    const geometry = new THREE.PlaneGeometry(terrainWidth, terrainHeight, cols - 1, rows - 1);
    geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const metrics = analysisData.metrics;
    const minZ = metrics?.min_elevation ?? Math.min(...grid.flat());
    const maxZ = metrics?.max_elevation ?? Math.max(...grid.flat());
    const rangeZ = Math.max(maxZ - minZ, 0.01);

    const posAttr = geometry.attributes.position;
    const count = posAttr.count;

    const colors = new Float32Array(count * 3);
    const colorLow = new THREE.Color(0xf43f5e); // Rose red sink
    const colorMid = new THREE.Color(0x06b6d4); // Cyan valley
    const colorHigh = new THREE.Color(0x10b981); // Emerald ridge

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const zVal = grid[r][c];
        const normalizedZ = (zVal - minZ) / rangeZ;
        const heightY = (normalizedZ - 0.5) * (rangeZ * 3.5 * (verticalExaggeration / 2.0));

        posAttr.setY(idx, heightY);

        let vertColor: THREE.Color;
        if (terrainMode === 'design') {
          // Smooth graded emerald tint
          vertColor = colorMid.clone().lerp(colorHigh, normalizedZ);
        } else {
          if (normalizedZ < 0.4) {
            vertColor = colorLow.clone().lerp(colorMid, normalizedZ / 0.4);
          } else {
            vertColor = colorMid.clone().lerp(colorHigh, (normalizedZ - 0.4) / 0.6);
          }
        }

        colors[idx * 3] = vertColor.r;
        colors[idx * 3 + 1] = vertColor.g;
        colors[idx * 3 + 2] = vertColor.b;

        idx++;
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe: isWireframe,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 4. Dynamic Water Plane Mesh (Rises as rain falls!)
    // In design graded mode, water flows away cleanly so ponding stays near zero
    const maxWaterPoolHeight = terrainMode === 'design' ? 0.05 : 0.45;
    const rainNormalized = Math.min(totalFallenMm / 100.0, 1.0);
    const waterLevelNorm = Math.min(maxWaterPoolHeight * rainNormalized, maxWaterPoolHeight);
    const waterY = (waterLevelNorm - 0.5) * (rangeZ * 3.5 * (verticalExaggeration / 2.0));

    if (totalFallenMm > 0.5) {
      const waterGeo = new THREE.PlaneGeometry(terrainWidth * 0.98, terrainHeight * 0.98);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: Math.min(0.75, 0.35 + rainNormalized * 0.4),
        roughness: 0.1,
        metalness: 0.85,
        side: THREE.DoubleSide,
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.y = waterY;
      scene.add(waterMesh);
      waterMeshRef.current = waterMesh;
    }

    // 5. Render 3D Ditch Route Tubes
    if (routesGroupRef.current && analysisData.drainage_routes) {
      const bbox = analysisData.bounding_box;
      const spanLng = bbox.max_lng - bbox.min_lng || 1;
      const spanLat = bbox.max_lat - bbox.min_lat || 1;

      analysisData.drainage_routes.forEach((route) => {
        const points3D: THREE.Vector3[] = [];

        route.path_coordinates.forEach(([lng, lat], i) => {
          const u = (lng - bbox.min_lng) / spanLng;
          const v = (lat - bbox.min_lat) / spanLat;

          const x3d = (u - 0.5) * terrainWidth;
          const z3d = -(v - 0.5) * terrainHeight;

          const pZ = route.path_elevations[i] ?? minZ;
          const normZ = (pZ - minZ) / rangeZ;
          const y3d = (normZ - 0.5) * (rangeZ * 3.5 * (verticalExaggeration / 2.0)) + 0.35;

          points3D.push(new THREE.Vector3(x3d, y3d, z3d));
        });

        if (points3D.length >= 2) {
          const curve = new THREE.CatmullRomCurve3(points3D);
          const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.65, 8, false);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.8,
            roughness: 0.2,
          });
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          routesGroupRef.current!.add(tubeMesh);
        }
      });
    }
  }, [analysisData, terrainMode, verticalExaggeration, totalFallenMm, isWireframe]);

  const resetSimulation = () => {
    setIsRaining(false);
    setSimTimeSeconds(0);
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 140 };
  };

  const minutes = Math.floor(simTimeSeconds / 60);
  const seconds = Math.floor(simTimeSeconds % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Navigation Header (CutSheetRx `< Map` button) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {onBackToMap && (
          <button
            onClick={onBackToMap}
            className="flex items-center gap-1.5 px-3.5 py-2 glass-panel-elevated rounded-2xl border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-500/20 text-xs font-bold shadow-2xl transition-all"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>&lt; Back to 2D Map</span>
          </button>
        )}

        {/* Existing vs Design Mode Toggle (CutSheetRx Frame 4) */}
        <div className="flex items-center p-1 glass-panel rounded-2xl border border-white/10 shadow-xl">
          <button
            onClick={() => setTerrainMode('existing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              terrainMode === 'existing'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Existing Field
          </button>
          <button
            onClick={() => setTerrainMode('design')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              terrainMode === 'design'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Design Graded (Level)
          </button>
        </div>
      </div>

      {/* Watershed Divide Notice in 3D */}
      {analysisData?.metrics?.is_watershed_divide && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 glass-panel-elevated rounded-full border border-cyan-400/50 shadow-2xl text-xs font-semibold text-cyan-300 flex items-center gap-2 backdrop-blur-md">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          <span>
            Mountain Ridge: Dual Outflow ({analysisData.metrics.major_flow_directions?.join(' & ')})
          </span>
        </div>
      )}

      {/* Top Right Live Simulation Telemetry HUD (CutSheetRx Frame 4 & 5) */}
      <div className="absolute top-4 right-4 z-20 glass-panel-elevated p-3.5 rounded-2xl border border-cyan-500/30 shadow-2xl backdrop-blur-md max-w-xs space-y-1.5 text-xs">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <CloudRain className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Rainfall Inundation Telemetry</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
            {formattedTime}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="text-slate-400 text-[10px]">Precipitation:</div>
            <div className="font-mono font-black text-cyan-300 text-sm">{totalFallenMm} mm</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="text-slate-400 text-[10px]">Deepest Pooling:</div>
            <div className="font-mono font-black text-rose-400 text-sm">
              {terrainMode === 'design'
                ? '0.0 cm'
                : `${Math.round(totalFallenMm * 0.42 * 10) / 10} cm`}
            </div>
          </div>
        </div>

        <div className="pt-1 text-[10px] text-slate-400 flex justify-between">
          <span>
            {terrainMode === 'design'
              ? '✅ Uniform runoff draining through boundary'
              : '⚠️ Pooling trapped in critical low basins'}
          </span>
        </div>
      </div>

      {/* Bottom Left Floating Rain Simulator Panel (CutSheetRx Frame 4) */}
      <div className="absolute bottom-6 left-4 z-20 p-4 glass-panel-elevated rounded-3xl border border-cyan-500/30 shadow-2xl backdrop-blur-xl w-80 space-y-3">
        {/* Play / Pause / Reset Button Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRaining(!isRaining)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              isRaining
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
            }`}
          >
            {isRaining ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRaining ? 'Pause Rain' : 'Start Rain'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="p-2 rounded-xl glass-panel hover:bg-white/10 text-slate-300 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-2 rounded-xl transition-all ${
              isWireframe ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'glass-panel text-slate-400'
            }`}
            title="Toggle Wireframe Mesh"
          >
            <Box className="w-4 h-4" />
          </button>
        </div>

        {/* Rain Intensity Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="text-slate-400">Rain Intensity:</span>
            <span className="font-mono text-cyan-300 font-bold">{rainRateMmHr} mm/hr</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={rainRateMmHr}
            onChange={(e) => setRainRateMmHr(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Height Stretch / Relief Exaggeration Slider (CutSheetRx Frame 4) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="text-slate-400">Height Stretch (Relief):</span>
            <span className="font-mono text-cyan-300 font-bold">{verticalExaggeration.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="15.0"
            step="0.5"
            value={verticalExaggeration}
            onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Simulation Speed Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
          <span className="text-slate-400">Sim Speed:</span>
          <div className="flex items-center gap-1.5">
            {[0.5, 1.0, 2.5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded-lg font-mono text-[10px] transition-all ${
                  simSpeed === speed
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orbit Navigation Helper Hint (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-20 px-3.5 py-1.5 glass-panel rounded-full text-[10px] text-slate-400 hidden sm:flex items-center gap-2">
        <span>Left-click + Drag to orbit</span>
        <span>•</span>
        <span>Scroll to zoom</span>
      </div>
    </div>
  );
};
