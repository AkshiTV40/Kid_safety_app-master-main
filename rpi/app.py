#!/usr/bin/env python3
import os
import time
import threading
from datetime import datetime
from flask import Flask, Response, jsonify, send_from_directory
from flask_cors import CORS
from picamzero import Camera
from gpiozero import Button
import geocoder
from dotenv import load_dotenv

# ---------------- CONFIG ---------------- #

load_dotenv()

DEVICE_ID = os.getenv("DEVICE_ID", "raspi")
HELP_PIN = int(os.getenv("HELP_BUTTON_PIN", "17"))
PORT = int(os.getenv("STREAM_PORT", "8000"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEOS_DIR = os.path.join(BASE_DIR, "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)

# ---------------- APP ---------------- #

app = Flask(__name__)
CORS(app)

# ---------------- CAMERA ---------------- #

cam = Camera()
camera_lock = threading.Lock()
recording = False
latest_frame = None

def capture_preview_loop():
    global latest_frame
    cam.start_preview()
    while True:
        with camera_lock:
            frame = cam.capture_array()
            latest_frame = frame
        time.sleep(0.1)

def record_video(duration=10):
    global recording
    if recording:
        return

    recording = True
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    filepath = os.path.join(VIDEOS_DIR, filename)

    with camera_lock:
        cam.take_video(filepath, duration=duration)

    recording = False
    print(f"Saved video: {filepath}")

# ---------------- LOCATION ---------------- #

def get_location():
    try:
        g = geocoder.ip("me")
        if g.ok:
            return {
                "lat": g.latlng[0],
                "lng": g.latlng[1],
                "timestamp": int(time.time()),
                "method": "ip"
            }
    except:
        pass

    return {
        "lat": 0.0,
        "lng": 0.0,
        "timestamp": int(time.time()),
        "method": "fallback"
    }

# ---------------- BUTTON ---------------- #

def on_help_pressed():
    print("HELP BUTTON PRESSED")
    threading.Thread(target=record_video, daemon=True).start()

Button(HELP_PIN).when_pressed = on_help_pressed

# ---------------- ROUTES ---------------- #

@app.route("/")
def index():
    return jsonify({"status": "running", "device": DEVICE_ID})

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/location")
def location():
    loc = get_location()
    return jsonify({
        "device_id": DEVICE_ID,
        "latitude": loc["lat"],
        "longitude": loc["lng"],
        "timestamp": loc["timestamp"],
        "method": loc["method"]
    })

@app.route("/videos")
def list_videos():
    files = sorted(os.listdir(VIDEOS_DIR), reverse=True)
    videos = [{"name": f, "url": f"/videos/{f}"} for f in files]
    return jsonify(videos)

@app.route("/videos/<filename>")
def get_video(filename):
    return send_from_directory(VIDEOS_DIR, filename)

@app.route("/record", methods=["POST"])
def record():
    threading.Thread(target=record_video, daemon=True).start()
    return jsonify({"status": "recording_started"})

@app.route("/camera/stream")
def stream():
    def gen():
        while True:
            if latest_frame is not None:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" +
                    latest_frame +
                    b"\r\n"
                )
            time.sleep(0.1)

    return Response(
        gen(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

# ---------------- MAIN ---------------- #

if __name__ == "__main__":
    threading.Thread(target=capture_preview_loop, daemon=True).start()
    app.run(host="0.0.0.0", port=PORT)
