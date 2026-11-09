import logging
from typing import List, Dict, Any
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

logger = logging.getLogger(__name__)

router = APIRouter()

elevation_service = ElevationService()
hydrology_service = HydrologyService()
routing_service = DrainageRoutingService()
risk_service = HydrologicalRiskService()
advisory_service = AIAdvisoryService()
weather_service = WeatherService()

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
    Returns curated demo fields (e.g. UEM Jaipur Research Field, Punjab Farm, Haryana Basin)
    for instant 1-click analysis in the UI.
    """
    return {
        "fields": [
            {
                "id": "uem-jaipur-demo",
                "name": "UEM Jaipur Agritech Research Plot",
                "location": "Jaipur, Rajasthan",
                "description": "Undulating terrain with natural run-off channels near the Aravalli foothills.",
                "center": [75.9255, 26.9832], # [lng, lat]
                "zoom": 17,
                "coordinates": [
                    [75.9238, 26.9845],
                    [75.9272, 26.9848],
                    [75.9278, 26.9818],
                    [75.9242, 26.9815],
                    [75.9238, 26.9845]
                ]
            },
            {
                "id": "punjab-paddy-demo",
                "name": "Punjab Lowland Farm",
                "location": "Ludhiana, Punjab",
                "description": "Intensive alluvial plains vulnerable to seasonal post-monsoon ponding.",
                "center": [75.8570, 30.9010],
                "zoom": 17,
                "coordinates": [
                    [75.8550, 30.9025],
                    [75.8590, 30.9028],
                    [75.8595, 30.8995],
                    [75.8552, 30.8992],
                    [75.8550, 30.9025]
                ]
            },
            {
                "id": "haryana-swale-demo",
                "name": "Haryana Terraced Crop Basin",
                "location": "Karnal, Haryana",
                "description": "Graded agricultural field with a central micro-depression zone.",
                "center": [76.9920, 29.6880],
                "zoom": 17,
                "coordinates": [
                    [76.9900, 29.6895],
                    [76.9940, 29.6898],
                    [76.9945, 29.6865],
                    [76.9902, 29.6862],
                    [76.9900, 29.6895]
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

        # Phase II Enhancements
        drainage_routes = None
        risk_simulation = None
        ai_advisory = None

        if payload.include_phase2:
            # 1. A* Drainage Pathfinding
            drainage_routes = routing_service.calculate_drainage_routes(
                grid_lats=grid_lats,
                grid_lngs=grid_lngs,
                elevation_grid=elevation_grid,
                mask=mask,
                waterlogging_zones=waterlogging_zones,
                bbox=bbox
            )

            # 2. Soil & Precipitation ML Risk Simulation (using live weather rainfall or custom scenario)
            effective_rain = payload.rainfall_mm if payload.rainfall_mm and payload.rainfall_mm != 65.0 else live_weather.get("rainfall_event_mm", 65.0)

            risk_simulation = risk_service.simulate_scenario(
                soil_type=payload.soil_type or "clay",
                rainfall_mm=effective_rain,
                area_sqm=metrics.total_area_sqm,
                high_risk_points_count=metrics.high_risk_points_count,
                relief_meters=metrics.elevation_range
            )

            # 3. LLM AI Advisory (Gemini API with ICAR expert model)
            ai_advisory = await advisory_service.generate_advisory(
                metrics=metrics.dict(),
                soil_type=payload.soil_type or "clay",
                crop_type=payload.crop_type or "Wheat",
                routes=drainage_routes
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
            risk_simulation=risk_simulation,
            ai_advisory=ai_advisory,
            live_weather=live_weather
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
