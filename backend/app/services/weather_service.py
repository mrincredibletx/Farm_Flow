import os
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.openweather_api_key = os.getenv("OPENWEATHER_API_KEY", "")
        self.tomorrow_io_api_key = os.getenv("TOMORROW_IO_API_KEY", "")
        self.http_timeout = httpx.Timeout(connect=2.5, read=4.0, write=2.5, pool=2.5)

    async def fetch_current_rainfall(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Fetches live local rainfall (mm) and meteorological data for the field.
        Tier 1: OpenWeatherMap Current & Rain API
        Tier 2: Tomorrow.io Real-time Weather API
        Tier 3: Historical Climatological Default (65.0 mm event)
        """
        if self.openweather_api_key:
            data = await self._fetch_openweather(lat, lng)
            if data:
                return data

        if self.tomorrow_io_api_key:
            data = await self._fetch_tomorrow(lat, lng)
            if data:
                return data

        return {
            "source": "Default Scenario Simulation",
            "rainfall_event_mm": 65.0,
            "recorded_rain_1h_mm": 0.0,
            "condition": "Simulated Monsoon Downpour",
            "temperature_c": 28.0,
            "humidity_percent": 75,
            "wind_speed_mps": 2.5,
            "location_name": f"{lat:.3f}, {lng:.3f}",
            "is_live": False
        }

    async def _fetch_openweather(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        try:
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                "lat": lat,
                "lon": lng,
                "appid": self.openweather_api_key,
                "units": "metric"
            }
            async with httpx.AsyncClient(timeout=self.http_timeout) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    d = resp.json()
                    # Check rain mm in last 1h / 3h
                    rain_mm = float(d.get("rain", {}).get("1h", 0.0))
                    if rain_mm == 0.0:
                        rain_mm = float(d.get("rain", {}).get("3h", 0.0))

                    weather_desc = d.get("weather", [{}])[0].get("description", "Clear").title()
                    temp = float(d.get("main", {}).get("temp", 28.0))
                    humidity = int(d.get("main", {}).get("humidity", 50))
                    wind_speed = float(d.get("wind", {}).get("speed", 2.0))
                    location_name = d.get("name") or f"{lat:.3f}, {lng:.3f}"

                    # If currently dry, use 35mm as the standard design storm scenario
                    effective_rainfall = rain_mm if rain_mm > 0 else 35.0

                    return {
                        "source": "OpenWeatherMap Live API",
                        "rainfall_event_mm": round(effective_rainfall, 1),
                        "recorded_rain_1h_mm": round(rain_mm, 1),
                        "condition": weather_desc,
                        "temperature_c": round(temp, 1),
                        "humidity_percent": humidity,
                        "wind_speed_mps": round(wind_speed, 1),
                        "location_name": location_name,
                        "is_live": True
                    }
        except Exception as e:
            logger.warning(f"OpenWeatherMap query failed: {e}")
        return None

    async def _fetch_tomorrow(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        try:
            url = f"https://api.tomorrow.io/v4/weather/realtime?location={lat},{lng}&apikey={self.tomorrow_io_api_key}"
            async with httpx.AsyncClient(timeout=self.http_timeout) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    d = resp.json().get("data", {}).get("values", {})
                    rain_intensity = float(d.get("rainIntensity", 0.0))
                    temp = float(d.get("temperature", 28.0))
                    humidity = int(d.get("humidity", 50))
                    wind_speed = float(d.get("windSpeed", 2.0))

                    effective_rainfall = rain_intensity * 3.0 if rain_intensity > 0 else 35.0

                    return {
                        "source": "Tomorrow.io Live API",
                        "rainfall_event_mm": round(effective_rainfall, 1),
                        "recorded_rain_1h_mm": round(rain_intensity, 1),
                        "condition": "Realtime Meteorological Feed",
                        "temperature_c": round(temp, 1),
                        "humidity_percent": humidity,
                        "wind_speed_mps": round(wind_speed, 1),
                        "location_name": f"{lat:.3f}, {lng:.3f}",
                        "is_live": True
                    }
        except Exception as e:
            logger.warning(f"Tomorrow.io query failed: {e}")
        return None
