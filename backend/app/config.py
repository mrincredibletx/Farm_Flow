import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Agricultural Drainage System"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # External API Keys
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    MAPBOX_ACCESS_TOKEN: str = os.getenv("MAPBOX_ACCESS_TOKEN", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    TOMORROW_IO_API_KEY: str = os.getenv("TOMORROW_IO_API_KEY", "")
    
    # Optional Database & Storage
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./drainage_system.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Grid settings for terrain sampling
    DEFAULT_GRID_RESOLUTION: int = 18
    MAX_GRID_RESOLUTION: int = 40
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

