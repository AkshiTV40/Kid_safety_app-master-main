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
import serial
import serial.tools.list_ports

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
recording_thread = None
latest_frame = None

def capture_preview_loop():
    global latest_frame
    cam.start_preview()
    while True:
        with camera_lock:
            frame = cam.capture_array()
            latest_frame = frame
        time.sleep(0.1)

def start_recording():
    global recording, recording_thread
    if recording or recording_thread and recording_thread.is_alive():
        return False

    recording = True
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    filepath = os.path.join(VIDEOS_DIR, filename)

    def record():
        global recording
        with camera_lock:
            cam.start_recording(filepath)
            while recording:
                time.sleep(0.1)
            cam.stop_recording()
        print(f"Saved video: {filepath}")

    recording_thread = threading.Thread(target=record, daemon=True)
    recording_thread.start()
    return True

def stop_recording():
    global recording
    if not recording:
        return False
    recording = False
    return True

def find_usb_serial_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if 'USB' in port.description or 'ttyACM' in port.device or 'ttyUSB' in port.device:
            return port.device
    return None

def usb_button_listener():
    port = find_usb_serial_port()
    if not port:
        print("No USB serial device found for buttons")
        return

    try:
        ser = serial.Serial(port, 9600, timeout=1)
        print(f"Listening for USB buttons on {port}")
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                if line == 'start':
                    start_recording()
                    print("USB: Started recording")
                elif line == 'stop':
                    stop_recording()
                    print("USB: Stopped recording")
            time.sleep(0.1)
    except Exception as e:
        print(f"USB serial error: {e}")

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

@app.route("/record/start", methods=["POST"])
def start_record():
    if start_recording():
        return jsonify({"status": "recording_started"})
    else:
        return jsonify({"status": "already_recording"}), 409

@app.route("/record/stop", methods=["POST"])
def stop_record():
    if stop_recording():
        return jsonify({"status": "recording_stopped"})
    else:
        return jsonify({"status": "not_recording"}), 409

@app.route("/record/status")
def record_status():
    global recording
    return jsonify({"recording": recording})

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
    threading.Thread(target=usb_button_listener, daemon=True).start()
    app.run(host="0.0.0.0", port=PORT)
