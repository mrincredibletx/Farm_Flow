# Smart Agricultural Drainage & Terrain Intelligence System
### Complete Capstone Project (Phase I & Phase II Integrated)
**Project Owner:** Rakesh Bangra (B.Tech CSE, UEM Jaipur)  
**Development Partner:** Antigravity  
**Academic Milestone:** Full Two-Semester System MVP (Phase I & Phase II)

---

## 1. Executive Summary & Vision

Agricultural waterlogging is a leading cause of crop hypoxia, root rot, and severe yield loss in low-drainage farmlands across India and globally. Conventional solutions demand heavy, manual GIS processing (e.g. QGIS, manual LiDAR `.las` uploads, and bulky academic hydrology software suites).

This project delivers a **modern, end-to-end, API-first intelligent drainage management system**:
1. **Interactive 2D/3D Mapping:** Users mark field boundaries on high-resolution satellite imagery or toggle directly into a **Three.js interactive 3D WebGL terrain viewer**.
2. **Automated DEM Retrieval:** Automatically queries global Digital Elevation Models (DEM) via public satellite APIs (Open-Meteo SRTM/Copernicus 30m/90m, with Google Maps API and realistic synthetic interpolator fallbacks).
3. **NumPy Hydrology & Sinks Detection:** 8-neighbor local minimum kernel identifies terrain depressions and computes slope gradients ($\nabla Z$).
4. **A* Gravitational Drainage Routing:** Automatically calculates the optimal surface drainage ditch path from critical sinks to field boundary outlets, computing trench length, cut depth, excavation volume ($\text{m}^3$), and estimated earthwork costs (INR ₹).
5. **Soil & Rainfall Infiltration Simulator:** Uses USDA-SCS Curve Number hydrology to model saturation kinetics, depression ponding depth, drainage time (hours), and crop loss risk percentages across 5 soil classifications.
6. **Gemini LLM Agronomic Advisory:** Generates practical agricultural advisories with ICAR-calibrated recommendations for tile drainage, crop protection, and post-monsoon aeration.
7. **Executive PDF Export:** 1-click generation of a downloadable agronomic report.

---

## 2. Full System Architecture (Phase I + Phase II)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Web Application                           │
│  - Dark Theme + Glassmorphism SaaS Interface (Tailwind CSS)            │
│  - View Switcher: [2D GIS Map (Leaflet)] ⟷ [3D Terrain Mesh (Three.js)]│
│  - Multi-tab Telemetry Sidebar:                                        │
│      * Tab 1: Hydrology & Sinks (DEM Relief, Area, Aspect)             │
│      * Tab 2: A* Drainage Ditching (Length, Volume, Cut Depth, Cost)   │
│      * Tab 3: Soil & Rainfall ML Simulator (Kinetics, Saturation, Loss)│
│      * Tab 4: Gemini AI Agronomic Advisory (Crop Health & ICAR Specs)  │
│  - 2D Elevation Matrix Inspector (NumPy Array Modal)                   │
│  - 1-Click Executive PDF Agronomic Report Generator                    │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                       JSON REST API│ POST /api/v1/analyze-terrain
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       FastAPI Python Backend                           │
│  - ElevationService:                                                   │
│      * Open-Meteo SRTM/Copernicus Global DEM Ingestion                 │
│      * Google Maps Elevation API (Optional Key)                        │
│      * Continuous Micro-Relief Enhancement for Flat Basins             │
│  - HydrologyService:                                                   │
│      * NumPy 8-Neighbor Pooling & Sink Detection                       │
│      * Spatial Gradient Matrix (dZ/dx, dZ/dy) & Flow Aspect            │
│  - DrainageRoutingService:                                             │
│      * A* Pathfinding from Sinks to Lowest Boundary Escape Points      │
│      * Trench Length, Cut Depth, Excavation Volume, & Cost (INR ₹)     │
│  - HydrologicalRiskService:                                            │
│      * USDA-SCS Curve Number Runoff & Infiltration Model               │
│      * Multi-soil classification (Clay, Black Cotton, Alluvial, Loam)  │
│  - AIAdvisoryService:                                                  │
│      * Google Gemini LLM API (google-genai 2.5 Flash)                  │
│      * ICAR-Calibrated Agricultural Action Plan Fallback               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet, Three.js, jsPDF, jsPDF-AutoTable, Lucide Icons
- **Backend:** Python 3.10+, FastAPI, Uvicorn, NumPy, SciPy, Shapely, HTTPX, Google GenAI SDK, Pydantic v2
- **Data Source:** Open-Meteo Elevation API (Global Copernicus/SRTM DEM, free & keyless), Google Maps Elevation API (optional)
- **Deployment Ready:** Vercel (Frontend), Render / Railway (Backend)

---

## 4. API Endpoints

### 1. `POST /api/v1/analyze-terrain`
Runs full Phase I & Phase II pipeline: DEM elevation extraction, sink detection, A* drainage routes, SCS-CN soil risk modeling, and Gemini AI advisory.

#### Request Payload
```json
{
  "coordinates": [
    [75.9238, 26.9845],
    [75.9272, 26.9848],
    [75.9278, 26.9818],
    [75.9242, 26.9815],
    [75.9238, 26.9845]
  ],
  "grid_resolution": 20,
  "soil_type": "clay",
  "crop_type": "Wheat",
  "rainfall_mm": 65.0,
  "include_phase2": true
}
```

#### Response Structure
```json
{
  "status": "success",
  "bounding_box": { "min_lng": 75.9238, "min_lat": 26.9815, "max_lng": 75.9278, "max_lat": 26.9848 },
  "elevation_grid": [[386.0, 385.8], [385.5, 385.2]],
  "waterlogging_zones": [[75.924657, 26.984564, 0.733]],
  "metrics": {
    "min_elevation": 383.0,
    "max_elevation": 386.0,
    "elevation_range": 3.0,
    "average_elevation": 385.02,
    "total_area_sqm": 117608.3,
    "total_area_acres": 29.06,
    "total_area_hectares": 11.761,
    "high_risk_points_count": 72,
    "dominant_slope_direction": "South (174.4°)",
    "average_slope_percent": 1.73
  },
  "drainage_routes": [
    {
      "route_id": "route-1",
      "sink_point": [75.9252, 26.9838],
      "outlet_point": [75.9278, 26.9818],
      "path_coordinates": [[75.9252, 26.9838], "..."],
      "length_meters": 219.4,
      "elevation_drop_meters": 1.2,
      "slope_percent": 0.55,
      "excavation_volume_m3": 164.0,
      "estimated_cost_inr": 29520,
      "recommended_ditch_type": "Perforated French Drain with Gravel Bed"
    }
  ],
  "risk_simulation": {
    "soil_name": "Heavy Clay / Vertisol",
    "rainfall_event_mm": 65.0,
    "runoff_volume_m3": 4347.7,
    "runoff_volume_megaliters": 4.35,
    "estimated_ponding_depth_cm": 12.9,
    "drainage_time_hours": 48.5,
    "crop_loss_risk_percent": 74.3,
    "risk_level": "CRITICAL (Severe Root Rot & Hypoxia)"
  },
  "ai_advisory": {
    "headline": "Precision Hydrology & Drainage Action Plan for Wheat (Clay Soil)",
    "generated_by": "ICAR-Calibrated Terrain Intelligence Model",
    "drainage_recommendations": ["..."],
    "crop_vulnerability_advice": ["..."],
    "soil_management_tips": ["..."],
    "estimated_roi_assessment": "..."
  }
}
```

### 2. `POST /api/v1/simulate-risk`
Allows live slider adjustments of precipitation depth ($15\text{mm} - 180\text{mm}$) and soil classifications without re-querying elevation.

### 3. `POST /api/v1/generate-advisory`
Re-runs the LLM agricultural advisory for different crops (Wheat, Paddy, Mustard, Cotton, Maize).

---

## 5. Quick Start & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ or 20+

### Option A: One-Click Launch (Windows)
Double-click `run_dev.bat` or run in PowerShell:
```powershell
.\run_dev.ps1
```

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend Swagger Docs:* `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend Web Application:* `http://localhost:3000`

---

## 6. How to Use & Demonstrate the System

1. **Preset Field Demos (1-Click Evaluation):**
   - Click **Preset Agricultural Fields** dropdown in the sidebar.
   - Select **UEM Jaipur Agritech Research Plot** (Jaipur, Rajasthan), **Punjab Lowland Farm**, or **Haryana Terraced Crop Basin**.
   - Watch the map zoom to the boundary, query the DEM grid, detect sinks, and compute drainage channels automatically!
2. **2D / 3D Visual Switching:**
   - Click **[ 3D Terrain Mesh ]** in the top header to enter the interactive Three.js 3D viewer.
   - Drag mouse to orbit/tilt, scroll to zoom, adjust the **Relief Exaggeration** slider ($1\times - 5\times$), and drag the **Water Ponding Level** slider to watch standing water settle into field basins!
3. **Engineered Drainage Ditching (A\*):**
   - Switch to the **A\* Ditching** tab in the sidebar.
   - Inspect calculated trench routes, lengths, excavation volumes ($\text{m}^3$), and estimated costs (INR ₹).
   - In 2D mode, glowing dashed cyan lines trace the ditch paths to discharge outlets.
4. **Soil & Rainfall ML Simulation:**
   - Switch to the **ML Risk** tab.
   - Adjust precipitation depth ($15\text{mm} - 180\text{mm}$) and soil types (Clay, Black Cotton, Alluvial, Loam).
   - See live saturation duration ($T_{\text{sat}}$), flood volume, and crop loss risk meter update in real time.
5. **Gemini AI Agronomic Advisory:**
   - Switch to the **Gemini AI** tab.
   - Select crop type (Wheat, Paddy, Cotton, Mustard, Maize) to view tailored drainage guidelines, crop hypoxia warnings, and soil aeration protocols.
6. **Executive PDF Export:**
   - Click **Export Agronomic Report (PDF)** in the sidebar or header.
   - Instantly downloads an official multi-page formatted report including metrics tables, channel specifications, soil analysis, and AI advisories.
