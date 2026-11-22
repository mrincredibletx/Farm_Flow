import os
import subprocess
import json

audio_dir = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\audio"
output_dir = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\output"
os.makedirs(output_dir, exist_ok=True)

# Scene texts broken into readable subtitle lines with relative start/end proportions
SCENE_SUBTITLES = [
    {
        "id": "scene_01",
        "dur": 20.95,
        "lines": [
            ("When water becomes the single greatest threat to agriculture,", 0.0, 4.2),
            ("billions of dollars in global crop yields are lost overnight.", 4.3, 8.8),
            ("Across millions of agricultural fields worldwide,", 8.9, 12.2),
            ("unpredictable rainfall and poorly drained terrain trigger severe waterlogging,", 12.3, 16.8),
            ("suffocating root systems and transforming fertile soil into unproductive floodplains.", 16.9, 20.95)
        ]
    },
    {
        "id": "scene_02",
        "dur": 24.53,
        "lines": [
            ("Traditional drainage planning relies on slow, expensive manual surveying and guesswork.", 0.0, 6.2),
            ("Subtle elevation depressions, invisible to the human eye,", 6.3, 10.4),
            ("trap surface runoff, forming stagnant hydrological sinks.", 10.5, 14.8),
            ("Without precision topographic modeling, surface runoff flows uncontrollably,", 14.9, 19.8),
            ("accelerating topsoil erosion and devastating seasonal harvests.", 19.9, 24.53)
        ]
    },
    {
        "id": "scene_03",
        "dur": 19.63,
        "lines": [
            ("Introducing the Smart Agricultural Drainage & Precision Land Grading System.", 0.0, 5.8),
            ("A unified, AI-driven geospatial intelligence platform developed at UEM Jaipur,", 5.9, 11.2),
            ("engineered to transform satellite elevation data into actionable, millimeter-precise drainage networks", 11.3, 16.2),
            ("and optimal land-grading strategies.", 16.3, 19.63)
        ]
    },
    {
        "id": "scene_04",
        "dur": 38.54,
        "lines": [
            ("By fusing high-resolution digital elevation models with Gaussian spatial filtering", 0.0, 5.8),
            ("and numerical gradient analysis,", 5.9, 8.5),
            ("the system constructs an interactive three-dimensional digital twin of any agricultural field.", 8.6, 14.8),
            ("Topographic curvature algorithms locate localized depression sinks", 14.9, 19.8),
            ("and identify natural watershed divide boundaries.", 19.9, 23.5),
            ("Gravitational flow vectors reveal the exact trajectory of surface runoff,", 23.6, 28.5),
            ("while a multi-catchment heuristic A* pathfinding engine autonomously computes", 28.6, 33.8),
            ("the mathematically optimal routes for agricultural drainage trenches,", 33.9, 36.5),
            ("minimizing excavation depth while maintaining continuous downhill flow.", 36.6, 38.54)
        ]
    },
    {
        "id": "scene_05",
        "dur": 39.22,
        "lines": [
            ("Inside the live interactive dashboard,", 0.0, 3.2),
            ("farmers and agronomists can delineate field boundaries or select preset research plots with a single click.", 3.3, 9.8),
            ("The platform instantly analyzes ground elevation profiles", 9.9, 13.8),
            ("and highlights waterlogging vulnerability across critical, moderate, and well-drained zones.", 13.9, 19.5),
            ("Users can toggle between existing terrain and laser-graded design surfaces,", 19.6, 24.8),
            ("run real-time 3D rainfall inundation simulations,", 24.9, 28.2),
            ("model SCS curve number runoff kinetics under dynamic soil saturation,", 28.3, 33.2),
            ("and receive instant, crop-specific agronomic advisories powered by generative AI.", 33.3, 39.22)
        ]
    },
    {
        "id": "scene_06",
        "dur": 32.90,
        "lines": [
            ("Under the hood, the system features a high-performance decoupled architecture.", 0.0, 5.5),
            ("A modern Next.js 14 frontend renders dynamic Three.js WebGL terrain meshes", 5.6, 11.2),
            ("alongside responsive Leaflet GIS maps.", 11.3, 14.5),
            ("The FastAPI Python backend powers high-throughput hydrological computing", 14.6, 19.8),
            ("using NumPy vectorization, SciPy spatial filters, and custom least-squares planar grading,", 19.9, 26.5),
            ("seamlessly integrated with Google Gemini AI for expert agronomic intelligence.", 26.6, 32.90)
        ]
    },
    {
        "id": "scene_07",
        "dur": 28.08,
        "lines": [
            ("From uncontrolled inundation to automated, precision-guided drainage.", 0.0, 5.5),
            ("From manual surveying to autonomous geospatial intelligence.", 5.6, 10.5),
            ("This is the future of sustainable farming and climate-resilient water management.", 10.6, 16.5),
            ("Smarter Terrain. Intelligent Drainage. Better Agriculture.", 16.6, 21.8),
            ("A Final-Year B.Tech Capstone Project, University of Engineering & Management, Jaipur.", 21.9, 28.08)
        ]
    }
]

def format_timestamp(seconds):
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def generate_voiceover_and_subtitles():
    # 1. Build concatenated audio with 0.8s silence pause between scenes
    silence_wav = os.path.join(audio_dir, "silence.wav")
    subprocess.run([
        'ffmpeg', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono',
        '-t', '0.8', '-q:a', '9', '-acodec', 'libmp3lame', os.path.join(audio_dir, "pause.mp3")
    ], check=True)
    pause_mp3 = os.path.join(audio_dir, "pause.mp3")

    # FFmpeg concat file
    concat_list_path = os.path.join(audio_dir, "concat_list.txt")
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for i in range(1, 8):
            f.write(f"file 'scene_{i:02d}.mp3'\n")
            if i < 7:
                f.write(f"file 'pause.mp3'\n")

    full_voiceover_mp3 = os.path.join(output_dir, "Project_Voiceover.mp3")
    cmd_concat = [
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
        '-i', concat_list_path, '-c', 'copy', full_voiceover_mp3
    ]
    subprocess.run(cmd_concat, check=True)
    print(f"Concatenated voiceover created: {full_voiceover_mp3} ({os.path.getsize(full_voiceover_mp3)} bytes)")

    # 2. Build Project_Subtitles.srt with absolute timestamps
    srt_path = os.path.join(output_dir, "Project_Subtitles.srt")
    srt_entries = []
    current_time = 0.0
    sub_index = 1

    for sc in SCENE_SUBTITLES:
        sc_offset = current_time
        for text, rel_start, rel_end in sc["lines"]:
            abs_start = sc_offset + rel_start
            abs_end = sc_offset + rel_end
            start_str = format_timestamp(abs_start)
            end_str = format_timestamp(abs_end)
            srt_entries.append(f"{sub_index}\n{start_str} --> {end_str}\n{text}\n")
            sub_index += 1
        current_time += sc["dur"] + 0.8 # add pause

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_entries))
    print(f"Generated subtitles: {srt_path} ({len(srt_entries)} entries)")

if __name__ == '__main__':
    generate_voiceover_and_subtitles()
