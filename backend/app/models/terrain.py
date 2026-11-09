from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator

class TerrainRequest(BaseModel):
    coordinates: List[List[float]] = Field(
        ...,
        description="List of [lng, lat] coordinate pairs defining the field boundary polygon. Minimum 3 points."
    )
    grid_resolution: Optional[int] = Field(
        default=20,
        ge=6,
        le=50,
        description="Grid resolution (N x N) for elevation sampling within the bounding box."
    )
    soil_type: Optional[str] = Field(
        default="clay",
        description="Soil category (clay, black_cotton, silt_loam, alluvial, sandy_loam)"
    )
    crop_type: Optional[str] = Field(
        default="Wheat",
        description="Crop variety planted in field"
    )
    rainfall_mm: Optional[float] = Field(
        default=65.0,
        description="Precipitation scenario event depth in mm"
    )
    include_phase2: Optional[bool] = Field(
        default=True,
        description="Whether to run Phase II algorithms (A* routing, ML risk scoring, LLM advisory)"
    )

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v):
        if len(v) < 3:
            raise ValueError("Polygon boundary must contain at least 3 coordinate pairs.")
        for pt in v:
            if len(pt) < 2:
                raise ValueError("Each coordinate must be a [lng, lat] pair.")
            lng, lat = pt[0], pt[1]
            if not (-180.0 <= lng <= 180.0 and -90.0 <= lat <= 90.0):
                raise ValueError(f"Invalid coordinate range: lng={lng}, lat={lat}")
        return v

class BoundingBox(BaseModel):
    min_lng: float
    min_lat: float
    max_lng: float
    max_lat: float

class TerrainMetrics(BaseModel):
    min_elevation: float
    max_elevation: float
    elevation_range: float
    average_elevation: float
    total_area_sqm: float
    total_area_acres: float
    total_area_hectares: float
    high_risk_points_count: int
    moderate_risk_points_count: int
    low_risk_points_count: int
    dominant_slope_direction: str
    dominant_aspect_degrees: Optional[float] = None
    average_slope_percent: float

class ZoneDetail(BaseModel):
    lng: float
    lat: float
    severity: float
    elevation: float
    is_local_min: bool
    depression_depth: float
    slope_percent: float

class DrainageRoute(BaseModel):
    route_id: str
    sink_point: List[float]  # [lng, lat]
    outlet_point: List[float]  # [lng, lat]
    path_coordinates: List[List[float]]  # [[lng, lat], ...]
    path_elevations: List[float]
    length_meters: float
    elevation_drop_meters: float
    slope_percent: float
    excavation_volume_m3: float
    estimated_cost_inr: float
    recommended_ditch_type: str
    severity: float

class RiskSimulationResult(BaseModel):
    soil_type: str
    soil_name: str
    k_sat_mm_per_hr: float
    curve_number: int
    rainfall_event_mm: float
    runoff_depth_mm: float
    runoff_volume_m3: float
    runoff_volume_megaliters: float
    estimated_ponding_depth_cm: float
    drainage_time_hours: float
    crop_loss_risk_percent: float
    risk_level: str

class AIAdvisoryResult(BaseModel):
    headline: str
    generated_by: str
    drainage_recommendations: List[str]
    crop_vulnerability_advice: List[str]
    soil_management_tips: List[str]
    estimated_roi_assessment: str
    full_text: Optional[str] = None

class TerrainResponse(BaseModel):
    status: str = "success"
    bounding_box: Dict[str, float]
    elevation_grid: List[List[float]]
    waterlogging_zones: List[List[float]]  # [[lng, lat, severity], ...]
    grid_coordinates: Optional[List[List[List[float]]]] = None  # [[lng, lat] per cell]
    zone_details: Optional[List[ZoneDetail]] = None
    metrics: Optional[TerrainMetrics] = None
    summary: Optional[str] = None
    # Phase II Extensions
    drainage_routes: Optional[List[DrainageRoute]] = None
    risk_simulation: Optional[RiskSimulationResult] = None
    ai_advisory: Optional[AIAdvisoryResult] = None
