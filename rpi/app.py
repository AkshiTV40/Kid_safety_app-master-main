#!/usr/bin/env python3
import os
import time
import threading
import platform
from datetime import datetime
from flask import Flask, Response, jsonify, send_from_directory, request
from flask_cors import CORS
from picamzero import Camera
from gpiozero import Button
import geocoder
from dotenv import load_dotenv

# Check if running on Raspberry Pi
if platform.machine() not in ['armv7l', 'aarch64']:
    print("❌ This backend must run on a Raspberry Pi with Pi Camera Zero.")
    exit(1)

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

camera = Camera()
recording_lock = threading.Lock()
is_recording = False
latest_frame = None

def capture_preview_loop():
    global latest_frame
    camera.start_preview()
    while True:
        try:
            frame = camera.capture_array()
            latest_frame = frame
        except:
            pass
        time.sleep(0.1)

def record_video(duration=10):
    global is_recording

    with recording_lock:
        if is_recording:
            print("⚠️ Already recording")
            return
        is_recording = True

    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    filepath = os.path.join(VIDEOS_DIR, filename)

    try:
        print("🎥 Recording video...")
        camera.start_recording(filepath)
        start_time = time.time()
        while is_recording and (time.time() - start_time) < duration:
            time.sleep(0.1)
        camera.stop_recording()
        print("✅ Saved:", filepath)
    except Exception as e:
        print("❌ Camera error:", e)
    finally:
        is_recording = False

# ---------------- LOCATION ---------------- #

def get_location():
    try:
        g = geocoder.ip("me")
        if g.ok and g.latlng:
            return {
                "latitude": g.latlng[0],
                "longitude": g.latlng[1],
                "method": "ip",
                "timestamp": int(time.time())
            }
    except:
        pass

    return {
        "latitude": 0.0,
        "longitude": 0.0,
        "method": "fallback",
        "timestamp": int(time.time())
    }

# ---------------- BUTTON ---------------- #

def on_help_pressed():
    print("🆘 BUTTON PRESSED")
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
    return jsonify(get_location())

@app.route("/help", methods=["POST"])
def help_route():
    threading.Thread(target=record_video, daemon=True).start()
    return jsonify({"status": "recording_started"})

@app.route("/record", methods=["POST"])
def record():
    threading.Thread(target=record_video, daemon=True).start()
    return jsonify({"status": "recording_started"})

@app.route("/record/start", methods=["POST"])
def record_start():
    global is_recording
    if is_recording:
        return jsonify({"status": "already_recording"})
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

@app.route("/videos")
def list_videos():
    files = sorted(
        [f for f in os.listdir(VIDEOS_DIR) if f.endswith(".mp4")],
        reverse=True
    )
    return jsonify([
        {"name": f, "url": f"/videos/{f}"}
        for f in files
    ])

@app.route("/videos/<filename>")
def get_video(filename):
    return send_from_directory(VIDEOS_DIR, filename)

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
    print("🚀 Raspberry Pi backend running")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
