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
RECORDINGS_DIR = os.path.join(BASE_DIR, "video_production", "output")
os.makedirs(SCENES_DIR, exist_ok=True)

FPS = 30
WIDTH = 1920
HEIGHT = 1080

def get_font(size, bold=False):
    # Try standard Windows fonts
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

def draw_hud_box(draw, x, y, w, h, bg_color=(15, 23, 42, 220), border_color=(6, 182, 212, 180)):
    # Simulates glassmorphic panel with cyan border
    draw.rectangle([x, y, x + w, y + h], fill=bg_color, outline=border_color, width=2)

def mux_audio_video(video_path, audio_path, output_path):
    print(f"Muxing {video_path} with {audio_path} -> {output_path}...")
    cmd = [
        'ffmpeg', '-y', '-i', video_path, '-i', audio_path,
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', output_path
    ]
    subprocess.run(cmd, check=True)

# ==============================================================================
# SCENE 01: CINEMATIC OPENING (21.0 seconds)
# Aerial drone view of farmland in torrential rainfall with dramatic title
# ==============================================================================
def render_scene_01():
    out_video = os.path.join(SCENES_DIR, "raw_scene_01.mp4")
    final_video = os.path.join(SCENES_DIR, "scene_01.mp4")
    audio_path = os.path.join(AUDIO_DIR, "scene_01.mp3")
    
    # Get audio duration
    dur = 20.95
    total_frames = int(dur * FPS)
    print(f"Rendering Scene 01: {total_frames} frames ({dur:.2f}s)...")
    
    # Base image: high-res satellite farm view
    bg_img_path = os.path.join(SCRATCH_FIGS, "fig_2d_gis_map.jpg")
    bg_orig = cv2.imread(bg_img_path)
    if bg_orig is None:
        bg_orig = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        bg_orig[:] = (20, 35, 20)
    else:
        bg_orig = cv2.resize(bg_orig, (WIDTH + 400, HEIGHT + 400))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, FPS, (WIDTH, HEIGHT))

    # Procedural raindrops
    num_drops = 350
    drop_x = np.random.randint(0, WIDTH, num_drops)
    drop_y = np.random.randint(0, HEIGHT, num_drops)
    drop_speed = np.random.randint(22, 38, num_drops)
    drop_len = np.random.randint(15, 30, num_drops)

    font_title = get_font(52, bold=True)
    font_sub = get_font(24)
    font_hud = get_font(18, bold=True)

    for f in range(total_frames):
        t = f / FPS
        # Slow cinematic drone zoom & glide
        zoom = 1.0 + (t / dur) * 0.15
        cur_w = int(WIDTH * zoom)
        cur_h = int(HEIGHT * zoom)
        crop_x = int((t / dur) * 200)
        crop_y = int((t / dur) * 120)
        
        # Safe crop
        frame = bg_orig[crop_y:crop_y + HEIGHT, crop_x:crop_x + WIDTH].copy()
        if frame.shape[0] != HEIGHT or frame.shape[1] != WIDTH:
            frame = cv2.resize(frame, (WIDTH, HEIGHT))

        # Atmospheric storm color grading: cool blue tint & slight darkening
        storm_tint = np.zeros_like(frame)
        storm_tint[:] = (45, 25, 10) # BGR
        frame = cv2.addWeighted(frame, 0.72, storm_tint, 0.28, 0)

        # Dynamic rainfall streaks
        drop_y = (drop_y + drop_speed) % HEIGHT
        for i in range(num_drops):
            cv2.line(frame, (drop_x[i], drop_y[i]), (drop_x[i] - 3, drop_y[i] + drop_len[i]), (220, 230, 245), 1)

        # Convert to PIL for anti-aliased HUD and cinematic typography
        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img, 'RGBA')

        # Cinematic letterbox bars
        draw.rectangle([0, 0, WIDTH, 75], fill=(0, 0, 0, 255))
        draw.rectangle([0, HEIGHT - 75, WIDTH, HEIGHT], fill=(0, 0, 0, 255))

        # HUD Telemetry
        draw.text((60, 25), "AERIAL RECONNAISSANCE // PRECISION AGRO-DRONE", font=font_hud, fill=(6, 182, 212, 240))
        draw.text((WIDTH - 380, 25), f"GPS: 26.9832 N, 75.9255 E | ALT: {140 - int(t * 2.5)}m", font=font_hud, fill=(148, 163, 184, 220))

        # Center Title Banner (appears after 2.5s)
        if t > 2.0:
            alpha = min(1.0, (t - 2.0) / 1.5)
            # Glowing backdrop
            draw.rectangle([WIDTH//2 - 580, HEIGHT//2 - 90, WIDTH//2 + 580, HEIGHT//2 + 90], fill=(6, 15, 30, int(220 * alpha)), outline=(6, 182, 212, int(220 * alpha)), width=2)
            draw.text((WIDTH//2 - 540, HEIGHT//2 - 60), "WHEN WATER BECOMES THE BIGGEST THREAT", font=font_title, fill=(255, 255, 255, int(255 * alpha)))
            draw.text((WIDTH//2 - 250, HEIGHT//2 + 10), "TO GLOBAL AGRICULTURE", font=font_title, fill=(6, 182, 212, int(255 * alpha)))
            draw.text((WIDTH//2 - 470, HEIGHT//2 + 65), "Millions of agricultural fields face catastrophic waterlogging and surface runoff", font=font_sub, fill=(226, 232, 240, int(240 * alpha)))

        frame_final = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        out.write(frame_final)

    out.release()
    mux_audio_video(out_video, audio_path, final_video)
    print("Scene 01 complete!")

if __name__ == '__main__':
    render_scene_01()
