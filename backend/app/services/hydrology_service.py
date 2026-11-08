import math
from typing import List, Dict, Any, Tuple
import numpy as np
from app.models.terrain import TerrainMetrics

class HydrologyService:
    def __init__(self):
        pass

    def calculate_polygon_area_sqm(self, coordinates: List[List[float]]) -> float:
        """
        Calculates approximate surface area in square meters using spherical Shoelace formula.
        coordinates: [[lng, lat], ...]
        """
        if len(coordinates) < 3:
            return 0.0

        pts = list(coordinates)
        if pts[0] != pts[-1]:
            pts.append(pts[0])

        # Radius of Earth in meters
        R = 6378137.0
        area = 0.0

        for i in range(len(pts) - 1):
            p1 = pts[i]
            p2 = pts[i + 1]
            lat1 = math.radians(p1[1])
            lat2 = math.radians(p2[1])
            lng1 = math.radians(p1[0])
            lng2 = math.radians(p2[0])
            area += (lng2 - lng1) * (2.0 + math.sin(lat1) + math.sin(lat2))

        area = abs(area * (R * R) / 2.0)
        return float(area)

    def analyze_terrain(
        self,
        grid_lats: np.ndarray,
        grid_lngs: np.ndarray,
        elevation_grid: np.ndarray,
        mask: np.ndarray,
        coordinates: List[List[float]],
        bbox: Dict[str, float]
    ) -> Tuple[List[List[float]], TerrainMetrics, str]:
        """
        Executes NumPy pooling calculation, identifies local minimums & waterlogging risk zones,
        and computes topographic drainage metrics.

        Returns:
            waterlogging_zones: list of [lng, lat, severity]
            metrics: TerrainMetrics object
            summary: string summary of hydrology findings
        """
        rows, cols = elevation_grid.shape

        # Extract elevation points strictly inside the user's field
        valid_elevations = elevation_grid[mask]
        if len(valid_elevations) == 0:
            valid_elevations = elevation_grid.flatten()

        min_elev = float(np.min(valid_elevations))
        max_elev = float(np.max(valid_elevations))
        elev_range = max(float(max_elev - min_elev), 0.01)
        mean_elev = float(np.mean(valid_elevations))

        # Spatial resolution in meters
        mean_lat = float(np.mean(grid_lats))
        lat_rad = math.radians(mean_lat)
        dy_meters = abs(float(grid_lats[0, 0] - grid_lats[-1, 0])) / max(rows - 1, 1) * 111320.0
        dx_meters = abs(float(grid_lngs[0, -1] - grid_lngs[0, 0])) / max(cols - 1, 1) * (111320.0 * math.cos(lat_rad))

        dx_meters = max(dx_meters, 1.0)
        dy_meters = max(dy_meters, 1.0)

        # Gradient calculation (dZ/dy and dZ/dx)
        grad_y, grad_x = np.gradient(elevation_grid, dy_meters, dx_meters)
        slope_percent = np.sqrt(grad_x**2 + grad_y**2) * 100.0

        # Calculate dominant aspect (slope direction)
        mean_gx = float(np.mean(grad_x[mask]))
        mean_gy = float(np.mean(grad_y[mask]))
        aspect_deg = (math.degrees(math.atan2(-mean_gy, mean_gx)) + 360.0) % 360.0

        directions = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"]
        dir_idx = int((aspect_deg + 22.5) // 45) % 8
        dominant_direction = f"{directions[dir_idx]} ({round(aspect_deg, 1)}°)"

        # Local Minimum and Waterlogging Severity Calculation
        waterlogging_zones: List[List[float]] = []
        zone_details: List[Dict[str, Any]] = []
        high_risk_count = 0
        moderate_risk_count = 0
        low_risk_count = 0

        for r in range(rows):
            for c in range(cols):
                if not mask[r, c]:
                    continue

                curr_z = float(elevation_grid[r, c])
                curr_lat = float(grid_lats[r, c])
                curr_lng = float(grid_lngs[r, c])
                curr_slope = float(slope_percent[r, c])

                # Gather neighbor elevations
                neighbor_vals = []
                for dr in [-1, 0, 1]:
                    for dc in [-1, 0, 1]:
                        if dr == 0 and dc == 0:
                            continue
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < rows and 0 <= nc < cols:
                            neighbor_vals.append(float(elevation_grid[nr, nc]))

                is_local_min = False
                depression_depth = 0.0

                if neighbor_vals:
                    min_neighbor = min(neighbor_vals)
                    avg_neighbor = sum(neighbor_vals) / len(neighbor_vals)
                    if curr_z <= min_neighbor:
                        is_local_min = True
                        depression_depth = max(0.0, avg_neighbor - curr_z)
                    elif curr_z < avg_neighbor:
                        depression_depth = max(0.0, avg_neighbor - curr_z)

                # Normalized elevation component (0 at max elevation, 1 at min elevation)
                elevation_deficit = (max_elev - curr_z) / elev_range  # [0, 1]

                # Sluggish drainage component: low slopes (< 1.5%) retain water
                flatness_factor = max(0.0, min(1.0, (1.5 - curr_slope) / 1.5))

                # Compute weighted severity score in [0.0, 1.0]
                if is_local_min:
                    # True sinkhole/depression in terrain
                    severity = 0.65 + 0.25 * elevation_deficit + 0.10 * min(depression_depth / 0.5, 1.0)
                else:
                    # General terrain pooling probability
                    severity = (0.55 * elevation_deficit) + (0.25 * flatness_factor) + (0.20 * min(depression_depth / 0.4, 1.0))

                severity = round(float(np.clip(severity, 0.0, 1.0)), 3)

                # Categorize risk counts
                if severity >= 0.70:
                    high_risk_count += 1
                elif severity >= 0.40:
                    moderate_risk_count += 1
                else:
                    low_risk_count += 1

                # Standard contract format: [lng, lat, severity]
                waterlogging_zones.append([
                    round(curr_lng, 6),
                    round(curr_lat, 6),
                    severity
                ])

                zone_details.append({
                    "lng": round(curr_lng, 6),
                    "lat": round(curr_lat, 6),
                    "severity": severity,
                    "elevation": round(curr_z, 2),
                    "is_local_min": is_local_min,
                    "depression_depth": round(depression_depth, 2),
                    "slope_percent": round(curr_slope, 2),
                })

        # Area computations
        area_sqm = self.calculate_polygon_area_sqm(coordinates)
        area_acres = area_sqm * 0.000247105
        area_hectares = area_sqm * 0.0001

        valid_slopes = slope_percent[mask]
        avg_slope = float(np.mean(valid_slopes)) if len(valid_slopes) > 0 else 0.0

        metrics = TerrainMetrics(
            min_elevation=round(min_elev, 2),
            max_elevation=round(max_elev, 2),
            elevation_range=round(elev_range, 2),
            average_elevation=round(mean_elev, 2),
            total_area_sqm=round(area_sqm, 1),
            total_area_acres=round(area_acres, 2),
            total_area_hectares=round(area_hectares, 3),
            high_risk_points_count=high_risk_count,
            moderate_risk_points_count=moderate_risk_count,
            low_risk_points_count=low_risk_count,
            dominant_slope_direction=dominant_direction,
            average_slope_percent=round(avg_slope, 2)
        )

        # Concise summary
        if high_risk_count > 0:
            summary = (
                f"Identified {high_risk_count} critical pooling depressions in the field with severe waterlogging risk. "
                f"Field elevation spans {round(min_elev, 1)}m to {round(max_elev, 1)}m (relief: {round(elev_range, 2)}m). "
                f"Surface runoff predominantly flows toward {dominant_direction}."
            )
        else:
            summary = (
                f"Field exhibits relatively uniform drainage grade toward {dominant_direction}. "
                f"Total relief is {round(elev_range, 2)}m with {moderate_risk_count} moderate accumulation zones."
            )

        return waterlogging_zones, zone_details, metrics, summary

