'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TerrainAnalysisResponse } from '@/lib/types';
import {
  RotateCcw,
  Maximize2,
  Droplets,
  Layers,
  Sliders,
  Play,
  Pause,
  Box,
  Compass,
} from 'lucide-react';

interface TerrainViewer3DProps {
  analysisData: TerrainAnalysisResponse | null;
}

export const TerrainViewer3D: React.FC<TerrainViewer3DProps> = ({ analysisData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const routesGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [verticalExaggeration, setVerticalExaggeration] = useState(2.5);
  const [waterLevelPercent, setWaterLevelPercent] = useState(25);
  const [isWireframe, setIsWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Mouse interaction state for camera orbit
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 140 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.0035);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight.position.set(80, 120, 60);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const secondaryLight = new THREE.DirectionalLight(0xf59e0b, 0.6);
    secondaryLight.position.set(-60, 80, -60);
    scene.add(secondaryLight);

    // Ditch routes group
    const routesGroup = new THREE.Group();
    scene.add(routesGroup);
    routesGroupRef.current = routesGroup;

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

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        cameraAngleRef.current.theta += 0.003;
      }

      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);

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

  // Update 3D Terrain Geometry, Colors, Water Plane, and Routes
  useEffect(() => {
    if (!sceneRef.current || !analysisData || !analysisData.elevation_grid) return;
    const scene = sceneRef.current;

    // Remove old terrain mesh
    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      (terrainMeshRef.current.material as THREE.Material).dispose();
      terrainMeshRef.current = null;
    }

    // Remove old water mesh
    if (waterMeshRef.current) {
      scene.remove(waterMeshRef.current);
      waterMeshRef.current.geometry.dispose();
      (waterMeshRef.current.material as THREE.Material).dispose();
      waterMeshRef.current = null;
    }

    // Clear old 3D routes
    if (routesGroupRef.current) {
      while (routesGroupRef.current.children.length > 0) {
        const obj = routesGroupRef.current.children[0] as any;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        routesGroupRef.current.remove(obj);
      }
    }

    const grid = analysisData.elevation_grid;
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

    // Color vertices based on normalized elevation
    const colors = new Float32Array(count * 3);
    const colorLow = new THREE.Color(0xf43f5e); // Rose red sink
    const colorMid = new THREE.Color(0x06b6d4); // Cyan valley
    const colorHigh = new THREE.Color(0x10b981); // Emerald ridge

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const zVal = grid[r][c];
        const normalizedZ = (zVal - minZ) / rangeZ; // 0 to 1
        const heightY = (normalizedZ - 0.5) * (rangeZ * 3.5 * (verticalExaggeration / 2.0));

        posAttr.setY(idx, heightY);

        // Vertex color interpolation
        let vertColor: THREE.Color;
        if (normalizedZ < 0.4) {
          vertColor = colorLow.clone().lerp(colorMid, normalizedZ / 0.4);
        } else {
          vertColor = colorMid.clone().lerp(colorHigh, (normalizedZ - 0.4) / 0.6);
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

    // Water Plane Mesh
    const waterLevelNorm = waterLevelPercent / 100.0;
    const waterY = (waterLevelNorm - 0.5) * (rangeZ * 3.5 * (verticalExaggeration / 2.0));

    const waterGeo = new THREE.PlaneGeometry(terrainWidth * 0.98, terrainHeight * 0.98);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = waterY;
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // Render 3D Ditch Route Tubes
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
          const y3d = (normZ - 0.5) * (rangeZ * 3.5 * (verticalExaggeration / 2.0)) + 0.35; // Hover slightly above terrain

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
  }, [analysisData, verticalExaggeration, waterLevelPercent, isWireframe]);

  const resetCamera = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 140 };
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Control Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 p-2 glass-panel rounded-2xl shadow-2xl border border-cyan-500/20 max-w-sm">
        {/* Play/Pause Auto-rotate */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
            autoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
          }`}
          title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Wireframe Toggle */}
        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
            isWireframe ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Wireframe Mesh"
        >
          <Box className="w-3.5 h-3.5" />
        </button>

        {/* Reset Camera */}
        <button
          onClick={resetCamera}
          className="p-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <span className="text-slate-600 text-xs">|</span>

        {/* Relief Exaggeration Slider */}
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="text-slate-400">Relief:</span>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.2"
            value={verticalExaggeration}
            onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value))}
            className="w-16 accent-cyan-400 cursor-pointer h-1 bg-slate-700 rounded"
          />
          <span className="font-mono text-cyan-300 text-[10px] w-6">{verticalExaggeration.toFixed(1)}x</span>
        </div>
      </div>

      {/* Top Center Flow Direction Indicator (Telemetry HUD) */}
      {analysisData?.metrics && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 glass-panel-elevated rounded-full border border-cyan-400/40 shadow-neon-cyan animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Surface Runoff Direction:</span>
            <span className="font-bold text-xs text-cyan-300 font-mono flex items-center gap-1.5">
              <span className="text-cyan-400 font-black text-sm">➔</span>
              {analysisData.metrics.dominant_slope_direction}
            </span>
            <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
              Downhill Flow
            </span>
          </div>
        </div>
      )}

      {/* 3D Visual Mesh Guide Card (Top Right) */}
      <div className="absolute top-4 right-4 z-20 glass-panel-elevated p-3 rounded-2xl border border-cyan-500/30 max-w-xs shadow-2xl backdrop-blur-md hidden md:block">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
          <span className="text-xs font-bold text-white uppercase tracking-wider">3D Mesh Guide</span>
          <span className="text-[10px] text-cyan-300/80 font-mono">Topography</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500 border border-white shrink-0"></span>
            <span className="text-slate-300"><strong className="text-emerald-300">Green: </strong>High Ground Ridge (~{analysisData?.metrics?.max_elevation ?? 465}m)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-500 border border-white shrink-0"></span>
            <span className="text-slate-300"><strong className="text-rose-300">Red: </strong>Low Ponding Basin (~{analysisData?.metrics?.min_elevation ?? 461}m)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1.5 rounded-full bg-cyan-400 shadow-neon-cyan shrink-0"></div>
            <span className="text-slate-300"><strong className="text-cyan-300">Cyan Tubes: </strong>3 Drainage Trench Paths</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500/80 border border-blue-300 shrink-0"></span>
            <span className="text-slate-300"><strong className="text-blue-300">Blue Plane: </strong>Simulated Rainwater Pool</span>
          </div>
        </div>
      </div>

      {/* Floating Water Ponding Level Control (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-20 p-3.5 glass-panel rounded-2xl shadow-2xl border border-white/10 w-72 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Interactive 3D Ponding Level</span>
          </span>
          <span className="font-mono text-[11px] text-blue-300 font-bold">{waterLevelPercent}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="80"
          step="1"
          value={waterLevelPercent}
          onChange={(e) => setWaterLevelPercent(parseInt(e.target.value))}
          className="w-full accent-blue-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        <p className="text-[10px] text-slate-400 italic">
          Simulates rainwater inundation settling into field depressions in real-time 3D space.
        </p>
      </div>

      {/* 3D Navigation Guide Pill (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-20 px-3 py-1.5 glass-panel rounded-full text-[10px] text-slate-400 hidden sm:flex items-center gap-2">
        <span>Left-click + drag to rotate</span>
        <span>•</span>
        <span>Scroll to zoom</span>
      </div>
    </div>
  );
};

