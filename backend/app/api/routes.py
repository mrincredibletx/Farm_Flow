import logging
from typing import List, Dict, Any, Optional
import numpy as np
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.models.terrain import (
    TerrainRequest,
    TerrainResponse,
    DrainageRoute,
    RiskSimulationResult,
    AIAdvisoryResult,
)
from app.services.elevation_service import ElevationService
from app.services.hydrology_service import HydrologyService
from app.services.routing_service import DrainageRoutingService
from app.services.risk_ml_service import HydrologicalRiskService
from app.services.advisory_service import AIAdvisoryService
from app.services.weather_service import WeatherService
from app.services.cut_fill_service import CutFillService

logger = logging.getLogger(__name__)

router = APIRouter()

elevation_service = ElevationService()
hydrology_service = HydrologyService()
routing_service = DrainageRoutingService()
risk_service = HydrologicalRiskService()
advisory_service = AIAdvisoryService()
weather_service = WeatherService()
cut_fill_service = CutFillService()

class RiskScenarioPayload(BaseModel):
    soil_type: str = Field(default="clay")
    rainfall_mm: float = Field(default=65.0, ge=5.0, le=300.0)
    area_sqm: float = Field(default=117600.0)
    high_risk_points_count: int = Field(default=12)
    relief_meters: float = Field(default=3.5)

class AdvisoryPayload(BaseModel):
    metrics: Dict[str, Any]
    soil_type: str = "clay"
    crop_type: str = "Wheat"
    routes: List[Dict[str, Any]] = []

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "healthy",
        "service": "Smart Agricultural Drainage System API",
        "version": "2.0.0",
        "phase": "Phase II (Full System MVP with 3D, A* Routing, ML Risk & Gemini AI)"
    }

@router.get("/sample-fields")
async def get_sample_fields():
    """
    Returns 10 curated, geographically verified agricultural test fields in India
    with diverse real-world topography for instant 1-click analysis and live validation.
    """
    return {
        "fields": [
            {
                "id": "uem-jaipur-research",
                "name": "1. UEM Jaipur Agritech Research Field",
                "location": "Jaipur, Rajasthan",
                "description": "Semi-arid foothill rolling terrain at ~482m MSL. Slopes gently toward southern drainage channel.",
                "center": [75.7011, 27.2140],
                "zoom": 17,
                "soil_type": "clay",
                "crop_type": "Wheat",
                "elevation_msl": 482.0,
                "terrain_feature": "Foothill natural slope with highway drainage culvert exit.",
                "coordinates": [
                    [75.6992, 27.2155],
                    [75.7028, 27.2158],
                    [75.7032, 27.2122],
                    [75.6995, 27.2120],
                    [75.6992, 27.2155]
                ]
            },
            {
                "id": "punjab-paddy-lowland",
                "name": "2. Punjab Alluvial Paddy Lowland",
                "location": "Ludhiana, Punjab",
                "description": "Intensive alluvial flood basin at ~256m MSL with a concave center swale. Prone to severe seasonal water stagnation.",
                "center": [76.0120, 30.7100],
                "zoom": 17,
                "soil_type": "alluvial",
                "crop_type": "Paddy",
                "elevation_msl": 256.0,
                "terrain_feature": "Concave flood swale with high water table and monsoon stagnation.",
                "coordinates": [
                    [76.0090, 30.7125],
                    [76.0150, 30.7128],
                    [76.0155, 30.7072],
                    [76.0095, 30.7070],
                    [76.0090, 30.7125]
                ]
            },
            {
                "id": "haryana-cssri-swale",
                "name": "3. Haryana CSSRI Saline Swale",
                "location": "Karnal, Haryana",
                "description": "Alluvial basin at ~251m MSL near CSSRI with a central micro-depression zone requiring sub-surface pipe collector.",
                "center": [76.9740, 29.6890],
                "zoom": 17,
                "soil_type": "alluvial",
                "crop_type": "Wheat",
                "elevation_msl": 251.0,
                "terrain_feature": "Saline basin depression draining toward Western Yamuna canal.",
                "coordinates": [
                    [76.9712, 29.6915],
                    [76.9772, 29.6918],
                    [76.9776, 29.6862],
                    [76.9716, 29.6860],
                    [76.9712, 29.6915]
                ]
            },
            {
                "id": "narmada-valley-vertisol",
                "name": "4. Narmada Valley Vertisol Farm",
                "location": "Hoshangabad, Madhya Pradesh",
                "description": "Heavy black cotton soil (Vertisol) at ~299m MSL. Infiltration rate 0.8 mm/h, extreme root hypoxia risk without drainage.",
                "center": [77.7260, 22.7480],
                "zoom": 17,
                "soil_type": "black_cotton",
                "crop_type": "Wheat",
                "elevation_msl": 299.0,
                "terrain_feature": "Slow-percolating black clay with natural slope toward Narmada tributary.",
                "coordinates": [
                    [77.7230, 22.7505],
                    [77.7290, 22.7508],
                    [77.7295, 22.7452],
                    [77.7235, 22.7450],
                    [77.7230, 22.7505]
                ]
            },
            {
                "id": "aravalli-foothill-terrace",
                "name": "5. Aravalli Foothill Terraced Farm",
                "location": "Samod / Chomu, Rajasthan",
                "description": "Undulating foothill terrain at ~779m MSL. Distinct 4.5m natural slope gradient; rapid gravity pipe discharge.",
                "center": [75.8150, 27.2280],
                "zoom": 17,
                "soil_type": "sandy_loam",
                "crop_type": "Mustard",
                "elevation_msl": 779.0,
                "terrain_feature": "Steep foothill descent; high self-cleansing slope grade (2.1%).",
                "coordinates": [
                    [75.8120, 27.2305],
                    [75.8180, 27.2310],
                    [75.8185, 27.2252],
                    [75.8125, 27.2250],
                    [75.8120, 27.2305]
                ]
            },
            {
                "id": "malwa-plateau-soybean",
                "name": "6. Malwa Basaltic Plateau Soybean Field",
                "location": "Dewas, Madhya Pradesh",
                "description": "Undulating basaltic plateau at ~499m MSL draining eastward into an agricultural ravine.",
                "center": [75.8210, 23.1650],
                "zoom": 17,
                "soil_type": "black_cotton",
                "crop_type": "Cotton",
                "elevation_msl": 499.0,
                "terrain_feature": "Rolling plateau terrain with eastern natural discharge gully.",
                "coordinates": [
                    [75.8180, 23.1678],
                    [75.8242, 23.1682],
                    [75.8248, 23.1622],
                    [75.8185, 23.1620],
                    [75.8180, 23.1678]
                ]
            },
            {
                "id": "godavari-basin-sugarcane",
                "name": "7. Godavari Basin Sugarcane Farm",
                "location": "Kopargaon / Shirdi, Maharashtra",
                "description": "Deep alluvial-vertisol plain at ~507m MSL with canal seepage accumulating in the southern field pocket.",
                "center": [74.4750, 19.8820],
                "zoom": 17,
                "soil_type": "clay",
                "crop_type": "Maize",
                "elevation_msl": 507.0,
                "terrain_feature": "Irrigation canal seepage swale requiring deep perforated trench collector.",
                "coordinates": [
                    [74.4720, 19.8845],
                    [74.4782, 19.8848],
                    [74.4788, 19.8792],
                    [74.4725, 19.8790],
                    [74.4720, 19.8845]
                ]
            },
            {
                "id": "western-up-doab",
                "name": "8. Western UP Doab Lowland",
                "location": "Meerut, Uttar Pradesh",
                "description": "Low-relief alluvial plain at ~225m MSL between Ganga and Yamuna. Slopes toward Hindon flood drainage network.",
                "center": [77.7050, 28.9850],
                "zoom": 17,
                "soil_type": "alluvial",
                "crop_type": "Wheat",
                "elevation_msl": 225.0,
                "terrain_feature": "Alluvial floodplain with systematic 0.9% slope grade.",
                "coordinates": [
                    [77.7020, 28.9878],
                    [77.7082, 28.9882],
                    [77.7088, 28.9822],
                    [77.7025, 28.9820],
                    [77.7020, 28.9878]
                ]
            },
            {
                "id": "cauvery-delta-basin",
                "name": "9. Cauvery Delta Lowland Basin",
                "location": "Thanjavur, Tamil Nadu",
                "description": "Coastal delta alluvial bowl at ~57m MSL prone to monsoon stagnation; connects to field irrigation canals.",
                "center": [79.1380, 10.7850],
                "zoom": 17,
                "soil_type": "clay",
                "crop_type": "Paddy",
                "elevation_msl": 57.0,
                "terrain_feature": "Coastal delta low basin; direct pipe connection to canal escape.",
                "coordinates": [
                    [79.1350, 10.7875],
                    [79.1412, 10.7878],
                    [79.1418, 10.7822],
                    [79.1355, 10.7820],
                    [79.1350, 10.7875]
                ]
            },
            {
                "id": "indore-agro-parcel",
                "name": "10. Indore Agro-Ecological Test Parcel",
                "location": "Sanwer, Madhya Pradesh",
                "description": "Heavy clay Vertisol at ~507m MSL with natural central depression; requires 200mm HDPE collector with gravel envelope.",
                "center": [75.8250, 22.9750],
                "zoom": 17,
                "soil_type": "black_cotton",
                "crop_type": "Wheat",
                "elevation_msl": 507.0,
                "terrain_feature": "Vertisol center depression; gravity pipeline draining to roadside culvert.",
                "coordinates": [
                    [75.8220, 22.9775],
                    [75.8282, 22.9778],
                    [75.8288, 22.9722],
                    [75.8225, 22.9720],
                    [75.8220, 22.9775]
                ]
            }
        ]
    }

@router.post(
    "/analyze-terrain",
    response_model=TerrainResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze field terrain elevation, compute waterlogging zones, A* drainage routes, ML risk, and AI advisory"
)
async def analyze_terrain(payload: TerrainRequest):
    try:
        coordinates = payload.coordinates
        resolution = payload.grid_resolution or 20

        # Step 1: Compute Bounding Box
        bbox = elevation_service.compute_bounding_box(coordinates)

        # Step 2: Generate Grid & Polygon Mask
        grid_lats, grid_lngs, flat_points = elevation_service.generate_grid(bbox, resolution=resolution)
        mask = elevation_service.create_polygon_mask(coordinates, grid_lats, grid_lngs)

        # Step 3: Fetch Elevation Data
        flat_elevations = await elevation_service.fetch_elevations(flat_points, bbox)
        elevation_grid = np.array(flat_elevations, dtype=float).reshape(resolution, resolution)

        # Step 4: Execute NumPy Pooling & Hydrology Analysis
        waterlogging_zones, zone_details, metrics, summary, flow_vectors = hydrology_service.analyze_terrain(
            grid_lats=grid_lats,
            grid_lngs=grid_lngs,
            elevation_grid=elevation_grid,
            mask=mask,
            coordinates=coordinates,
            bbox=bbox
        )

        # Construct grid coordinates for client contour mapping: shape [rows, cols, 2]
        grid_coords: List[List[List[float]]] = []
        for r in range(resolution):
            row_coords = []
            for c in range(resolution):
                row_coords.append([round(float(grid_lngs[r, c]), 6), round(float(grid_lats[r, c]), 6)])
            grid_coords.append(row_coords)

        # Prepare 2D elevation grid list for response
        elevation_grid_list = [[round(float(val), 2) for val in row] for row in elevation_grid]

        # Fetch live meteorological data for field center
        center_lat = (bbox["min_lat"] + bbox["max_lat"]) / 2
        center_lng = (bbox["min_lng"] + bbox["max_lng"]) / 2
        live_weather = await weather_service.fetch_current_rainfall(center_lat, center_lng)

        # 1. Pipeline Drainage System (Lowest Sinkhole Khaddha -> Virtual Boundary Escape Outlet)
        pipeline_drainage = routing_service.calculate_pipeline_drainage(
            coordinates=coordinates,
            grid_lats=grid_lats,
            grid_lngs=grid_lngs,
            elevation_grid=elevation_grid,
            mask=mask,
            bbox=bbox,
            metrics=metrics
        )

        # Phase II Enhancements
        drainage_routes = None
        risk_simulation = None
        ai_advisory = None

        if payload.include_phase2:
            # A* Drainage Pathfinding
            drainage_routes = routing_service.calculate_drainage_routes(
                grid_lats=grid_lats,
                grid_lngs=grid_lngs,
                elevation_grid=elevation_grid,
                mask=mask,
                waterlogging_zones=waterlogging_zones,
                bbox=bbox,
                metrics=metrics
            )

            # Soil & Precipitation ML Risk Simulation (using live weather rainfall or custom scenario)
            effective_rain = payload.rainfall_mm if payload.rainfall_mm and payload.rainfall_mm != 65.0 else live_weather.get("rainfall_event_mm", 65.0)

            risk_simulation = risk_service.simulate_scenario(
                soil_type=payload.soil_type or "clay",
                rainfall_mm=effective_rain,
                area_sqm=metrics.total_area_sqm,
                high_risk_points_count=metrics.high_risk_points_count,
                relief_meters=metrics.elevation_range
            )

            # LLM AI Advisory (Gemini API with ICAR expert model)
            ai_advisory = await advisory_service.generate_advisory(
                metrics=metrics.dict(),
                soil_type=payload.soil_type or "clay",
                crop_type=payload.crop_type or "Wheat",
                routes=drainage_routes
            )

        # Precision Land Grading & Cut/Fill Optimization
        cut_fill_analysis = cut_fill_service.calculate_cut_fill(
            elevation_grid=elevation_grid_list,
            bbox=bbox,
            target_cut_fill_ratio=1.20
        )

        return TerrainResponse(
            status="success",
            bounding_box=bbox,
            elevation_grid=elevation_grid_list,
            waterlogging_zones=waterlogging_zones,
            grid_coordinates=grid_coords,
            zone_details=zone_details,
            flow_vectors=flow_vectors,
            metrics=metrics,
            summary=summary,
            drainage_routes=drainage_routes,
            pipeline_drainage=pipeline_drainage,
            risk_simulation=risk_simulation,
            ai_advisory=ai_advisory,
            live_weather=live_weather,
            cut_fill_analysis=cut_fill_analysis
        )

    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception(f"Unexpected error in analyze-terrain: {e}")
        raise HTTPException(status_code=500, detail=f"Terrain analysis failed: {str(e)}")

@router.post("/simulate-risk", response_model=RiskSimulationResult)
async def simulate_risk(payload: RiskScenarioPayload):
    """
    Simulates waterlogging risk and saturation kinetics when user adjusts soil type or rainfall slider.
    """
    return risk_service.simulate_scenario(
        soil_type=payload.soil_type,
        rainfall_mm=payload.rainfall_mm,
        area_sqm=payload.area_sqm,
        high_risk_points_count=payload.high_risk_points_count,
        relief_meters=payload.relief_meters
    )

@router.post("/generate-advisory", response_model=AIAdvisoryResult)
async def generate_advisory(payload: AdvisoryPayload):
    """
    Generates agronomic recommendations tailored to crop, soil, and drainage metrics.
    """
    return await advisory_service.generate_advisory(
        metrics=payload.metrics,
        soil_type=payload.soil_type,
        crop_type=payload.crop_type,
        routes=payload.routes
    )

@router.get("/weather", status_code=status.HTTP_200_OK, summary="Fetch live weather and precipitation data")
async def get_weather(lat: float, lng: float):
    """
    Returns real-time rainfall, temperature, and wind speed from OpenWeatherMap or Tomorrow.io.
    """
    return await weather_service.fetch_current_rainfall(lat, lng)

class ElevationProfilePayload(BaseModel):
    elevation_grid: List[List[float]]
    design_grid: Optional[List[List[float]]] = None
    bbox: Dict[str, float]
    start_pt: List[float] # [lng, lat]
    end_pt: List[float]   # [lng, lat]
    samples: int = Field(default=40, ge=10, le=100)

@router.post("/elevation-profile", status_code=status.HTTP_200_OK, summary="Compute elevation transect cross-section")
async def get_elevation_profile(payload: ElevationProfilePayload):
    """
    Samples ground elevation and design grade along a 2-point transect line across the field.
    """
    return cut_fill_service.sample_elevation_profile(
        elevation_grid=payload.elevation_grid,
        design_grid=payload.design_grid,
        bbox=payload.bbox,
        start_pt=(payload.start_pt[0], payload.start_pt[1]),
        end_pt=(payload.end_pt[0], payload.end_pt[1]),
        num_samples=payload.samples
    )
