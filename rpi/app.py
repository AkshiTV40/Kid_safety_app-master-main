#!/usr/bin/env python3
import os
import time
import threading
from datetime import datetime
from flask import Flask, Response, jsonify, send_from_directory
from flask_cors import CORS
from picamzero import Camera
from gpiozero import Button, LED

# ---------------- CONFIG ---------------- #
DEVICE_ID = "raspi-demo-01"
HELP_PIN = 17
LED_PIN = 27
PORT = 8000

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEOS_DIR = os.path.join(BASE_DIR, "videos")
PREVIEW_FILE = os.path.join(BASE_DIR, "preview.jpg")
os.makedirs(VIDEOS_DIR, exist_ok=True)

# ---------------- CAMERA ---------------- #
camera = Camera()
camera.resolution = (1280, 720)
camera.framerate = 24

is_recording = False
record_lock = threading.Lock()
led = LED(LED_PIN)

# ---------------- RECORDING ---------------- #
def record_video(duration=120):
    """Record a video with a unique filename"""
    global is_recording
    with record_lock:
        if is_recording:
            return
        is_recording = True
        led.on()
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    filepath = os.path.join(VIDEOS_DIR, filename)
    try:
        print("🎥 Recording:", filename)
        camera.start_recording(filepath)
        time.sleep(duration)
        camera.stop_recording()
        print("✅ Saved:", filepath)
    except Exception as e:
        print("❌ Recording error:", e)
    finally:
        is_recording = False
        led.off()

# ---------------- PREVIEW ---------------- #
def preview_loop():
    """Constantly update preview image for MJPEG streaming"""
    while True:
        try:
            camera.capture_image(PREVIEW_FILE)
        except Exception as e:
            print("Preview error:", e)
        time.sleep(0.15)

# ---------------- BUTTON ---------------- #
def on_button_pressed():
    print("🆘 Help button pressed!")
    threading.Thread(target=record_video, daemon=True).start()

Button(HELP_PIN).when_pressed = on_button_pressed

# ---------------- FLASK ---------------- #
app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return """
    <h1>📷 Raspberry Pi Camera Demo</h1>
    <ul>
        <li><a href="/camera">Live Camera</a></li>
        <li><a href="/videos">Recorded Videos</a></li>
        <li><a href="/status">Status</a></li>
    </ul>
    """

@app.route("/camera")
def camera_stream():
    """MJPEG streaming endpoint"""
    def gen():
        while True:
            if os.path.exists(PREVIEW_FILE):
                with open(PREVIEW_FILE, "rb") as f:
                    frame = f.read()
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
            time.sleep(0.15)
    return Response(gen(), mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/videos")
def list_videos():
    files = sorted([f for f in os.listdir(VIDEOS_DIR) if f.endswith(".mp4")], reverse=True)
    return "<br>".join(f'<a href="/videos/{f}">{f}</a>' for f in files) if files else "No videos yet."

@app.route("/videos/<filename>")
def get_video(filename):
    if not filename.endswith(".mp4"):
        return "Not found", 404
    return send_from_directory(VIDEOS_DIR, filename)

@app.route("/status")
def status():
    return jsonify({"recording": is_recording})

@app.route("/record/start", methods=["POST"])
def record_start():
    threading.Thread(target=record_video, daemon=True).start()
    return jsonify({"status": "recording_started"})

@app.route("/record/stop", methods=["POST"])
def record_stop():
    global is_recording
    is_recording = False
    return jsonify({"status": "recording_stopped"})

@app.route("/record/status")
def record_status():
    return jsonify({"recording": is_recording})

# ---------------- MAIN ---------------- #
if __name__ == "__main__":
    # Start preview loop
    threading.Thread(target=preview_loop, daemon=True).start()
    print(f"🚀 Raspberry Pi demo backend running on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
