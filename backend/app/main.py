import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router as api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Backend API for Smart Agricultural Drainage & Terrain Intelligence System (Phase I MVP - 7th Semester)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware to allow Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router under /api/v1
app.include_router(api_router, prefix="/api/v1", tags=["Terrain & Hydrology"])

@app.get("/")
def root():
    return {
        "message": "Welcome to Smart Agricultural Drainage & Terrain Intelligence System API",
        "phase": "Phase I MVP (7th Semester)",
        "project_owner": "Rakesh Bangra (B.Tech CSE, UEM Jaipur)",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

