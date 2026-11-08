import sys
import os
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    print("Testing GET /api/v1/health...")
    response = client.get("/api/v1/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    print("Health response:", data)
    assert data["status"] == "healthy"
    print("Health check passed!\n")

def test_sample_fields():
    print("Testing GET /api/v1/sample-fields...")
    response = client.get("/api/v1/sample-fields")
    assert response.status_code == 200
    data = response.json()
    assert len(data.get("fields", [])) > 0
    print(f"Sample fields count: {len(data['fields'])}")
    print("Sample fields passed!\n")

def test_analyze_terrain():
    print("Testing POST /api/v1/analyze-terrain with UEM Jaipur Research Field coords...")
    payload = {
        "coordinates": [
            [75.9238, 26.9845],
            [75.9272, 26.9848],
            [75.9278, 26.9818],
            [75.9242, 26.9815],
            [75.9238, 26.9845]
        ],
        "grid_resolution": 15
    }
    response = client.post("/api/v1/analyze-terrain", json=payload)
    assert response.status_code == 200, f"Got error {response.status_code}: {response.text}"
    data = response.json()
    
    print("Status:", data.get("status"))
    print("Bounding Box:", data.get("bounding_box"))
    print(f"Elevation grid shape: {len(data['elevation_grid'])}x{len(data['elevation_grid'][0])}")
    print(f"Waterlogging zones count: {len(data['waterlogging_zones'])}")
    if data.get("waterlogging_zones"):
        sample_zone = data["waterlogging_zones"][0]
        print(f"Sample waterlogging zone: lng={sample_zone[0]}, lat={sample_zone[1]}, severity={sample_zone[2]}")
    
    metrics = data.get("metrics", {})
    print("Metrics:", json.dumps(metrics, indent=2))
    print("Summary:", data.get("summary"))
    
    # Contract validation
    assert data["status"] == "success"
    assert "bounding_box" in data
    assert "elevation_grid" in data
    assert "waterlogging_zones" in data
    assert len(data["elevation_grid"]) == 15
    assert len(data["elevation_grid"][0]) == 15
    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_health()
    test_sample_fields()
    test_analyze_terrain()

