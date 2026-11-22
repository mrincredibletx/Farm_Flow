import numpy as np
import scipy.io.wavfile as wavfile
import subprocess
import os

def generate_cinematic_music():
    print("Synthesizing cinematic ambient documentary soundtrack...")
    sample_rate = 48000
    total_seconds = 215.0  # covers full ~3.5 min video
    num_samples = int(sample_rate * total_seconds)
    t = np.linspace(0, total_seconds, num_samples, endpoint=False)
    
    # 1. Base Cinematic Chords (D minor progression: Dm -> Bb -> F -> C / Am)
    # Frequencies (Hz)
    chord_roots = [73.42, 58.27, 87.31, 65.41] # D2, Bb1, F2, C2
    chord_duration = 16.0 # seconds per chord
    
    pad_audio = np.zeros(num_samples, dtype=np.float32)
    
    for i in range(int(total_seconds / chord_duration) + 1):
        c_idx = i % len(chord_roots)
        root = chord_roots[c_idx]
        t_start = i * chord_duration
        t_end = min((i + 1) * chord_duration, total_seconds)
        idx_start = int(t_start * sample_rate)
        idx_end = int(t_end * sample_rate)
        
        if idx_start >= num_samples:
            break
            
        t_seg = t[idx_start:idx_end]
        seg_len = len(t_seg)
        
        # Envelope: smooth attack & release
        env = np.ones(seg_len, dtype=np.float32)
        attack = int(2.5 * sample_rate)
        release = int(2.5 * sample_rate)
        if seg_len > attack + release:
            env[:attack] = np.linspace(0, 1, attack)
            env[-release:] = np.linspace(1, 0, release)
            
        # Triad harmonic frequencies: root, minor third (1.1892), fifth (1.4983), octave (2.0)
        seg_audio = (
            0.35 * np.sin(2 * np.pi * root * t_seg) +
            0.25 * np.sin(2 * np.pi * root * 1.1892 * t_seg) +
            0.20 * np.sin(2 * np.pi * root * 1.4983 * t_seg) +
            0.15 * np.sin(2 * np.pi * root * 2.0 * t_seg) +
            0.10 * np.sin(2 * np.pi * (root + 0.5) * t_seg) # subtle chorus detune
        )
        pad_audio[idx_start:idx_end] += seg_audio * env

    # 2. Cinematic Heartbeat / Sub-bass Pulses (every 2 seconds)
    pulse_freq = 0.5 # 1 pulse every 2s
    pulse_env = np.maximum(0, np.sin(2 * np.pi * pulse_freq * t)) ** 12
    sub_bass = 0.25 * np.sin(2 * np.pi * 48.0 * t) * pulse_env
    
    # 3. High Shimmer Chimes (ethereal tech feeling)
    shimmer = (
        0.04 * np.sin(2 * np.pi * 587.33 * t) * np.sin(2 * np.pi * 0.1 * t) +
        0.03 * np.sin(2 * np.pi * 880.00 * t) * np.cos(2 * np.pi * 0.08 * t) +
        0.03 * np.sin(2 * np.pi * 1174.66 * t) * np.sin(2 * np.pi * 0.05 * t)
    )
    
    # 4. Filtered Rain / Water Ambience for Scene 1 (first 25 seconds)
    noise = np.random.normal(0, 0.03, num_samples).astype(np.float32)
    # Fade out noise after 35s
    noise_env = np.clip(1.0 - (t / 35.0), 0, 1) ** 2
    ambient_rain = noise * noise_env * 0.15

    # Master mix
    master = pad_audio * 0.45 + sub_bass * 0.35 + shimmer * 0.25 + ambient_rain
    
    # Fade in at start and fade out at end
    fade_in = int(3.0 * sample_rate)
    fade_out = int(5.0 * sample_rate)
    master[:fade_in] *= np.linspace(0, 1, fade_in)
    master[-fade_out:] *= np.linspace(1, 0, fade_out)
    
    # Normalize
    max_val = np.max(np.abs(master))
    if max_val > 0:
        master = (master / max_val) * 0.85
        
    out_wav = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\audio\cinematic_soundtrack.wav"
    out_mp3 = r"c:\Users\rkban\OneDrive\Desktop\sem 7\PROJECT\video_production\audio\cinematic_soundtrack.mp3"
    
    wavfile.write(out_wav, sample_rate, (master * 32767).astype(np.int16))
    
    # Convert to MP3
    subprocess.run([
        'ffmpeg', '-y', '-i', out_wav,
        '-codec:a', 'libmp3lame', '-b:a', '256k',
        out_mp3
    ], check=True)
    print(f"Soundtrack created: {out_mp3} ({os.path.getsize(out_mp3)} bytes)")

if __name__ == '__main__':
    generate_cinematic_music()
