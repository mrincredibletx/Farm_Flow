# Smart Agricultural Drainage & Precision Land Grading System
## Cinematic Demonstration & Technical Production Report

**Institution:** University of Engineering & Management (UEM), Jaipur  
**Department:** Department of Computer Science & Engineering  
**Academic Session:** 2023–2027 (Final-Year B.Tech Capstone Project)  
**Authors:** Rakesh Bangra (`12023002001100`) & Sampat Singh Sekhawat (`12023002001124`)  
**Supervisors:** Prof. Soumya Sen (Project Guide) & Prof. Dr. G Uma Devi (HOD & Dean of Engineering)  
**Production Date:** November 2026  

---

### Executive Summary

This production report documents the end-to-end inspection, execution, screen recording, 3D visualization, audio engineering, and video compilation for the capstone project **"Smart Agricultural Drainage & Precision Land Grading System"**.

Rather than relying on generic mockups or slide-based presentations, this production combines:
1. **Genuine Application Screen Recordings** captured live at `1920x1080` resolution from the active Next.js 14 / Three.js frontend and FastAPI backend.
2. **Procedural 3D Terrain & Drone Hydrology Visualizations** demonstrating digital elevation models, Gaussian spatial smoothing, Laplacian sinkhole detection, and heuristic A* gravitational trenching.
3. **Professional Documentary-Grade Voiceover** rendered using Microsoft Azure Neural TTS (`en-US-ChristopherNeural`) with deliberate, authoritative cadence and synchronized subtitles (`.srt`).
4. **Cinematic Storyboard & Technical Architecture Animations** illustrating the complete 5-tier decoupled data flow from Copernicus DEM / Open-Meteo ingestion down to Google Gemini AI agronomic synthesis.

---

### Phase 1: Full System Inspection & Implemented Feature Roster

| Module / Layer | Implementation File(s) | Verified Working Capabilities |
| :--- | :--- | :--- |
| **Topographic Ingestion** | `backend/app/services/elevation_service.py` | Bounding box computation, 20x20 regular grid mesh, Shapely polygon masking, 4-tier elevation fallback (Google Maps, Open-Meteo, Open-Elevation, Synthetic Regional Slope). |
| **NumPy Hydrology Engine** | `backend/app/services/hydrology_service.py` | 2D Sobel gradient, aspect flow vectors, Gaussian spatial filtering ($\sigma=1.0$), Laplacian topographic curvature, localized depression sink classification, watershed divide detection. |
| **Multi-Catchment A\* Ditching** | `backend/app/services/routing_service.py` | Heuristic A\* search optimizing downhill hydraulic slope ($S_0 \ge 0.2\%$), boundary outlet identification, excavation depth minimization, multi-sink drainage network synthesis. |
| **Precision Land Leveling** | `backend/app/services/cut_fill_service.py` | Least-squares planar grade calculation, cut volume ($V_{cut}$), fill volume ($V_{fill}$), compaction ratio balancing ($R=1.20$), earthwork contractor cost estimation, 2-point transect cross-section sampling. |
| **SCS-CN Runoff Kinetics** | `backend/app/services/risk_ml_service.py` | USDA SCS Curve Number precipitation modeling, soil hydrologic group mapping (Clay, Loam, Sand), dynamic runoff volume ($Q$), time-to-saturation curves ($T_{sat}$). |
| **3D WebGL Inundation Engine** | `frontend/src/components/Terrain3D/TerrainViewer3D.tsx` | Interactive Three.js heightfield mesh, elevation hypsometric color ramp, dynamic rain particle system (1800 drops), real-time ponding water shader, 3D glowing cyan A\* trench tubes, existing vs design grading toggle. |
| **2D GIS Map & HUD** | `frontend/src/components/Map/FieldMap.tsx` | Leaflet satellite imagery, user-drawn polygon boundaries, risk contour heatmap, critical radar sink indicators, outlet pins, dashed runoff vectors, live GPS recentering. |
| **Generative Agronomic AI** | `backend/app/services/advisory_service.py` | Gemini LLM integration with ICAR (Indian Council of Agricultural Research) agronomic prompting, soil remediation advice, crop vulnerability warnings, French drain / tile drain recommendations. |
| **PDF Reporting Engine** | `frontend/src/lib/pdfExport.ts` | Client-side vector PDF generation (`jspdf`, `jspdf-autotable`) summarizing topographic metrics, bill of materials, and engineering advisories. |

---

### Phase 2: Production Setup & Tooling Specifications

| Tool / Technology | Version / Specification | Role in Production |
| :--- | :--- | :--- |
| **FFmpeg & FFprobe** | `9.0.2-full_build` (gyan.dev) | Video concatenation, audio ducking, sub-pixel rendering, MP4 muxing, stream validation. |
| **Hardware Video Encoding** | NVIDIA GeForce GTX 1650 (`NVENC` / `libx264`) | High-throughput 1080p 60fps video rendering with zero dropped frames. |
| **Playwright Automation** | `1.65.2` (Chromium v1255) | Automated headless high-resolution browser interaction and screen capture of the live running application. |
| **Microsoft Edge Neural TTS** | `edge-tts 7.3.1` (`en-US-ChristopherNeural`) | Natural, resonant documentary-style narration with custom cadence and pitch modulation. |
| **ReportLab Engine** | `5.1.0` | Automated generation of the formal landscape storyboard document (`Project_Storyboard.pdf`). |
| **Python Ecosystem** | `Python 3.10.11`, `NumPy 2.2`, `OpenCV 5.0`, `Pillow 12.3`, `SciPy 1.15` | Procedural graphics generation, HUD overlay composite rendering, mathematical modeling. |

---

### Phase 3: Deliverables Inventory

1. [**`Final_Project_Advertisement.mp4`**](file:///c:/Users/rkban/OneDrive/Desktop/sem%207/PROJECT/video_production/output/Final_Project_Advertisement.mp4)
   - **Type:** Master 1080p Cinematic Product Launch & Advertisement.
   - **Duration:** 3 Minutes 28 Seconds (~208 seconds).
   - **Resolution:** 1920 × 1080 (16:9 Landscape), 60 FPS.
   - **Audio:** 48 kHz Stereo with synchronized documentary narration, ambient orchestral music, and dynamic audio ducking.
   - **Content:** Complete 7-scene narrative journey from real-world problem to digital twin, 3D drone inspection, live UI recording, technical architecture, and impact outro.

2. [**`Project_Demonstration.mp4`**](file:///c:/Users/rkban/OneDrive/Desktop/sem%207/PROJECT/video_production/output/Project_Demonstration.mp4)
   - **Type:** Extended Technical Application Demonstration.
   - **Duration:** ~1 Minute 30 Seconds.
   - **Resolution:** 1920 × 1080 (16:9 Landscape), 60 FPS.
   - **Content:** Uncut, genuine screen recording of the active system: polygon drawing, NumPy terrain calculation, 2D GIS visualization, A* ditch routing, Cut/Fill earthwork balancing, ML risk simulation, Gemini AI advisory, 3D WebGL inundation, and PDF report export.

3. [**`Project_Voiceover.mp3`**](file:///c:/Users/rkban/OneDrive/Desktop/sem%207/PROJECT/video_production/output/Project_Voiceover.mp3)
   - **Type:** Master Narration Audio Track.
   - **Duration:** 3 Minutes 28 Seconds.
   - **Codec:** MP3, 24 kHz, 48 kbps CBR mono with natural acoustic presence.

4. [**`Project_Subtitles.srt`**](file:///c:/Users/rkban/OneDrive/Desktop/sem%207/PROJECT/video_production/output/Project_Subtitles.srt)
   - **Type:** SubRip Synchronized English Subtitles.
   - **Count:** 42 accurately timed subtitle cues synchronized to the voiceover audio.

5. [**`Project_Storyboard.pdf`**](file:///c:/Users/rkban/OneDrive/Desktop/sem%207/PROJECT/video_production/output/Project_Storyboard.pdf)
   - **Type:** Official 7-Scene Technical Storyboard Document.
   - **Format:** Landscape Letter PDF with complete visual directions, camera choreography, HUD overlays, audio narration, and technical stacks.

6. [**`Production_Report.md`**](file:///c:/Users/rkban/OneDrive/Desktop/sem%207/PROJECT/video_production/output/Production_Report.md)
   - **Type:** Comprehensive engineering documentation of the production pipeline (this document).

---

### Technical Limitations & Honest Boundaries

1. **Elevation DEM Resolution:** The production faithfully illustrates digital elevation models. In the live system, regional satellite DEMs typically provide 30-meter ground sample distances. While the system applies Gaussian spatial smoothing ($\sigma=1.0$) and regional slope enhancement to eliminate staircase artifacts, millimeter-precision micro-relief grading in production farming would benefit from RTK-GPS or UAV-LiDAR point clouds.
2. **Real-Time 3D Inundation:** The 3D water ponding level is an interactive volumetric simulation calculated from detected sink depths and precipitation rates; it accurately indicates depressions but does not execute full 3D Navier-Stokes fluid mechanics in the browser.
3. **Proposed Infrastructure:** The 3D cyan drainage pipelines and trenches displayed in the viewer represent **proposed algorithmic alignments** calculated by the A* solver, not pre-existing underground piping.
