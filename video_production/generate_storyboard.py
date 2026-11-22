import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0284c7'),
        alignment=0
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748b'),
        alignment=0
    )

    scene_hdr_style = ParagraphStyle(
        'SceneHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0369a1')
    )

    col_hdr_style = ParagraphStyle(
        'ColHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    cell_body = ParagraphStyle(
        'CellBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    elements = []

    # Document Header
    elements.append(Paragraph("SMART AGRICULTURAL DRAINAGE & PRECISION LAND GRADING SYSTEM", title_style))
    elements.append(Paragraph("CINEMATIC PRODUCT ADVERTISEMENT & TECHNICAL DEMONSTRATION STORYBOARD", subtitle_style))
    elements.append(Paragraph("UEM Jaipur | Department of Computer Science & Engineering | Capstone Session 2023–2027<br/>Authors: Rakesh Bangra & Sampat Singh Sekhawat | Supervisors: Prof. Soumya Sen & Prof. Dr. G Uma Devi", meta_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=12))

    storyboard_data = [
        {
            "scene": "SCENE 01",
            "time": "0:00 - 0:15",
            "title": "Cinematic Farmland Inundation (Opening)",
            "visual": "Cinematic aerial drone glide over vast agricultural farmland during heavy torrential rainfall. Camera moves slowly forward, tracking surface water pooling between crops. Transition to slow aerial zoom with atmospheric color grading.",
            "hud": "Text overlay: 'WHEN WATER BECOMES THE BIGGEST THREAT TO AGRICULTURE'. Subtle glowing vignette and particle rain effects.",
            "audio": "Thunder rumble, cinematic atmospheric synth pad. Deep documentary voiceover introducing the catastrophic scale of global agricultural waterlogging.",
            "tech": "3D Farmland Environment, Particle Rain Simulation, Procedural Water Pooling."
        },
        {
            "scene": "SCENE 02",
            "time": "0:15 - 0:35",
            "title": "The Agronomic Problem & Topographic Failure",
            "visual": "Low-angle tracking shot through waterlogged fields showing crop damage and stunted root zones. Visual callouts show stagnant micro-depressions and steep runoff bottlenecks accelerating topsoil erosion.",
            "hud": "Pulsing red radar indicators over low-elevation sinkholes. Animated directional runoff arrows indicating erosion vectors and unguided downhill flow.",
            "audio": "Voiceover explaining why traditional manual surveying fails to capture subtle elevation variances and why stagnant sinks devastate crop yields.",
            "tech": "Digital Elevation Model (Copernicus DEM), Topographic Curvature, Soil Infiltration Dynamics."
        },
        {
            "scene": "SCENE 03",
            "time": "0:35 - 0:50",
            "title": "System Reveal: Digital Twin Transformation",
            "visual": "Smooth morphing transition: physical farmland transforms into a digital 3D holographic wireframe and elevation heightfield. Revealing the project title and multi-tier geospatial system.",
            "hud": "Title: 'SMART AGRICULTURAL DRAINAGE & PRECISION LAND GRADING SYSTEM'. Subtitle: 'AI-Powered Geospatial Hydrology & Autonomous Ditching'.",
            "audio": "Uplifting modern tech soundscape. Voiceover introduces the unified Next.js/FastAPI platform engineered at UEM Jaipur.",
            "tech": "Three.js WebGL Heightfield, Dynamic Shaders, 5-Tier Decoupled Architecture."
        },
        {
            "scene": "SCENE 04",
            "time": "0:50 - 1:20",
            "title": "3D Terrain Hydrology & Drone-Style Inspection",
            "visual": "Cinematic drone-style 3D camera orbits over the field heightfield. Color gradient shows high ridges (green) down to depression basins (red). Water rises interactively. 3D glowing cyan A* drainage trench tubes appear and divert runoff downhill to boundary outlets.",
            "hud": "Topographic Relief HUD (ΔZ = 4.0m, Min: 461m, Max: 465m). Directional surface runoff vector (East 87.2°). Sinks count callout (246 Critical).",
            "audio": "Voiceover detailing DEM ingestion, Gaussian spatial smoothing, Laplacian sinkhole detection, watershed divide boundary detection, and heuristic A* gravitational pathfinding.",
            "tech": "Three.js WebGL OrbitControls, Multi-Catchment A* Algorithm, Gaussian Spatial Filter."
        },
        {
            "scene": "SCENE 05",
            "time": "1:20 - 1:55",
            "title": "Actual Application Demonstration (Live UI)",
            "visual": "Direct high-resolution screen recordings of the running web application: Selecting preset 'UEM Jaipur Agritech Research Plot', triggering live analysis, switching 2D GIS and 3D terrain viewers, testing dynamic rainfall simulation, and generating AI advisory.",
            "hud": "Split layout: Left Glassmorphic Analysis HUD, Center Leaflet Satellite GIS Map with heatmap & radar sink pins, 3D WebGL Mesh Viewer with interactive ponding slider.",
            "audio": "Voiceover walking through live UI features: 1-click test fields, real-time NumPy hydrology, cut/fill precision land leveling, SCS-CN runoff kinetics, and Gemini LLM advisory.",
            "tech": "Next.js 14, Leaflet GIS, Three.js, FastAPI Hydrology Routes, Gemini AI Advisory, jsPDF Export."
        },
        {
            "scene": "SCENE 06",
            "time": "1:55 - 2:15",
            "title": "Technical Architecture & Engineering Stack",
            "visual": "Dynamic 3D animated architecture diagram with flowing particle data streams connecting: Data Ingestion (Copernicus DEM, Open-Meteo) -> FastAPI Backend & NumPy Solvers -> Leaflet & Three.js Frontend -> Gemini LLM.",
            "hud": "Tier labels: Tier 1 Data Sources, Tier 2 Ingestion, Tier 3 Core Hydrology, Tier 4 AI & Land Grading, Tier 5 Interactive Presentation.",
            "audio": "Crisp technical voiceover summarizing the computational pipeline, NumPy vectorization, least-squares planar grading, and AI agronomic synthesis.",
            "tech": "FastAPI v2, Next.js 14, TypeScript, Tailwind CSS, NumPy, SciPy, Google Gemini API."
        },
        {
            "scene": "SCENE 07",
            "time": "2:15 - 2:40",
            "title": "Impact, Agronomic Future & Official Closing",
            "visual": "Split comparison: Before (uncontrolled flooding, submerged crops) vs After (channeled drainage, balanced graded field, thriving crops). Final cinematic drone fly-up towards sunrise.",
            "hud": "Motto: 'SMARTER TERRAIN. INTELLIGENT DRAINAGE. BETTER AGRICULTURE.' Final Credits: B.Tech Final-Year Capstone Project, UEM Jaipur, Rakesh Bangra & Sampat Singh Sekhawat.",
            "audio": "Triumphant, inspiring orchestral resolution with narrator concluding the vision for climate-resilient precision agriculture.",
            "tech": "Precision Land Leveling, Yield Preservation, Sustainable Agro-Hydrology."
        }
    ]

    table_data = [
        [
            Paragraph("Scene & Time", col_hdr_style),
            Paragraph("Scene Title", col_hdr_style),
            Paragraph("Visual Direction & Camera", col_hdr_style),
            Paragraph("HUD & On-Screen Graphics", col_hdr_style),
            Paragraph("Audio & Voiceover Narration", col_hdr_style),
            Paragraph("Core Technology", col_hdr_style)
        ]
    ]

    for item in storyboard_data:
        table_data.append([
            Paragraph(f"<b>{item['scene']}</b><br/><font color='#0284c7'>{item['time']}</font>", cell_bold),
            Paragraph(item['title'], cell_bold),
            Paragraph(item['visual'], cell_body),
            Paragraph(item['hud'], cell_body),
            Paragraph(item['audio'], cell_body),
            Paragraph(item['tech'], cell_body)
        ])

    col_widths = [65, 95, 175, 145, 160, 100]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
    ]))

    elements.append(table)
    doc.build(elements)
    print(f"Storyboard PDF successfully created: {output_pdf_path} ({os.path.getsize(output_pdf_path)} bytes)")

if __name__ == '__main__':
    out_pdf = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\output\Project_Storyboard.pdf"
    os.makedirs(os.path.dirname(out_pdf), exist_ok=True)
    build_pdf(out_pdf)
