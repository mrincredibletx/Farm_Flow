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
    average_slope_percent: float

class TerrainResponse(BaseModel):
    status: str = "success"
    bounding_box: Dict[str, float]
    elevation_grid: List[List[float]]
    waterlogging_zones: List[List[float]]  # [[lng, lat, severity], ...]
    grid_coordinates: Optional[List[List[List[float]]]] = None  # [[lng, lat] per cell]
    metrics: Optional[TerrainMetrics] = None
    summary: Optional[str] = None

