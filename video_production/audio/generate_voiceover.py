import asyncio
import os
import edge_tts
from edge_tts import Communicate

# Define scenes with narration text and planned cues
SCENES = [
    {
        "id": "scene_01",
        "title": "Cinematic Opening",
        "text": "When water becomes the single greatest threat to agriculture, billions of dollars in global crop yields are lost overnight. Across millions of agricultural fields worldwide, unpredictable rainfall and poorly drained terrain trigger severe waterlogging, suffocating root systems and transforming fertile soil into unproductive floodplains.",
        "start_est": 0.0
    },
    {
        "id": "scene_02",
        "title": "The Real-World Problem",
        "text": "Traditional drainage planning relies on slow, expensive manual surveying and guesswork. Subtle elevation depressions, invisible to the human eye, trap surface runoff, forming stagnant hydrological sinks. Without precision topographic modeling, surface runoff flows uncontrollably, accelerating topsoil erosion and devastating seasonal harvests.",
        "start_est": 15.0
    },
    {
        "id": "scene_03",
        "title": "Introducing Our Solution",
        "text": "Introducing the Smart Agricultural Drainage and Precision Land Grading System. A unified, AI-driven geospatial intelligence platform developed at UEM Jaipur, engineered to transform satellite elevation data into actionable, millimeter-precise drainage networks and optimal land-grading strategies.",
        "start_est": 35.0
    },
    {
        "id": "scene_04",
        "title": "3D Terrain & Drone Hydrology",
        "text": "By fusing high-resolution digital elevation models with Gaussian spatial filtering and numerical gradient analysis, the system constructs an interactive three-dimensional digital twin of any agricultural field. Topographic curvature algorithms locate localized depression sinks and identify natural watershed divide boundaries. Gravitational flow vectors reveal the exact trajectory of surface runoff, while a multi-catchment heuristic A-star pathfinding engine autonomously computes the mathematically optimal routes for agricultural drainage trenches, minimizing excavation depth while maintaining continuous downhill flow.",
        "start_est": 50.0
    },
    {
        "id": "scene_05",
        "title": "Actual Application Demonstration",
        "text": "Inside the live interactive dashboard, farmers and agronomists can delineate field boundaries or select preset research plots with a single click. The platform instantly analyzes ground elevation profiles and highlights waterlogging vulnerability across critical, moderate, and well-drained zones. Users can toggle between existing terrain and laser-graded design surfaces, run real-time 3D rainfall inundation simulations, model SCS curve number runoff kinetics under dynamic soil saturation, and receive instant, crop-specific agronomic advisories powered by generative artificial intelligence.",
        "start_est": 80.0
    },
    {
        "id": "scene_06",
        "title": "Technical Architecture",
        "text": "Under the hood, the system features a high-performance decoupled architecture. A modern Next.js 14 frontend renders dynamic Three.js WebGL terrain meshes alongside responsive Leaflet GIS maps. The FastAPI Python backend powers high-throughput hydrological computing using NumPy vectorization, SciPy spatial filters, and custom least-squares planar grading algorithms, seamlessly integrated with Google Gemini AI for expert agronomic intelligence.",
        "start_est": 115.0
    },
    {
        "id": "scene_07",
        "title": "Impact & Closing",
        "text": "From uncontrolled inundation to automated, precision-guided drainage. From manual surveying to autonomous geospatial intelligence. This is the future of sustainable farming and climate-resilient water management. Smarter Terrain. Intelligent Drainage. Better Agriculture. A Final-Year B.Tech Capstone Project, University of Engineering and Management, Jaipur.",
        "start_est": 135.0
    }
]

VOICE = "en-US-ChristopherNeural"
RATE = "-3%"  # Slightly slower for authoritative, documentary-style delivery
PITCH = "-1Hz"

async def generate_scene_audio(scene, output_dir):
    out_path = os.path.join(output_dir, f"{scene['id']}.mp3")
    print(f"Generating audio for {scene['id']}...")
    communicate = Communicate(scene["text"], voice=VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(out_path)
    print(f"Saved: {out_path} ({os.path.getsize(out_path)} bytes)")
    return out_path

async def main():
    audio_dir = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\audio"
    os.makedirs(audio_dir, exist_ok=True)
    
    for scene in SCENES:
        await generate_scene_audio(scene, audio_dir)

if __name__ == "__main__":
    asyncio.run(main())
