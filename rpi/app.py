#!/usr/bin/env python3
import os
import time
import threading
import platform
import subprocess
from datetime import datetime
from flask import Flask, Response, jsonify, send_from_directory, request
from flask_cors import CORS
from picamzero import Camera
from gpiozero import Button
import geocoder
from dotenv import load_dotenv
import requests
from collections import deque

# Check if running on Raspberry Pi
if platform.machine() not in ['armv7l', 'aarch64']:
    print("❌ This backend must run on a Raspberry Pi with Pi Camera Zero.")
    exit(1)

# ---------------- CONFIG ---------------- #

load_dotenv()

DEVICE_ID = os.getenv("DEVICE_ID", "raspi")
HELP_PIN = int(os.getenv("HELP_BUTTON_PIN", "17"))
PORT = int(os.getenv("STREAM_PORT", "8000"))

# Sync configuration
SYNC_BASE_URL = os.getenv("SYNC_BASE_URL", "https://your-vercel-app.vercel.app")
USER_ID = os.getenv("USER_ID")  # UUID of the user this device belongs to
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

# Upload queue for retry
upload_queue = deque()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEOS_DIR = os.path.join(BASE_DIR, "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)

UPLOAD_URL = os.getenv("UPLOAD_URL", f"{SYNC_BASE_URL}/api/recordings/upload")

sync_enabled = bool(SYNC_BASE_URL and USER_ID)
if sync_enabled:
    print("Sync enabled")
else:
    print("Warning: Sync disabled - SYNC_BASE_URL or USER_ID not set")

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
        print("✅ Saved locally:", filepath)

        # Queue for upload
        upload_queue.append(filepath)

    except Exception as e:
        print("❌ Error:", e)
    finally:
        is_recording = False

# ---------------- LOCATION & SYNC ---------------- #

def get_location():
    if DEMO_MODE:
        return {
            "latitude": 37.7397,  # Tracy, CA
            "longitude": -121.4252,
            "method": "demo",
            "timestamp": int(time.time())
        }

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

def sync_location():
    """Sync current location via API"""
    if not sync_enabled:
        return

    try:
        loc = get_location()
        if loc["latitude"] != 0.0 or loc["longitude"] != 0.0:
            data = {
                "user_id": USER_ID,
                "device_id": DEVICE_ID,
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "timestamp": loc["timestamp"],
                "method": loc["method"]
            }
            response = requests.post(f"{SYNC_BASE_URL}/api/location/sync", json=data)
            if response.status_code == 200:
                print("Location synced")
            else:
                print("Location sync failed:", response.text)
    except Exception as e:
        print("❌ Location sync failed:", e)

def sync_device_status():
    """Update device status via API"""
    if not sync_enabled:
        return

    try:
        loc = get_location()
        data = {
            "user_id": USER_ID,
            "device_id": DEVICE_ID,
            "name": f"Raspberry Pi ({DEVICE_ID})",
            "type": "rpi",
            "is_online": True,
            "location": loc
        }
        response = requests.post(f"{SYNC_BASE_URL}/api/devices/sync", json=data)
        if response.status_code == 200:
            print("Device status synced")
        else:
            print("Device sync failed:", response.text)
    except Exception as e:
        print("❌ Device sync failed:", e)

def upload_worker():
    """Background thread to retry uploads"""
    while True:
        if upload_queue:
            path = upload_queue[0]
            try:
                with open(path, 'rb') as f:
                    files = {'file': (os.path.basename(path), f, 'video/mp4')}
                    data = {'device_id': DEVICE_ID}
                    if USER_ID:
                        data['user_id'] = USER_ID
                    response = requests.post(UPLOAD_URL, files=files, data=data, timeout=15)
                if response.status_code == 200:
                    data = response.json()
                    video_url = data['url']
                    print("☁️ Uploaded:", path)
                    upload_queue.popleft()
                else:
                    print("Upload failed, retrying:", response.text)
                    time.sleep(5)
            except Exception as e:
                print("Upload error, retrying:", e)
                time.sleep(5)
        else:
            time.sleep(1)

def scan_wifi():
    """Scan for nearby WiFi networks"""
    try:
        result = subprocess.run(['sudo', 'iwlist', 'wlan0', 'scan'], capture_output=True, text=True, timeout=10)
        networks = []
        current = {}
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line.startswith('Cell '):
                if current:
                    networks.append(current)
                current = {}
            elif 'Address:' in line:
                current['mac'] = line.split()[-1]
            elif 'ESSID:' in line:
                current['ssid'] = line.split('"')[1] if '"' in line else ''
            elif 'Encryption key:' in line:
                current['encrypted'] = 'on' in line
        if current:
            networks.append(current)
        return networks
    except Exception as e:
        print("WiFi scan error:", e)
        return []

def connect_wifi(ssid, password=None):
    """Connect to WiFi network"""
    try:
        if password:
            result = subprocess.run(['sudo', 'nmcli', 'device', 'wifi', 'connect', ssid, 'password', password], capture_output=True, text=True, timeout=30)
        else:
            result = subprocess.run(['sudo', 'nmcli', 'device', 'wifi', 'connect', ssid], capture_output=True, text=True, timeout=30)
        return result.returncode == 0
    except Exception as e:
        print("WiFi connect error:", e)
        return False

def scan_devices():
    """Scan for devices on the current network"""
    try:
        result = subprocess.run(['sudo', 'arp-scan', '--localnet', '--quiet'], capture_output=True, text=True, timeout=15)
        devices = []
        for line in result.stdout.split('\n'):
            parts = line.split('\t')
            if len(parts) >= 3:
                ip, mac, vendor = parts[0], parts[1], parts[2] if len(parts) > 2 else ''
                devices.append({'ip': ip, 'mac': mac, 'vendor': vendor})
        return devices
    except Exception as e:
        print("Device scan error:", e)
        return []

def wifi_manager():
    """Background thread for WiFi management"""
    while True:
        networks = scan_wifi()
        print(f"Found {len(networks)} WiFi networks")
        for net in networks:
            if not net.get('encrypted', True):  # Connect to open networks
                if connect_wifi(net['ssid']):
                    print(f"Connected to {net['ssid']}")
                    devices = scan_devices()
                    print(f"Found {len(devices)} devices on network")
                    # Here, could establish connections or sync
                    break
        time.sleep(60)  # Scan every minute

def start_sync_loop():
    """Background thread to sync location and status periodically"""
    def sync_loop():
        while True:
            sync_location()
            sync_device_status()
            time.sleep(300)  # Sync every 5 minutes

    if sync_enabled:
        threading.Thread(target=sync_loop, daemon=True).start()
        print("Started sync loop")

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

@app.route("/demo")
def demo():
    return jsonify({
        "status": "Demo Mode Active" if DEMO_MODE else "Production Mode",
        "device": DEVICE_ID,
        "uploads_pending": len(upload_queue),
        "sync": sync_enabled
    })

@app.route("/wifi/scan")
def wifi_scan():
    networks = scan_wifi()
    return jsonify(networks)

@app.route("/wifi/connect", methods=["POST"])
def wifi_connect():
    data = request.json
    ssid = data.get('ssid')
    password = data.get('password')
    if not ssid:
        return jsonify({"error": "SSID required"}), 400
    success = connect_wifi(ssid, password)
    return jsonify({"connected": success})

@app.route("/devices/scan")
def devices_scan():
    devices = scan_devices()
    return jsonify(devices)

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
    threading.Thread(target=upload_worker, daemon=True).start()  # Start upload worker
    threading.Thread(target=wifi_manager, daemon=True).start()  # Start WiFi manager
    start_sync_loop()  # Start background sync
    print("🚀 Raspberry Pi backend running")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
