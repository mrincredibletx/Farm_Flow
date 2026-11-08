from typing import Dict, Any

class HydrologicalRiskService:
    def __init__(self):
        # Soil characteristics: [K_sat (mm/hr), SCS Curve Number (CN), Porosity (%)]
        self.SOIL_PROPERTIES = {
            "clay": {"name": "Heavy Clay / Vertisol", "k_sat": 1.2, "cn": 86, "porosity": 0.48},
            "black_cotton": {"name": "Black Cotton Soil", "k_sat": 0.8, "cn": 89, "porosity": 0.52},
            "silt_loam": {"name": "Silt Loam", "k_sat": 8.5, "cn": 75, "porosity": 0.45},
            "alluvial": {"name": "Indo-Gangetic Alluvial", "k_sat": 9.0, "cn": 74, "porosity": 0.43},
            "sandy_loam": {"name": "Sandy Loam", "k_sat": 22.0, "cn": 64, "porosity": 0.40},
        }

    def simulate_scenario(
        self,
        soil_type: str = "clay",
        rainfall_mm: float = 65.0,
        area_sqm: float = 117600.0,
        high_risk_points_count: int = 12,
        relief_meters: float = 3.5
    ) -> Dict[str, Any]:
        """
        Simulates waterlogging accumulation, infiltration kinetics, and crop yield damage
        under given soil and precipitation scenarios using USDA-SCS Curve Number hydrology.
        """
        soil_key = soil_type.lower().replace(" ", "_")
        soil = self.SOIL_PROPERTIES.get(soil_key, self.SOIL_PROPERTIES["clay"])

        cn = soil["cn"]
        k_sat = soil["k_sat"]

        # Maximum soil water retention capacity S (mm)
        s_retention = (25400.0 / cn) - 254.0
        # Initial abstraction (interception + surface storage)
        initial_abstraction = 0.2 * s_retention

        # Direct surface runoff depth Q (mm) via SCS-CN Method
        if rainfall_mm > initial_abstraction:
            numerator = (rainfall_mm - initial_abstraction) ** 2
            denominator = (rainfall_mm - initial_abstraction + s_retention)
            runoff_depth_mm = numerator / denominator
        else:
            runoff_depth_mm = 0.0

        # Infiltrated depth
        infiltrated_depth_mm = max(0.0, rainfall_mm - runoff_depth_mm)

        # Runoff volume across the field (m3)
        runoff_volume_m3 = round((runoff_depth_mm / 1000.0) * area_sqm, 1)
        runoff_volume_megaliters = round(runoff_volume_m3 / 1000.0, 2)

        # Concentrated accumulation in low-lying depressions (sinks)
        sink_concentration_factor = max(1.2, min(3.5, 1.0 + (high_risk_points_count * 0.08)))
        ponding_depth_cm = round((runoff_depth_mm * sink_concentration_factor) / 10.0, 1)

        # Time to drain / percolation time (hours)
        drainage_time_hours = round(max(2.0, (runoff_depth_mm * sink_concentration_factor) / max(k_sat, 0.5)), 1)

        # Crop Loss & Root Hypoxia Risk percentage
        # Crop roots begin suffering irreversible hypoxic necrosis after 24-48 hours of saturation
        if drainage_time_hours > 72.0:
            crop_loss_risk = min(95.0, 60.0 + (drainage_time_hours - 72.0) * 0.4)
            risk_level = "CRITICAL (Severe Root Rot & Hypoxia)"
        elif drainage_time_hours > 48.0:
            crop_loss_risk = 45.0 + (drainage_time_hours - 48.0) * 0.6
            risk_level = "HIGH (Substantial Stunting & Yield Drop)"
        elif drainage_time_hours > 24.0:
            crop_loss_risk = 20.0 + (drainage_time_hours - 24.0) * 1.0
            risk_level = "MODERATE (Temporary Chlorosis)"
        else:
            crop_loss_risk = max(5.0, drainage_time_hours * 0.6)
            risk_level = "LOW (Safe Natural Drainage)"

        crop_loss_risk = round(min(100.0, max(0.0, crop_loss_risk)), 1)

        return {
            "soil_type": soil_type,
            "soil_name": soil["name"],
            "k_sat_mm_per_hr": k_sat,
            "curve_number": cn,
            "rainfall_event_mm": rainfall_mm,
            "runoff_depth_mm": round(runoff_depth_mm, 2),
            "runoff_volume_m3": runoff_volume_m3,
            "runoff_volume_megaliters": runoff_volume_megaliters,
            "estimated_ponding_depth_cm": ponding_depth_cm,
            "drainage_time_hours": drainage_time_hours,
            "crop_loss_risk_percent": crop_loss_risk,
            "risk_level": risk_level,
        }
