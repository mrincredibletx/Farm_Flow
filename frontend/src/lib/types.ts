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
  dominant_aspect_degrees?: number;
  average_slope_percent: number;
  major_flow_directions?: string[];
  is_watershed_divide?: boolean;
  watershed_divide_type?: string;
}

export interface FlowVector {
  lng: number;
  lat: number;
  direction_deg: number;
  cardinal_direction: string;
  slope_percent: number;
  elevation: number;
  magnitude: number;
}

export interface ZoneDetail {
  lng: number;
  lat: number;
  severity: number;
  elevation: number;
  is_local_min: boolean;
  depression_depth: number;
  slope_percent: number;
}

export interface DrainageRoute {
  route_id: string;
  sink_point: [number, number];
  outlet_point: [number, number];
  path_coordinates: [number, number][];
  path_elevations: number[];
  length_meters: number;
  elevation_drop_meters: number;
  slope_percent: number;
  excavation_volume_m3: number;
  estimated_cost_inr: number;
  recommended_ditch_type: string;
  severity: number;
}

export interface RiskSimulationResult {
  soil_type: string;
  soil_name: string;
  k_sat_mm_per_hr: number;
  curve_number: number;
  rainfall_event_mm: number;
  runoff_depth_mm: number;
  runoff_volume_m3: number;
  runoff_volume_megaliters: number;
  estimated_ponding_depth_cm: number;
  drainage_time_hours: number;
  crop_loss_risk_percent: number;
  risk_level: string;
}

export interface AIAdvisoryResult {
  headline: string;
  generated_by: string;
  drainage_recommendations: string[];
  crop_vulnerability_advice: string[];
  soil_management_tips: string[];
  estimated_roi_assessment: string;
  full_text?: string;
}

export interface TerrainAnalysisResponse {
  status: string;
  bounding_box: BoundingBox;
  elevation_grid: number[][];
  waterlogging_zones: [number, number, number][]; // [lng, lat, severity]
  grid_coordinates?: [number, number][][];
  zone_details?: ZoneDetail[];
  flow_vectors?: FlowVector[];
  metrics?: TerrainMetrics;
  summary?: string;
  // Phase II fields
  drainage_routes?: DrainageRoute[];
  risk_simulation?: RiskSimulationResult;
  ai_advisory?: AIAdvisoryResult;
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

