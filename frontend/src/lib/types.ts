export interface BoundingBox {
  min_lng: number;
  min_lat: number;
  max_lng: number;
  max_lat: number;
}

export interface TerrainMetrics {
  min_elevation: number;
  max_elevation: number;
  elevation_range: number;
  average_elevation: number;
  total_area_sqm: number;
  total_area_acres: number;
  total_area_hectares: number;
  high_risk_points_count: number;
  moderate_risk_points_count: number;
  low_risk_points_count: number;
  dominant_slope_direction: string;
  average_slope_percent: number;
}

export interface TerrainAnalysisResponse {
  status: string;
  bounding_box: BoundingBox;
  elevation_grid: number[][];
  waterlogging_zones: [number, number, number][]; // [lng, lat, severity]
  grid_coordinates?: [number, number][][];
  metrics?: TerrainMetrics;
  summary?: string;
}

export interface SampleField {
  id: string;
  name: string;
  location: string;
  description: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  coordinates: [number, number][]; // [[lng, lat], ...]
}

export interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

