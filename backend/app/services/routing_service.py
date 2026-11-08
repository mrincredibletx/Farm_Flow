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
        bbox: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        Calculates optimal gravitational surface drainage ditch routes using A* pathfinding.
        Finds the least-resistance path from every severe sink (local minimum) to the
        optimal natural escape point along the field boundary.
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

        # Find severe sinks (severity >= 0.70)
        severe_sinks = [z for z in waterlogging_zones if z[2] >= 0.70]
        # If no severe sinks, take the top 2 lowest elevation cells
        if not severe_sinks and len(waterlogging_zones) > 0:
            sorted_zones = sorted(waterlogging_zones, key=lambda x: -x[2])
            severe_sinks = sorted_zones[:2]

        # Limit to top 3 critical sinks to keep drainage channel network clean and practical
        top_sinks = sorted(severe_sinks, key=lambda x: -x[2])[:3]

        # Resolution spatial distances in meters
        mean_lat = float(np.mean(grid_lats))
        lat_rad = math.radians(mean_lat)
        dy_m = abs(float(grid_lats[0, 0] - grid_lats[-1, 0])) / max(rows - 1, 1) * 111320.0
        dx_m = abs(float(grid_lngs[0, -1] - grid_lngs[0, 0])) / max(cols - 1, 1) * (111320.0 * math.cos(lat_rad))

        for idx, sink in enumerate(top_sinks):
            sink_lng, sink_lat, severity = sink[0], sink[1], sink[2]

            # Find nearest grid cell for sink
            dist_sq = (grid_lngs - sink_lng)**2 + (grid_lats - sink_lat)**2
            start_r, start_c = np.unravel_index(np.argmin(dist_sq), dist_sq.shape)

            # Filter boundary outlets that are distinct from sink (at least 2 grid units away)
            valid_targets = [b for b in boundary_cells if math.hypot(b[0] - start_r, b[1] - start_c) >= 2.0]
            if not valid_targets:
                valid_targets = [b for b in boundary_cells if (b[0], b[1]) != (start_r, start_c)]
            if not valid_targets:
                valid_targets = boundary_cells

            # Pick target outlet: lowest elevation boundary point with shortest downhill cut
            best_target = min(
                valid_targets,
                key=lambda b: b[2] + 0.2 * math.hypot((b[0] - start_r) * dy_m, (b[1] - start_c) * dx_m) / 100.0
            )
            target_r, target_c = best_target[0], best_target[1]

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
                # Direct straight fallback
                path_cells = [(start_r, start_c), (target_r, target_c)]

            # Convert path cells to geo coordinates and compute ditch engineering metrics
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

            # Earthwork volume calculation (Trapezoidal agricultural ditch: bottom 0.5m, side 1:1, avg depth 0.6m)
            avg_cut_depth = 0.65  # meters
            ditch_bottom_width = 0.5  # meters
            cross_section_area = (ditch_bottom_width + avg_cut_depth) * avg_cut_depth  # ~0.75 m2
            excavation_m3 = round(cross_section_area * total_length, 1)

            # Estimated manual/mini-excavator earthwork cost in INR (~₹180 per m3 in India)
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
