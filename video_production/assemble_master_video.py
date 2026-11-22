import os
import subprocess
import json

BASE_DIR = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT"
SCENES_DIR = os.path.join(BASE_DIR, "video_production", "scenes")
AUDIO_DIR = os.path.join(BASE_DIR, "video_production", "audio")
OUTPUT_DIR = os.path.join(BASE_DIR, "video_production", "output")

def check_file_exists(fn):
    return os.path.exists(fn) and os.path.getsize(fn) > 1000

def assemble_final_advertisement():
    print("Checking all 7 scene files...")
    scene_files = [os.path.join(SCENES_DIR, f"scene_{i:02d}.mp4") for i in range(1, 8)]
    for idx, sf in enumerate(scene_files, 1):
        if not check_file_exists(sf):
            raise FileNotFoundError(f"Scene {idx} missing or empty: {sf}")
        print(f"Verified Scene {idx:02d}: {sf} ({os.path.getsize(sf)} bytes)")

    # 1. Create FFmpeg concat list
    concat_list_path = os.path.join(SCENES_DIR, "master_concat_list.txt")
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for sf in scene_files:
            # Escape path for ffmpeg concat
            escaped = sf.replace("\\", "/")
            f.write(f"file '{escaped}'\n")

    raw_concat_video = os.path.join(SCENES_DIR, "raw_master_concat.mp4")
    print(f"Concatenating 7 scenes into {raw_concat_video}...")
    cmd_concat = [
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
        '-i', concat_list_path,
        '-c', 'copy',
        raw_concat_video
    ]
    subprocess.run(cmd_concat, check=True)

    # 2. Add Background Cinematic Soundtrack with Dynamic Audio Ducking
    music_track = os.path.join(AUDIO_DIR, "cinematic_soundtrack.mp3")
    final_output = os.path.join(OUTPUT_DIR, "Final_Project_Advertisement.mp4")
    root_output = os.path.join(BASE_DIR, "Final_Project_Advertisement.mp4")

    print(f"Mixing narration and background soundtrack into {final_output}...")
    # Filter complex:
    # [0:a] is narration audio
    # [1:a] is background music, volume set to 0.18 (-15dB) so voice is clear, with 4s fade out
    cmd_mix = [
        'ffmpeg', '-y',
        '-i', raw_concat_video,
        '-i', music_track,
        '-filter_complex',
        "[1:a]volume=0.18,afade=t=out:st=200:d=8[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=3[aout]",
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '256k',
        final_output
    ]
    subprocess.run(cmd_mix, check=True)
    print(f"Final_Project_Advertisement.mp4 successfully created! Size: {os.path.getsize(final_output)} bytes")

    # Copy to project root for easy user access
    subprocess.run(['copy', final_output, root_output], shell=True, check=True)
    print(f"Copied master video to root: {root_output}")

    # Copy Project_Demonstration.mp4 to root as well
    demo_src = os.path.join(OUTPUT_DIR, "Project_Demonstration.mp4")
    demo_root = os.path.join(BASE_DIR, "Project_Demonstration.mp4")
    if os.path.exists(demo_src):
        subprocess.run(['copy', demo_src, demo_root], shell=True, check=True)
        print(f"Copied demonstration video to root: {demo_root}")

    # Inspect final file with ffprobe
    cmd_probe = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', final_output]
    probe_res = subprocess.run(cmd_probe, capture_output=True, text=True)
    probe_data = json.loads(probe_res.stdout)
    dur = float(probe_data['format']['duration'])
    print(f"Master Video Verification: Duration = {dur:.2f}s (~{int(dur//60)}m {int(dur%60)}s), Bitrate = {int(probe_data['format']['bit_rate'])//1000} kbps")

if __name__ == '__main__':
    assemble_final_advertisement()
