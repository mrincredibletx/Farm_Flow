# Smart Agricultural Drainage & Terrain Intelligence System
### Phase I: 7th Semester MVP (Capstone Project)
**Project Owner:** Rakesh Bangra (B.Tech CSE, UEM Jaipur)  
**Development Partner:** Antigravity  
**Phase:** Phase I MVP  

---

## 1. Executive Summary & Architecture Shift

Agricultural waterlogging is a primary driver of crop hypoxia, root rot, and severe yield loss in low-drainage farmlands. Traditional academic solutions demand heavy, manual GIS processing (e.g., QGIS, manual LiDAR .LAS file uploads, and bulky hydrological software suites) which creates high friction for farmers and agronomists.

This system shifts the paradigm to a **lean, API-first architecture**:
1. Farmers or agronomists draw a boundary polygon around any field directly on an interactive 2D web map.
2. The system auto-queries high-resolution Digital Elevation Models (DEM) from public APIs (Open-Meteo SRTM/Copernicus 30m/90m, OpenTopography, or Google Maps Elevation API).
3. A lightweight **NumPy** pooling algorithm identifies local minimums (natural terrain depressions/sinkholes) and sluggish drainage grades.
4. The system immediately renders a **2D Heatmap Overlay** with pulsing radar pins on critical waterlogging sinks, computing real-time relief, area, and dominant runoff directions.

---

## 2. Phase I MVP Architecture & Scope

```
┌────────────────────────────────────────────────────────┐
│               Next.js 14 Web Frontend                  │
│  - Dark Theme + Glassmorphism UI (Tailwind CSS)        │
│  - Interactive 2D Leaflet Map (Satellite / Dark Matter)│
│  - Real-time Polygon Drawing & Nominatim Geocoding     │
│  - 2D Heatmap Overlay & Critical Sink Radar Pings      │
│  - 2D NumPy Elevation Matrix Inspector Modal           │
└───────────────────────────▲────────────────────────────┘
                            │
               JSON REST API│ POST /api/v1/analyze-terrain
                            │
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend                       │
│  - ElevationService:                                   │
│      * Open-Meteo DEM API (SRTM/Copernicus DEM)        │
│      * Google Maps Elevation API (Optional Key)        │
│      * Offline Terrain Fallback Generator              │
│  - HydrologyService:                                   │
│      * NumPy 8-Neighbor Depression / Sink Detection    │
│      * Spatial Gradient (dZ/dx, dZ/dy) & Runoff Aspect │
│      * Area Computation via Spherical Shoelace         │
└────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Leaflet, Lucide Icons
- **Backend:** Python 3.10+, FastAPI, Uvicorn, NumPy, SciPy, Shapely, HTTPX, Pydantic v2
- **Data Source:** Open-Meteo Elevation API (Global Copernicus/SRTM DEM, free & keyless), Google Maps Elevation API (optional)
- **Deployment Ready:** Vercel (Frontend), Render / Railway (Backend)

---

## 4. API Specification

### Endpoint: `POST /api/v1/analyze-terrain`

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
  "grid_resolution": 20
}
```

#### Response Contract (Satisfies Phase I Contract)
```json
{
  "status": "success",
  "bounding_box": {
    "min_lng": 75.9238,
    "min_lat": 26.9815,
    "max_lng": 75.9278,
    "max_lat": 26.9848
  },
  "elevation_grid": [
    [386.0, 385.8, 385.6, "..."],
    [385.5, 385.2, 384.9, "..."]
  ],
  "waterlogging_zones": [
    [75.924657, 26.984564, 0.733],
    [75.925229, 26.983857, 0.450]
  ],
  "metrics": {
    "min_elevation": 383.0,
    "max_elevation": 386.0,
    "elevation_range": 3.0,
    "average_elevation": 385.02,
    "total_area_sqm": 117608.3,
    "total_area_acres": 29.06,
    "total_area_hectares": 11.761,
    "high_risk_points_count": 72,
    "moderate_risk_points_count": 19,
    "low_risk_points_count": 65,
    "dominant_slope_direction": "South (174.4°)",
    "average_slope_percent": 1.73
  },
  "summary": "Identified 72 critical pooling depressions in the field with severe waterlogging risk. Field elevation spans 383.0m to 386.0m (relief: 3.0m). Surface runoff predominantly flows toward South (174.4°)."
}
```

---

## 5. Quick Start & Setup

### Prerequisites
- Python 3.10 or 3.11
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
*Backend Swagger Docs will be available at:* `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend Application will be available at:* `http://localhost:3000`

---

## 6. How to Use & Present the Demo

1. **Preset Field Demos (1-Click Evaluation):**
   - Click the **Preset Agricultural Fields** dropdown in the sidebar.
   - Select **UEM Jaipur Agritech Research Plot** (Jaipur, Rajasthan), **Punjab Lowland Farm**, or **Haryana Terraced Crop Basin**.
   - The map automatically animates to the coordinates, plots the boundary, and queries the elevation grid.
2. **Interactive Manual Boundary Drawing:**
   - Click **Draw Boundary**.
   - Click on the map to define the field boundary polygon vertices.
   - Click **Finish Polygon**, then click **Run Hydrology Analysis**.
3. **Map Basemap Switching:**
   - Toggle between **Dark Matter**, **Satellite (Esri World Imagery)**, and **Street** using the floating switcher in the top right.
4. **Inspecting Waterlogging Hotspots:**
   - Hover or click on any circle marker in the 2D Heatmap to view exact ground elevation and severity percentage.
   - Pulsing red radar pins highlight **local minimums** (sinks) where water accumulation is most severe.
5. **Academic Viva Matrix Inspector:**
   - Click **Inspect NumPy 2D Elevation Matrix** in the sidebar to open the full matrix grid modal with real DEM node values.

---

## 7. Phased Academic Roadmap

### ✅ Built in Phase I (7th Semester MVP)
- [x] Lean API-first elevation fetching model (Open-Meteo / Google Maps / resilient fallback).
- [x] Interactive 2D Leaflet mapping with polygon drawing, vertex markers, and location search.
- [x] NumPy 8-neighbor local minimum pooling algorithm and slope aspect calculation.
- [x] Color-coded 2D heatmap overlay and critical sink radar markers with telemetry popups.
- [x] Modern dark glassmorphism SaaS dashboard with real-time relief, area, and slope metrics.
- [x] Complete REST API endpoint `/api/v1/analyze-terrain` matching the API specification.

### ⏳ Reserved for Phase II (8th Semester - DO NOT BUILD YET)
- [ ] **3D Terrain Visualisation:** Interactive Three.js 3D elevation surface viewer.
- [ ] **Advanced Drainage Routing:** Surface drainage ditch path routing using A* or D8 flow accumulation matrices.
- [ ] **LLM AI Advisory Integration:** Gemini AI plain-text agronomic recommendations for farmers.
- [ ] **Machine Learning / Risk Scoring:** Soil-type and precipitation scenario predictive risk models.
- [ ] **PDF Report Generation:** Automated export of field maps and advisory documentation.

