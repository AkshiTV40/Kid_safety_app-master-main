#!/usr/bin/env python3
import os
import time
import threading
import subprocess
import json
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

VIDEOS_DIR = "/home/pi/raspi-backend/videos"
os.makedirs(VIDEOS_DIR, exist_ok=True)

CACHE_FILE = "/home/pi/raspi-backend/location_cache.json"

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

def get_wifi_ssid():
    try:
        result = subprocess.run(['iwconfig', 'wlan0'], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if 'ESSID:' in line:
                ssid = line.split('ESSID:')[1].strip().strip('"')
                return ssid
    except:
        pass
    return "unknown"

def load_cached_location():
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    return None

def save_cached_location(loc):
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(loc, f)
    except:
        pass

def get_location():
    wifi_ssid = get_wifi_ssid()

    # Try online location
    try:
        g = geocoder.ip("me")
        if g.ok:
            loc = {
                "lat": g.latlng[0],
                "lng": g.latlng[1],
                "timestamp": int(time.time()),
                "method": "ip",
                "wifi_ssid": wifi_ssid
            }
            save_cached_location(loc)
            return loc
    except:
        pass

    # Fallback to cached location
    cached = load_cached_location()
    if cached:
        cached["wifi_ssid"] = wifi_ssid
        return cached

    # Ultimate fallback
    return {
        "lat": 0.0,
        "lng": 0.0,
        "timestamp": int(time.time()),
        "method": "fallback",
        "wifi_ssid": wifi_ssid
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
        "method": loc["method"],
        "wifi_ssid": loc.get("wifi_ssid", "unknown")
    })

@app.route("/videos")
def list_videos():
    files = sorted(os.listdir(VIDEOS_DIR), reverse=True)
    return jsonify(files)

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
