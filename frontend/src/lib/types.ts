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

export interface SinkholeDetail {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  elevation_m: number;
  depth_below_mean_m: number;
  severity: string;
}

export interface PipelineDrainageSystem {
  sink_point: [number, number]; // [lng, lat]
  sink_elevation_m: number;
  sink_depth_below_mean_m: number;
  all_sinks?: SinkholeDetail[];
  outlet_point: [number, number]; // [lng, lat] (Field boundary perimeter outlet)
  outlet_elevation_m: number;
  flow_direction_text?: string;
  virtual_boundary_coordinates?: [number, number][]; // Optional / deprecated
  pipeline_coordinates: [number, number][]; // [[lng, lat], [lng, lat]]
  length_meters: number;
  elevation_drop_meters: number;
  slope_percent: number;
  pipe_diameter_mm: number;
  recommended_pipe_material: string;
  avg_trench_depth_m: number;
  excavation_volume_m3: number;
  estimated_cost_inr: number;
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
  live_weather?: {
    source: string;
    rainfall_event_mm: number;
    recorded_rain_1h_mm?: number;
    condition: string;
    temperature_c: number;
    humidity_percent: number;
    wind_speed_mps: number;
    location_name?: string;
    is_live: boolean;
  };
  summary?: string;
  // Drainage Pipeline & Core Engineering
  pipeline_drainage?: PipelineDrainageSystem;
  drainage_routes?: DrainageRoute[];
  risk_simulation?: RiskSimulationResult;
  ai_advisory?: AIAdvisoryResult;
  cut_fill_analysis?: CutFillAnalysis;
}

export interface CutFillAnalysis {
  total_cut_m3: number;
  total_fill_m3: number;
  cut_fill_ratio: number;
  cut_per_acre_m3: number;
  cut_per_ha_m3: number;
  max_cut_depth_m: number;
  max_fill_depth_m: number;
  design_slope_percent: number;
  design_heading_degrees: number;
  heading_compass: string;
  estimated_leveling_cost_inr: number;
  cut_fill_matrix: number[][];
  design_elevation_grid: number[][];
}

export interface ElevationProfilePoint {
  index: number;
  distance_m: number;
  lng: number;
  lat: number;
  elevation_m: number;
  design_elevation_m: number;
  cut_m: number;
  fill_m: number;
}

export interface SampleField {
  id: string;
  name: string;
  location: string;
  description: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  coordinates: [number, number][]; // [[lng, lat], ...]
  soil_type?: string;
  crop_type?: string;
  elevation_msl?: number;
  terrain_feature?: string;
}

export interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

