import os
import sys
import subprocess
from datetime import datetime
from generate_caption import generate_caption

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECORDINGS_DIR = os.path.join(BASE_DIR, "recordings")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
POSTS_DIR = os.path.join(BASE_DIR, "posts")
G_DRIVE_DIR = "G:\\PersonaForge_Media"

def check_dependencies():
    """Verify if FFmpeg and Python dependencies are met."""
    print("[*] Checking dependencies...")
    
    # Check FFmpeg
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        print("[+] FFmpeg found.")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[!] WARNING: FFmpeg not found. Video conversion will be skipped.")
        return False

def convert_to_mp4(input_path, output_path):
    """Convert WebP/WebM to high-quality MP4."""
    print(f"[*] Converting {os.path.basename(input_path)} to MP4...")
    try:
        cmd = [
            "ffmpeg", "-i", input_path,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", "18",
            "-y", output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"[+] Conversion complete: {output_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[!] Conversion failed: {e.stderr.decode()}")
        return False

def run_daily_workflow():
    print("=" * 40)
    print(f"PERSONAFORGE SOCIAL AUTOMATION - {datetime.now().strftime('%Y-%m-%d')}")
    print("=" * 40)
    
    has_ffmpeg = check_dependencies()
    
    # 1. Generate Caption
    print("\n[1] Generating Caption...")
    caption = generate_caption()
    print(f"\nPROPOSED CAPTION:\n{caption}")
    
    # 2. Check for Recording
    print("\n[2] Checking for today's demo recording...")
    day_prefix = datetime.now().strftime("%a").lower()
    recordings = [f for f in os.listdir(RECORDINGS_DIR) if f.startswith(day_prefix) or f.startswith("social_demo")]
    
    if not recordings:
        print(f"[!] No recording found. Please run the recording script first.")
        return
    
    input_file = os.path.join(RECORDINGS_DIR, recordings[0])
    print(f"[+] Found recording: {os.path.basename(input_file)}")
    
    # 3. Conversion and G-Drive Export
    if has_ffmpeg:
        print("\n[3] Exporting to G-Drive...")
        os.makedirs(G_DRIVE_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y-%m-%d")
        final_filename = f"PersonaForge_Reel_{timestamp}.mp4"
        final_path = os.path.join(G_DRIVE_DIR, final_filename)
        
        success = convert_to_mp4(input_file, final_path)
        if success:
            print(f"[SUCCESS] Video is now ready in G-Drive: {final_path}")
    else:
        print("\n[3] SKIPPING G-Drive export (FFmpeg missing).")
    
    # 4. Future Step: Posting
    print("\n[4] Ready for Posting (Requires .env credentials)")
    
    print("\n[SUCCESS] Daily workflow prepared. Waiting for manual trigger/FFmpeg.")

if __name__ == "__main__":
    # Ensure directories exist
    for d in [RECORDINGS_DIR, ASSETS_DIR, POSTS_DIR]:
        os.makedirs(d, exist_ok=True)
        
    run_daily_workflow()
