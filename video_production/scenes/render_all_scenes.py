import cv2
import numpy as np
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT"
SCRATCH_FIGS = os.path.join(r"C:\Users\rkban\.gemini\antigravity\brain\630542b1-70f3-4056-8c01-9386c208bf14\scratch", "report_figures")
SCRATCH_IMG = os.path.join(r"C:\Users\rkban\.gemini\antigravity\brain\630542b1-70f3-4056-8c01-9386c208bf14\scratch", "extracted_images")
AUDIO_DIR = os.path.join(BASE_DIR, "video_production", "audio")
SCENES_DIR = os.path.join(BASE_DIR, "video_production", "scenes")
OUTPUT_DIR = os.path.join(BASE_DIR, "video_production", "output")
os.makedirs(SCENES_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

FPS = 30
WIDTH = 1920
HEIGHT = 1080

def get_font(size, bold=False):
    font_names = [
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\calibri.ttf"
    ]
    if bold:
        font_names = [
            "C:\\Windows\\Fonts\\segoeuib.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf",
            "C:\\Windows\\Fonts\\calibrib.ttf"
        ]
    for fn in font_names:
        if os.path.exists(fn):
            try:
                return ImageFont.truetype(fn, size)
            except:
                pass
    return ImageFont.load_default()

def mux_audio_video(video_path, audio_path, output_path):
    print(f"Muxing {video_path} with {audio_path} -> {output_path}...")
    cmd = [
        'ffmpeg', '-y', '-i', video_path, '-i', audio_path,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
        '-c:a', 'aac', '-b:a', '192k',
        '-shortest', output_path
    ]
    subprocess.run(cmd, check=True)

# ==============================================================================
# SCENE 02: THE REAL-WORLD PROBLEM (24.53s)
# ==============================================================================
def render_scene_02():
    out_video = os.path.join(SCENES_DIR, "raw_scene_02.mp4")
    final_video = os.path.join(SCENES_DIR, "scene_02.mp4")
    audio_path = os.path.join(AUDIO_DIR, "scene_02.mp3")
    
    dur = 24.53
    total_frames = int(dur * FPS)
    print(f"Rendering Scene 02: {total_frames} frames ({dur:.2f}s)...")
    
    bg_img_path = os.path.join(SCRATCH_FIGS, "fig_2d_gis_map.jpg")
    bg_orig = cv2.imread(bg_img_path)
    if bg_orig is None:
        bg_orig = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    else:
        bg_orig = cv2.resize(bg_orig, (WIDTH + 300, HEIGHT + 200))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, FPS, (WIDTH, HEIGHT))

    font_title = get_font(38, bold=True)
    font_body = get_font(20)
    font_badge = get_font(16, bold=True)

    for f in range(total_frames):
        t = f / FPS
        # Slow pan across field
        pan_x = int((t / dur) * 200)
        frame = bg_orig[50:50 + HEIGHT, pan_x:pan_x + WIDTH].copy()
        if frame.shape[0] != HEIGHT or frame.shape[1] != WIDTH:
            frame = cv2.resize(frame, (WIDTH, HEIGHT))

        # Animated pulsing radar rings over depression sinks
        pulse_r = int((f * 2.5) % 65) + 15
        alpha_pulse = max(0, 1.0 - pulse_r / 80.0)
        
        # Center sink coordinates on map
        sinks = [(1080, 520), (1220, 580), (950, 480)]
        for sx, sy in sinks:
            cv2.circle(frame, (sx, sy), pulse_r, (0, 0, 255), 2)
            cv2.circle(frame, (sx, sy), 8, (0, 0, 255), -1)

        # Flow arrows heading into sinks
        for i in range(4):
            arr_progress = ((f * 3 + i * 40) % 160)
            cv2.arrowedLine(frame, (850 + arr_progress, 420 + arr_progress//2), (880 + arr_progress, 435 + arr_progress//2), (255, 200, 0), 2, tipLength=0.4)

        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img, 'RGBA')

        # Letterbox bars
        draw.rectangle([0, 0, WIDTH, 75], fill=(0, 0, 0, 255))
        draw.rectangle([0, HEIGHT - 75, WIDTH, HEIGHT], fill=(0, 0, 0, 255))
        draw.text((60, 25), "TOPOGRAPHIC RISK ANALYSIS // VULNERABILITY MAPPING", font=font_badge, fill=(244, 63, 94, 240))
        draw.text((WIDTH - 380, 25), "ELEVATION RELIEF DEFICIT: ΔZ = 4.0m", font=font_badge, fill=(148, 163, 184, 220))

        # Floating Telemetry Callout Card (Left Side)
        draw.rectangle([80, 140, 520, 420], fill=(15, 23, 42, 220), outline=(244, 63, 94, 200), width=2)
        draw.rectangle([80, 140, 520, 185], fill=(244, 63, 94, 230))
        draw.text((100, 150), "HYDROLOGICAL BOTTLENECK DETECTED", font=font_badge, fill=(255, 255, 255))

        draw.text((105, 205), "• Stagnant Sinks: 246 Critical Depressions", font=font_body, fill=(254, 205, 211))
        draw.text((105, 245), "• Soil Drainage Class: Poor (Heavy Clay Group D)", font=font_body, fill=(254, 205, 211))
        draw.text((105, 285), "• Root Zone Asphyxiation Risk: SEVERE (85%)", font=font_body, fill=(255, 100, 100))
        draw.text((105, 325), "• Runoff Velocity: Sluggish (< 0.15 m/s)", font=font_body, fill=(226, 232, 240))
        draw.text((105, 365), "• Topsoil Erosion Bottleneck: Active", font=font_body, fill=(251, 191, 36))

        # Floating Pin Annotation on Sink
        draw.rectangle([1110, 480, 1320, 520], fill=(15, 23, 42, 220), outline=(244, 63, 94, 220), width=1)
        draw.text((1125, 490), "SINK #1: -1.85m DEFICIT", font=font_badge, fill=(244, 63, 94))

        frame_final = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        out.write(frame_final)

    out.release()
    mux_audio_video(out_video, audio_path, final_video)
    print("Scene 02 complete!")

# ==============================================================================
# SCENE 03: INTRODUCING OUR SOLUTION (19.63s)
# ==============================================================================
def render_scene_03():
    out_video = os.path.join(SCENES_DIR, "raw_scene_03.mp4")
    final_video = os.path.join(SCENES_DIR, "scene_03.mp4")
    audio_path = os.path.join(AUDIO_DIR, "scene_03.mp3")
    
    dur = 19.63
    total_frames = int(dur * FPS)
    print(f"Rendering Scene 03: {total_frames} frames ({dur:.2f}s)...")

    mesh_img_path = os.path.join(SCRATCH_FIGS, "fig_3d_terrain_mesh.jpg")
    mesh_orig = cv2.imread(mesh_img_path)
    if mesh_orig is None:
        mesh_orig = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    else:
        mesh_orig = cv2.resize(mesh_orig, (WIDTH, HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, FPS, (WIDTH, HEIGHT))

    font_title = get_font(44, bold=True)
    font_sub = get_font(24, bold=True)
    font_badge = get_font(18, bold=True)
    font_meta = get_font(18)

    for f in range(total_frames):
        t = f / FPS
        frame = mesh_orig.copy()

        # Scanning laser beam across 3D terrain
        laser_y = int((t / dur) * HEIGHT)
        cv2.line(frame, (0, laser_y), (WIDTH, laser_y), (255, 240, 0), 2)
        cv2.line(frame, (0, laser_y + 1), (WIDTH, laser_y + 1), (0, 240, 255), 1)

        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img, 'RGBA')

        # Letterbox bars
        draw.rectangle([0, 0, WIDTH, 75], fill=(0, 0, 0, 255))
        draw.rectangle([0, HEIGHT - 75, WIDTH, HEIGHT], fill=(0, 0, 0, 255))
        draw.text((60, 25), "DIGITAL TWIN RECONSTRUCTION // 3D HYPSOMETRIC ELEVATION", font=font_badge, fill=(6, 182, 212, 240))
        draw.text((WIDTH - 420, 25), "UEM JAIPUR CSE CAPSTONE // 2023–2027", font=font_badge, fill=(148, 163, 184, 220))

        # Big Holographic Title Card (Center Glassmorphic Box)
        alpha = min(1.0, t / 1.5)
        draw.rectangle([140, 160, WIDTH - 140, 480], fill=(6, 15, 30, int(230 * alpha)), outline=(6, 182, 212, int(240 * alpha)), width=3)
        draw.rectangle([140, 160, WIDTH - 140, 210], fill=(6, 182, 212, int(60 * alpha)))
        
        draw.text((170, 175), "SYSTEM ARCHITECTURE INITIALIZATION // NEXT-GEN AGTECH", font=font_badge, fill=(6, 182, 212, int(255 * alpha)))
        draw.text((170, 235), "SMART AGRICULTURAL DRAINAGE &", font=font_title, fill=(255, 255, 255, int(255 * alpha)))
        draw.text((170, 290), "PRECISION LAND GRADING SYSTEM", font=font_title, fill=(6, 182, 212, int(255 * alpha)))
        
        draw.text((170, 365), "AI-Powered Terrain Intelligence • 3D Mesh Hydrology • Multi-Catchment A* Ditching • Gemini AI", font=font_sub, fill=(226, 232, 240, int(240 * alpha)))
        draw.text((170, 415), "Department of Computer Science & Engineering | University of Engineering & Management, Jaipur", font=font_meta, fill=(148, 163, 184, int(220 * alpha)))

        frame_final = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        out.write(frame_final)

    out.release()
    mux_audio_video(out_video, audio_path, final_video)
    print("Scene 03 complete!")

# ==============================================================================
# SCENE 04: 3D TERRAIN & DRONE HYDROLOGY (38.54s)
# ==============================================================================
def render_scene_04():
    out_video = os.path.join(SCENES_DIR, "raw_scene_04.mp4")
    final_video = os.path.join(SCENES_DIR, "scene_04.mp4")
    audio_path = os.path.join(AUDIO_DIR, "scene_04.mp3")
    
    dur = 38.54
    total_frames = int(dur * FPS)
    print(f"Rendering Scene 04: {total_frames} frames ({dur:.2f}s)...")

    # Cycle between 3D terrain mesh and mountain ridge divide topography
    mesh1 = cv2.imread(os.path.join(SCRATCH_FIGS, "fig_3d_terrain_mesh.jpg"))
    mesh2 = cv2.imread(os.path.join(SCRATCH_FIGS, "fig_ridge_3d_mesh.jpg"))
    mesh3 = cv2.imread(os.path.join(SCRATCH_FIGS, "fig_ridge_2d_divide.jpg"))

    mesh1 = cv2.resize(mesh1, (WIDTH, HEIGHT)) if mesh1 is not None else np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    mesh2 = cv2.resize(mesh2, (WIDTH, HEIGHT)) if mesh2 is not None else mesh1
    mesh3 = cv2.resize(mesh3, (WIDTH, HEIGHT)) if mesh3 is not None else mesh1

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, FPS, (WIDTH, HEIGHT))

    font_badge = get_font(18, bold=True)
    font_body = get_font(18)
    font_heading = get_font(26, bold=True)

    for f in range(total_frames):
        t = f / FPS
        # Switch views smoothly across the 38 seconds
        if t < 14.0:
            frame = mesh1.copy()
            sub_title = "FEATURE: DIGITAL ELEVATION MODEL & GAUSSIAN SMOOTHING"
            box_text = [
                "• Elevation Relief: 461.0m to 465.0m (ΔZ = 4.0m)",
                "• Gaussian Spatial Smoothing: σ = 1.0 (Staircase Elimination)",
                "• Topographic Curvature ∇²Z: Negative (Localized Sinks)",
                "• Gravitational Runoff Vector: East 87.2° (Slope: 4.85%)"
            ]
        elif t < 26.0:
            frame = mesh2.copy()
            sub_title = "FEATURE: MOUNTAIN RIDGE & WATERSHED DIVIDE FLANK DETECTION"
            box_text = [
                "• Topographic Ridge Divide Detected Across Central Transect",
                "• Flank A (West Slope): Natural Drainage into Basin #1",
                "• Flank B (East Slope): Gravity Runoff toward Basin #2",
                "• Artifact Elimination: Overcomes Single-Outlet Fluvial Assumption"
            ]
        else:
            frame = mesh3.copy()
            sub_title = "FEATURE: MULTI-CATCHMENT HEURISTIC A* DITCH ROUTING"
            box_text = [
                "• Heuristic Cost H(n): Euclidean Distance to Nearest Boundary Outlet",
                "• Elevation Penalty Cost: Exponential Gravity Cost C(ΔZ)",
                "• Proposed Drainage Alignments: 3 Optimized Trench Routes",
                "• Hydraulic Gradient: Uniform S0 ≥ 0.2% Sustained Discharge"
            ]

        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img, 'RGBA')

        # Letterbox bars
        draw.rectangle([0, 0, WIDTH, 75], fill=(0, 0, 0, 255))
        draw.rectangle([0, HEIGHT - 75, WIDTH, HEIGHT], fill=(0, 0, 0, 255))
        draw.text((60, 25), "3D VIRTUAL HYDROLOGY // VOLUMETRIC INUNDATION & ROUTING", font=font_badge, fill=(6, 182, 212, 240))
        draw.text((WIDTH - 420, 25), "HEURISTIC A* PATHFINDING ACTIVE", font=font_badge, fill=(16, 185, 129, 220))

        # Floating Technical Telemetry Box
        draw.rectangle([70, 120, 580, 360], fill=(15, 23, 42, 220), outline=(6, 182, 212, 200), width=2)
        draw.rectangle([70, 120, 580, 165], fill=(6, 182, 212, 230))
        draw.text((85, 132), sub_title, font=font_badge, fill=(15, 23, 42))

        for idx, line in enumerate(box_text):
            draw.text((85, 185 + idx * 38), line, font=font_body, fill=(226, 232, 240))

        frame_final = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        out.write(frame_final)

    out.release()
    mux_audio_video(out_video, audio_path, final_video)
    print("Scene 04 complete!")

# ==============================================================================
# SCENE 05: ACTUAL APPLICATION DEMONSTRATION (39.22s)
# Uses the genuine 1080p 60fps screen recording from Playwright!
# ==============================================================================
def render_scene_05():
    final_video = os.path.join(SCENES_DIR, "scene_05.mp4")
    raw_video = os.path.join(SCENES_DIR, "raw_scene_05.mp4")
    audio_path = os.path.join(AUDIO_DIR, "scene_05.mp3")
    demo_recording = os.path.join(OUTPUT_DIR, "Project_Demonstration.mp4")
    
    dur = 39.22
    print(f"Rendering Scene 05 from genuine live screen recording: {dur:.2f}s...")
    
    # Extract 39.22s from demo_recording with clean letterboxing
    cmd_cut = [
        'ffmpeg', '-y', '-ss', '10.0', '-t', str(dur),
        '-i', demo_recording,
        '-vf', "scale=1920:1080,drawbox=y=0:color=black:width=iw:height=75:t=fill,drawbox=y=ih-75:color=black:width=iw:height=75:t=fill",
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
        raw_video
    ]
    subprocess.run(cmd_cut, check=True)
    mux_audio_video(raw_video, audio_path, final_video)
    print("Scene 05 complete!")

# ==============================================================================
# SCENE 06: TECHNICAL ARCHITECTURE & TECH STACK (32.90s)
# ==============================================================================
def render_scene_06():
    out_video = os.path.join(SCENES_DIR, "raw_scene_06.mp4")
    final_video = os.path.join(SCENES_DIR, "scene_06.mp4")
    audio_path = os.path.join(AUDIO_DIR, "scene_06.mp3")
    
    dur = 32.90
    total_frames = int(dur * FPS)
    print(f"Rendering Scene 06: {total_frames} frames ({dur:.2f}s)...")

    arch_img = cv2.imread(os.path.join(SCRATCH_FIGS, "architecture_diagram.png"))
    tech_img = cv2.imread(os.path.join(SCRATCH_FIGS, "tech_stack_ecosystem.png"))

    arch_img = cv2.resize(arch_img, (WIDTH, HEIGHT)) if arch_img is not None else np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    tech_img = cv2.resize(tech_img, (WIDTH, HEIGHT)) if tech_img is not None else arch_img

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, FPS, (WIDTH, HEIGHT))

    font_badge = get_font(18, bold=True)
    font_body = get_font(18)

    for f in range(total_frames):
        t = f / FPS
        # First half shows 5-tier architecture, second half shows technology ecosystem
        if t < 17.0:
            frame = arch_img.copy()
            header_text = "5-TIER SYSTEM ARCHITECTURAL FRAMEWORK"
            bullets = [
                "• Tier 1: Geospatial Ingestion (Copernicus DEM 30m, Open-Meteo API)",
                "• Tier 2: FastAPI High-Throughput REST Gateway (Uvicorn Async)",
                "• Tier 3: NumPy Hydrology & SciPy Spatial Filtering Kernel",
                "• Tier 4: Heuristic A* Routing & Least-Squares Planar Grading",
                "• Tier 5: Three.js 3D WebGL Mesh & Leaflet 2D GIS Frontend",
                "• AI Service: Google Gemini LLM API (ICAR Agronomic Prompts)"
            ]
        else:
            frame = tech_img.copy()
            header_text = "FULL-STACK PRODUCTION TECHNOLOGY STACK"
            bullets = [
                "• Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide",
                "• 3D Engine: Three.js WebGL (Custom Heightfield & Rain Particles)",
                "• 2D GIS: Leaflet.js with Dynamic Heatmaps & Radar Markers",
                "• Backend: FastAPI, Python 3.10, NumPy, SciPy, Pydantic v2",
                "• Agronomic AI: Google Gemini Generative AI (ICAR Advisory)",
                "• Reporting: jsPDF Vector Document Generator"
            ]

        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img, 'RGBA')

        # Letterbox bars
        draw.rectangle([0, 0, WIDTH, 75], fill=(0, 0, 0, 255))
        draw.rectangle([0, HEIGHT - 75, WIDTH, HEIGHT], fill=(0, 0, 0, 255))
        draw.text((60, 25), f"SYSTEM ENGINEERING // {header_text}", font=font_badge, fill=(6, 182, 212, 240))
        draw.text((WIDTH - 420, 25), "PRODUCTION PIPELINE VERIFIED", font=font_badge, fill=(16, 185, 129, 220))

        # Floating Spec Card
        draw.rectangle([60, 110, 580, 420], fill=(15, 23, 42, 225), outline=(6, 182, 212, 220), width=2)
        draw.rectangle([60, 110, 580, 155], fill=(6, 182, 212, 230))
        draw.text((75, 122), header_text, font=font_badge, fill=(15, 23, 42))

        for idx, line in enumerate(bullets):
            draw.text((75, 175 + idx * 38), line, font=font_body, fill=(226, 232, 240))

        frame_final = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        out.write(frame_final)

    out.release()
    mux_audio_video(out_video, audio_path, final_video)
    print("Scene 06 complete!")

# ==============================================================================
# SCENE 07: IMPACT, CLOSING & OFFICIAL CREDITS (28.08s)
# ==============================================================================
def render_scene_07():
    out_video = os.path.join(SCENES_DIR, "raw_scene_07.mp4")
    final_video = os.path.join(SCENES_DIR, "scene_07.mp4")
    audio_path = os.path.join(AUDIO_DIR, "scene_07.mp3")
    
    dur = 28.08
    total_frames = int(dur * FPS)
    print(f"Rendering Scene 07: {total_frames} frames ({dur:.2f}s)...")

    # Dark atmospheric background
    bg = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    # Subtle dark blue radial gradient
    for y in range(HEIGHT):
        val = int(25 * (1.0 - abs(y - HEIGHT//2) / (HEIGHT//2)))
        bg[y, :] = (val + 15, val + 10, val + 5)

    uem_logo = cv2.imread(os.path.join(SCRATCH_IMG, "image1.jpg"))
    if uem_logo is not None:
        uem_logo = cv2.resize(uem_logo, (130, 130))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, FPS, (WIDTH, HEIGHT))

    font_motto = get_font(42, bold=True)
    font_proj = get_font(34, bold=True)
    font_sub = get_font(22)
    font_author = get_font(20, bold=True)
    font_role = get_font(18)
    font_badge = get_font(18, bold=True)

    for f in range(total_frames):
        t = f / FPS
        frame = bg.copy()

        # Overlay UEM logo top center
        if uem_logo is not None and t > 1.0:
            lx = WIDTH//2 - 65
            ly = 110
            frame[ly:ly+130, lx:lx+130] = uem_logo

        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img, 'RGBA')

        # Letterbox bars
        draw.rectangle([0, 0, WIDTH, 75], fill=(0, 0, 0, 255))
        draw.rectangle([0, HEIGHT - 75, WIDTH, HEIGHT], fill=(0, 0, 0, 255))
        draw.text((60, 25), "FINAL-YEAR CAPSTONE EVALUATION // SESSION 2023–2027", font=font_badge, fill=(6, 182, 212, 240))
        draw.text((WIDTH - 420, 25), "DEPARTMENT OF CSE, UEM JAIPUR", font=font_badge, fill=(16, 185, 129, 220))

        # Big Central Motto
        alpha = min(1.0, t / 1.5)
        draw.text((WIDTH//2 - 580, 260), "SMARTER TERRAIN.  INTELLIGENT DRAINAGE.  BETTER AGRICULTURE.", font=font_motto, fill=(6, 182, 212, int(255 * alpha)))

        # Project Box
        draw.rectangle([WIDTH//2 - 620, 340, WIDTH//2 + 620, 720], fill=(15, 23, 42, int(220 * alpha)), outline=(6, 182, 212, int(200 * alpha)), width=2)
        
        draw.text((WIDTH//2 - 480, 365), "Smart Agricultural Drainage & Precision Land Grading System", font=font_proj, fill=(255, 255, 255, int(255 * alpha)))
        draw.text((WIDTH//2 - 400, 415), "AI-Powered Terrain Intelligence • 3D Mesh Hydrology • Autonomous Ditching", font=font_sub, fill=(226, 232, 240, int(240 * alpha)))

        # Authors & Supervisors (2-column layout)
        draw.line([WIDTH//2, 470, WIDTH//2, 700], fill=(51, 65, 85, int(255 * alpha)), width=1)

        # Left Column: Researchers
        draw.text((WIDTH//2 - 550, 475), "STUDENT RESEARCHERS (B.Tech CSE):", font=font_author, fill=(148, 163, 184, int(255 * alpha)))
        draw.text((WIDTH//2 - 550, 520), "• Rakesh Bangra", font=font_author, fill=(255, 255, 255, int(255 * alpha)))
        draw.text((WIDTH//2 - 520, 550), "Roll No: 12023002001100 | Reg No: 204202300200106", font=font_role, fill=(148, 163, 184, int(220 * alpha)))
        
        draw.text((WIDTH//2 - 550, 595), "• Sampat Singh Sekhawat", font=font_author, fill=(255, 255, 255, int(255 * alpha)))
        draw.text((WIDTH//2 - 520, 625), "Roll No: 12023002001124 | Reg No: 204202300200129", font=font_role, fill=(148, 163, 184, int(220 * alpha)))

        # Right Column: Supervisors
        draw.text((WIDTH//2 + 50, 475), "PROJECT SUPERVISORS & LEADERSHIP:", font=font_author, fill=(148, 163, 184, int(255 * alpha)))
        draw.text((WIDTH//2 + 50, 520), "• Prof. Soumya Sen", font=font_author, fill=(255, 255, 255, int(255 * alpha)))
        draw.text((WIDTH//2 + 80, 550), "Project Guide & Assistant Professor, Department of CSE", font=font_role, fill=(148, 163, 184, int(220 * alpha)))
        
        draw.text((WIDTH//2 + 50, 595), "• Prof. Dr. G Uma Devi", font=font_author, fill=(255, 255, 255, int(255 * alpha)))
        draw.text((WIDTH//2 + 80, 625), "Dean of Engineering & Head of Department (CSE), UEM Jaipur", font=font_role, fill=(148, 163, 184, int(220 * alpha)))

        # Bottom University Designation
        draw.text((WIDTH//2 - 320, 755), "UNIVERSITY OF ENGINEERING & MANAGEMENT (UEM), JAIPUR", font=font_badge, fill=(6, 182, 212, int(255 * alpha)))

        frame_final = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        out.write(frame_final)

    out.release()
    mux_audio_video(out_video, audio_path, final_video)
    print("Scene 07 complete!")

def render_all():
    render_scene_05()
    render_scene_06()
    render_scene_07()
    print("All individual scenes rendered and muxed with narration!")

if __name__ == '__main__':
    render_all()
