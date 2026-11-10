import numpy as np
from typing import Dict, Any, List, Tuple, Optional

class CutFillService:
    """
    Precision Land Grading & Earthwork Service (Civil / Precision Agriculture).
    Calculates Best-Fit Planar Grading, Cut & Fill Volumes, Cut:Fill Expansion Ratio,
    and Design Slope/Heading for uniform drainage leveling.
    """

    def calculate_cut_fill(
        self,
        elevation_grid: List[List[float]],
        bbox: Dict[str, float],
        target_cut_fill_ratio: float = 1.20
    ) -> Dict[str, Any]:
        """
        Fits an optimal least-squares plane to the DEM elevation grid,
        balances Cut and Fill volumes for soil compaction,
        and computes per-cell cut/fill depths and earthwork statistics.
        """
        Z = np.array(elevation_grid, dtype=float)
        rows, cols = Z.shape
        if rows < 2 or cols < 2:
            return {}

        min_lng, max_lng = bbox["min_lng"], bbox["max_lng"]
        min_lat, max_lat = bbox["min_lat"], bbox["max_lat"]

        # Approximate metric dimensions using WGS-84 geodesic scaling
        center_lat = (min_lat + max_lat) / 2.0
        meters_per_deg_lat = 111320.0
        meters_per_deg_lng = 111320.0 * np.cos(np.radians(center_lat))

        width_m = max((max_lng - min_lng) * meters_per_deg_lng, 10.0)
        height_m = max((max_lat - min_lat) * meters_per_deg_lat, 10.0)
        total_area_sqm = width_m * height_m
        cell_area_sqm = total_area_sqm / (rows * cols)

        # Build coordinate matrices in meters centered at field centroid
        x_coords = np.linspace(-width_m / 2.0, width_m / 2.0, cols)
        y_coords = np.linspace(height_m / 2.0, -height_m / 2.0, rows) # Top row is North
        X, Y = np.meshgrid(x_coords, y_coords)

        # Flatten for Least Squares plane fitting: Z = a*X + b*Y + c
        A = np.column_stack([X.ravel(), Y.ravel(), np.ones_like(X.ravel())])
        z_flat = Z.ravel()

        # Least squares solve: (a, b, c)
        plane_params, _, _, _ = np.linalg.lstsq(A, z_flat, rcond=None)
        a, b, c = plane_params

        # Slope gradient & downhill azimuth
        # a is dZ/dX (East-West grade), b is dZ/dY (North-South grade)
        slope_pct = float(np.sqrt(a**2 + b**2) * 100.0)
        # Ensure minimal drainage slope of at least 0.08% if completely flat
        if slope_pct < 0.05:
            slope_pct = 0.08

        # Azimuth of steepest descent (downhill heading)
        # Gradient vector pointing downhill is (-a, -b)
        heading_deg = float((np.degrees(np.arctan2(-a, -b)) + 360.0) % 360.0)

        # Base design plane
        Z_design = a * X + b * Y + c

        # Iteratively balance intercept c to achieve target_cut_fill_ratio (cut_vol / fill_vol ~= 1.20)
        for _ in range(12):
            diff = Z - Z_design # Positive = Cut (ground higher than design), Negative = Fill
            cut_depths = np.maximum(diff, 0.0)
            fill_depths = np.maximum(-diff, 0.0)

            total_cut_m3 = float(np.sum(cut_depths) * cell_area_sqm)
            total_fill_m3 = float(np.sum(fill_depths) * cell_area_sqm)

            if total_fill_m3 <= 0.01:
                break

            current_ratio = total_cut_m3 / total_fill_m3
            ratio_err = current_ratio - target_cut_fill_ratio

            # Adjust plane intercept c: raising c increases fill, lowers cut
            # lowering c increases cut, lowers fill
            c_adjustment = np.clip(ratio_err * 0.03, -0.15, 0.15)
            c -= c_adjustment
            Z_design = a * X + b * Y + c

        diff = Z - Z_design
        cut_depths = np.maximum(diff, 0.0)
        fill_depths = np.maximum(-diff, 0.0)

        total_cut_m3 = round(float(np.sum(cut_depths) * cell_area_sqm), 1)
        total_fill_m3 = round(float(np.sum(fill_depths) * cell_area_sqm), 1)
        actual_ratio = round(total_cut_m3 / max(total_fill_m3, 0.1), 2)

        area_acres = total_area_sqm / 4046.86
        area_hectares = total_area_sqm / 10000.0
        cut_per_acre_m3 = round(total_cut_m3 / max(area_acres, 0.01), 1)
        cut_per_ha_m3 = round(total_cut_m3 / max(area_hectares, 0.01), 1)

        max_cut_m = round(float(np.max(cut_depths)), 2)
        max_fill_m = round(float(np.max(fill_depths)), 2)

        # Build rounded 2D cut/fill matrix: positive = cut (m), negative = fill (m)
        cut_fill_matrix = [[round(float(val), 3) for val in row] for row in diff]
        design_elevation_grid = [[round(float(val), 2) for val in row] for row in Z_design]

        # Estimated leveling cost in INR (standard laser land leveling rate: ~₹85 - ₹120 per m3)
        leveling_cost_inr = round(total_cut_m3 * 95.0)

        return {
            "total_cut_m3": total_cut_m3,
            "total_fill_m3": total_fill_m3,
            "cut_fill_ratio": actual_ratio,
            "cut_per_acre_m3": cut_per_acre_m3,
            "cut_per_ha_m3": cut_per_ha_m3,
            "max_cut_depth_m": max_cut_m,
            "max_fill_depth_m": max_fill_m,
            "design_slope_percent": round(slope_pct, 3),
            "design_heading_degrees": round(heading_deg, 1),
            "heading_compass": self._degrees_to_compass(heading_deg),
            "estimated_leveling_cost_inr": leveling_cost_inr,
            "cut_fill_matrix": cut_fill_matrix,
            "design_elevation_grid": design_elevation_grid
        }

    def sample_elevation_profile(
        self,
        elevation_grid: List[List[float]],
        design_grid: Optional[List[List[float]]],
        bbox: Dict[str, float],
        start_pt: Tuple[float, float], # [lng, lat]
        end_pt: Tuple[float, float],   # [lng, lat]
        num_samples: int = 40
    ) -> List[Dict[str, Any]]:
        """
        Samples an elevation transect line across the field DEM
        between start_pt and end_pt for interactive 2D cross-section charts.
        """
        Z = np.array(elevation_grid, dtype=float)
        rows, cols = Z.shape
        if rows < 2 or cols < 2:
            return []

        Z_des = np.array(design_grid, dtype=float) if design_grid else None

        min_lng, max_lng = bbox["min_lng"], bbox["max_lng"]
        min_lat, max_lat = bbox["min_lat"], bbox["max_lat"]

        span_lng = max(max_lng - min_lng, 1e-6)
        span_lat = max(max_lat - min_lat, 1e-6)

        center_lat = (min_lat + max_lat) / 2.0
        m_per_lat = 111320.0
        m_per_lng = 111320.0 * np.cos(np.radians(center_lat))

        # Total distance between endpoints in meters
        d_lng_m = (end_pt[0] - start_pt[0]) * m_per_lng
        d_lat_m = (end_pt[1] - start_pt[1]) * m_per_lat
        total_dist_m = float(np.sqrt(d_lng_m**2 + d_lat_m**2))

        profile_points = []
        for i in range(num_samples):
            t = i / float(num_samples - 1)
            cur_lng = start_pt[0] + t * (end_pt[0] - start_pt[0])
            cur_lat = start_pt[1] + t * (end_pt[1] - start_pt[1])
            cur_dist_m = round(t * total_dist_m, 1)

            # Normalized grid indices
            col_f = (cur_lng - min_lng) / span_lng * (cols - 1)
            row_f = (max_lat - cur_lat) / span_lat * (rows - 1) # row 0 is max_lat

            c0 = int(np.clip(np.floor(col_f), 0, cols - 1))
            c1 = int(np.clip(np.ceil(col_f), 0, cols - 1))
            r0 = int(np.clip(np.floor(row_f), 0, rows - 1))
            r1 = int(np.clip(np.ceil(row_f), 0, rows - 1))

            dc = col_f - c0
            dr = row_f - r0

            # Bilinear interpolation for natural ground
            elev = (
                Z[r0, c0] * (1 - dc) * (1 - dr) +
                Z[r0, c1] * dc * (1 - dr) +
                Z[r1, c0] * (1 - dc) * dr +
                Z[r1, c1] * dc * dr
            )

            # Bilinear interpolation for design grade
            design_elev = elev
            if Z_des is not None and Z_des.shape == Z.shape:
                design_elev = (
                    Z_des[r0, c0] * (1 - dc) * (1 - dr) +
                    Z_des[r0, c1] * dc * (1 - dr) +
                    Z_des[r1, c0] * (1 - dc) * dr +
                    Z_des[r1, c1] * dc * dr
                )

            profile_points.append({
                "index": i,
                "distance_m": cur_dist_m,
                "lng": round(cur_lng, 6),
                "lat": round(cur_lat, 6),
                "elevation_m": round(float(elev), 2),
                "design_elevation_m": round(float(design_elev), 2),
                "cut_m": round(max(float(elev - design_elev), 0.0), 2),
                "fill_m": round(max(float(design_elev - elev), 0.0), 2)
            })

        return profile_points

    def _degrees_to_compass(self, deg: float) -> str:
        val = int((deg / 22.5) + 0.5) % 16
        directions = [
            "North", "North-Northeast", "Northeast", "East-Northeast",
            "East", "East-Southeast", "Southeast", "South-Southeast",
            "South", "South-Southwest", "Southwest", "West-Southwest",
            "West", "West-Northwest", "Northwest", "North-Northwest"
        ]
        return directions[val]
