import math
import heapq
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

class DrainageRoutingService:
    def __init__(self):
        pass

    def calculate_drainage_routes(
        self,
        grid_lats: np.ndarray,
        grid_lngs: np.ndarray,
        elevation_grid: np.ndarray,
        mask: np.ndarray,
        waterlogging_zones: List[List[float]],
        bbox: Dict[str, float],
        metrics: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculates optimal gravitational surface drainage ditch routes using A* pathfinding.
        Finds the least-resistance path from every severe sink (local minimum) to the
        optimal natural escape point along the field boundary.
        Supports multi-catchment routing across watershed divides (mountain ridges),
        ensuring both opposing flanks receive dedicated drainage routes to their respective outlets.
        """
        rows, cols = elevation_grid.shape
        routes: List[Dict[str, Any]] = []

        # Identify candidate boundary outlet cells (boundary of the polygon mask)
        boundary_cells = []
        for r in range(rows):
            for c in range(cols):
                if not mask[r, c]:
                    continue
                # If any 4-neighbor is outside mask or grid boundary, it's a boundary cell
                is_boundary = False
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nr, nc = r + dr, c + dc
                    if not (0 <= nr < rows and 0 <= nc < cols) or not mask[nr, nc]:
                        is_boundary = True
                        break
                if is_boundary:
                    boundary_cells.append((r, c, float(elevation_grid[r, c])))

        if not boundary_cells:
            # Fallback to outer perimeter of the grid
            for r in range(rows):
                boundary_cells.append((r, 0, float(elevation_grid[r, 0])))
                boundary_cells.append((r, cols - 1, float(elevation_grid[r, cols - 1])))
            for c in range(cols):
                boundary_cells.append((0, c, float(elevation_grid[0, c])))
                boundary_cells.append((rows - 1, c, float(elevation_grid[rows - 1, c])))

        # Spatial resolution in meters
        mean_lat = float(np.mean(grid_lats))
        lat_rad = math.radians(mean_lat)
        dy_m = abs(float(grid_lats[0, 0] - grid_lats[-1, 0])) / max(rows - 1, 1) * 111320.0
        dx_m = abs(float(grid_lngs[0, -1] - grid_lngs[0, 0])) / max(cols - 1, 1) * (111320.0 * math.cos(lat_rad))

        c_lat = (bbox["min_lat"] + bbox["max_lat"]) / 2.0
        c_lng = (bbox["min_lng"] + bbox["max_lng"]) / 2.0

        is_divide = bool(metrics and getattr(metrics, 'is_watershed_divide', False))
        divide_type = str(getattr(metrics, 'watershed_divide_type', '')) if is_divide else ''

        # Map each waterlogging zone point to (r, c)
        zone_points_with_rc = []
        for z in waterlogging_zones:
            lng, lat, sev = z[0], z[1], z[2]
            dist_sq = (grid_lngs - lng)**2 + (grid_lats - lat)**2
            zr, zc = np.unravel_index(np.argmin(dist_sq), dist_sq.shape)
            zone_points_with_rc.append({
                "lng": lng,
                "lat": lat,
                "severity": sev,
                "r": zr,
                "c": zc,
                "elev": float(elevation_grid[zr, zc])
            })

        # Selection of sink-outlet pairs based on watershed structure
        sink_outlet_pairs: List[Tuple[Dict[str, Any], Tuple[int, int]]] = []
        used_outlets: List[Tuple[int, int]] = []

        def find_best_outlet(start_r: int, start_c: int, candidates: List[Tuple[int, int, float]]) -> Tuple[int, int]:
            # Filter candidates that are not right on top of start cell
            valid = [b for b in candidates if math.hypot(b[0] - start_r, b[1] - start_c) >= 2.0]
            if not valid:
                valid = candidates

            # Exclude or heavily penalize outlets too close to already used outlets (< 3 cells away)
            def outlet_cost(b):
                elev_cost = b[2]
                dist_m = math.hypot((b[0] - start_r) * dy_m, (b[1] - start_c) * dx_m)
                penalty = 0.0
                for ur, uc in used_outlets:
                    if math.hypot(b[0] - ur, b[1] - uc) < 3.0:
                        penalty += 50.0  # Encourage distinct, separate outlets
                return elev_cost + 0.15 * (dist_m / 100.0) + penalty

            best = min(valid, key=outlet_cost)
            return (best[0], best[1])

        if is_divide:
            # Dual-catchment routing across the mountain ridge
            is_ns_divide = "North-South" in divide_type
            if is_ns_divide:
                flank_a_sinks = [z for z in zone_points_with_rc if z["lat"] >= c_lat]
                flank_b_sinks = [z for z in zone_points_with_rc if z["lat"] < c_lat]
                flank_a_boundary = [b for b in boundary_cells if grid_lats[b[0], b[1]] >= c_lat]
                flank_b_boundary = [b for b in boundary_cells if grid_lats[b[0], b[1]] < c_lat]
            else:
                flank_a_sinks = [z for z in zone_points_with_rc if z["lng"] < c_lng]
                flank_b_sinks = [z for z in zone_points_with_rc if z["lng"] >= c_lng]
                flank_a_boundary = [b for b in boundary_cells if grid_lngs[b[0], b[1]] < c_lng]
                flank_b_boundary = [b for b in boundary_cells if grid_lngs[b[0], b[1]] >= c_lng]

            if not flank_a_boundary: flank_a_boundary = boundary_cells
            if not flank_b_boundary: flank_b_boundary = boundary_cells

            # Select top sink on Flank A
            if flank_a_sinks:
                sink_a = max(flank_a_sinks, key=lambda z: (z["severity"], -z["elev"]))
                out_a = find_best_outlet(sink_a["r"], sink_a["c"], flank_a_boundary)
                used_outlets.append(out_a)
                sink_outlet_pairs.append((sink_a, out_a))

            # Select top sink on Flank B
            if flank_b_sinks:
                sink_b = max(flank_b_sinks, key=lambda z: (z["severity"], -z["elev"]))
                out_b = find_best_outlet(sink_b["r"], sink_b["c"], flank_b_boundary)
                used_outlets.append(out_b)
                sink_outlet_pairs.append((sink_b, out_b))

            # Optional 3rd route if a secondary severe sink exists on either flank
            remaining_sinks = [
                z for z in zone_points_with_rc
                if all(math.hypot(z["r"] - pair[0]["r"], z["c"] - pair[0]["c"]) >= 3.0 for pair in sink_outlet_pairs)
            ]
            if remaining_sinks:
                sink_c_candidate = max(remaining_sinks, key=lambda z: (z["severity"], -z["elev"]))
                if sink_c_candidate["severity"] >= 0.50:
                    cand_flank_bounds = flank_a_boundary if sink_c_candidate["lng"] < c_lng else flank_b_boundary
                    out_c = find_best_outlet(sink_c_candidate["r"], sink_c_candidate["c"], cand_flank_bounds)
                    used_outlets.append(out_c)
                    sink_outlet_pairs.append((sink_c_candidate, out_c))
        else:
            # Single uniform catchment: select top 2-3 spatially separated sinks
            sorted_sinks = sorted(zone_points_with_rc, key=lambda z: (-z["severity"], z["elev"]))
            selected_sinks = []
            for s in sorted_sinks:
                if len(selected_sinks) >= 3:
                    break
                if all(math.hypot(s["r"] - prev["r"], s["c"] - prev["c"]) >= 3.0 for prev in selected_sinks):
                    selected_sinks.append(s)

            if not selected_sinks and zone_points_with_rc:
                selected_sinks = [sorted_sinks[0]]

            for s in selected_sinks:
                out = find_best_outlet(s["r"], s["c"], boundary_cells)
                used_outlets.append(out)
                sink_outlet_pairs.append((s, out))

        for idx, (sink_info, target_cell) in enumerate(sink_outlet_pairs):
            start_r, start_c = sink_info["r"], sink_info["c"]
            sink_lng, sink_lat = sink_info["lng"], sink_info["lat"]
            severity = sink_info["severity"]
            target_r, target_c = target_cell[0], target_cell[1]

            # Run A* Pathfinding
            path_cells = self._astar_search(
                start=(start_r, start_c),
                goal=(target_r, target_c),
                elevation_grid=elevation_grid,
                mask=mask,
                dx_m=dx_m,
                dy_m=dy_m
            )

            if len(path_cells) < 2:
                path_cells = [(start_r, start_c), (target_r, target_c)]

            path_coords = []
            path_elevs = []
            total_length = 0.0

            for i, (pr, pc) in enumerate(path_cells):
                p_lng = round(float(grid_lngs[pr, pc]), 6)
                p_lat = round(float(grid_lats[pr, pc]), 6)
                p_z = round(float(elevation_grid[pr, pc]), 2)
                path_coords.append([p_lng, p_lat])
                path_elevs.append(p_z)

                if i > 0:
                    prev_r, prev_c = path_cells[i - 1]
                    seg_dist = math.hypot((pr - prev_r) * dy_m, (pc - prev_c) * dx_m)
                    total_length += seg_dist

            start_z = path_elevs[0]
            end_z = path_elevs[-1]
            elev_drop = max(0.0, start_z - end_z)
            avg_slope = (elev_drop / max(total_length, 1.0)) * 100.0

            avg_cut_depth = 0.65  # meters
            ditch_bottom_width = 0.5  # meters
            cross_section_area = (ditch_bottom_width + avg_cut_depth) * avg_cut_depth
            excavation_m3 = round(cross_section_area * total_length, 1)
            estimated_cost_inr = round(excavation_m3 * 180.0)

            routes.append({
                "route_id": f"route-{idx + 1}",
                "sink_point": [sink_lng, sink_lat],
                "outlet_point": [path_coords[-1][0], path_coords[-1][1]],
                "path_coordinates": path_coords,
                "path_elevations": path_elevs,
                "length_meters": round(total_length, 1),
                "elevation_drop_meters": round(elev_drop, 2),
                "slope_percent": round(avg_slope, 2),
                "excavation_volume_m3": excavation_m3,
                "estimated_cost_inr": estimated_cost_inr,
                "recommended_ditch_type": "Perforated French Drain with Gravel Bed" if avg_slope < 1.0 else "Open Trapezoidal Grassed Swale",
                "severity": severity
            })

        return routes

    def _astar_search(
        self,
        start: Tuple[int, int],
        goal: Tuple[int, int],
        elevation_grid: np.ndarray,
        mask: np.ndarray,
        dx_m: float,
        dy_m: float
    ) -> List[Tuple[int, int]]:
        """
        A* algorithm with terrain gravitation cost function.
        Favors downhill paths while penalizing uphill cuts.
        """
        rows, cols = elevation_grid.shape
        open_set = []
        heapq.heappush(open_set, (0.0, start))

        came_from = {}
        g_score = {start: 0.0}

        def heuristic(cell):
            # Euclidean distance to goal
            dr = (cell[0] - goal[0]) * dy_m
            dc = (cell[1] - goal[1]) * dx_m
            return math.hypot(dr, dc)

        while open_set:
            _, current = heapq.heappop(open_set)

            if current == goal:
                # Reconstruct path
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                return path

            cr, cc = current
            cz = float(elevation_grid[cr, cc])

            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
                nr, nc = cr + dr, cc + dc
                if not (0 <= nr < rows and 0 <= nc < cols):
                    continue
                # Keep path inside field polygon
                if not mask[nr, nc]:
                    continue

                neighbor = (nr, nc)
                nz = float(elevation_grid[nr, nc])

                # Spatial distance
                step_dist = math.hypot(dr * dy_m, dc * dx_m)

                # Cost function:
                # Strongly favor downhill flow (nz < cz); heavily penalize uphill cut (nz > cz)
                delta_z = nz - cz
                if delta_z > 0:
                    elevation_penalty = delta_z * 8.0  # Uphill excavation penalty
                else:
                    elevation_penalty = delta_z * 0.5  # Downhill gravitational bonus

                tentative_g = g_score[current] + step_dist + max(elevation_penalty, -step_dist * 0.4)

                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score = tentative_g + heuristic(neighbor)
                    heapq.heappush(open_set, (f_score, neighbor))

        # If goal was unreachable due to strict mask boundaries, return straight line to goal
        return [start, goal]
