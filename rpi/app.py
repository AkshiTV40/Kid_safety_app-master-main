#!/usr/bin/env python3
"""Simple Raspberry Pi companion service
- Serves MJPEG stream at /camera/stream
- Provides /camera/start and /camera/stop endpoints
- Monitors buttons and POSTs events to SERVER_URL

This is an example. Adjust pins, security, and camera code for your hardware.
"""

import os
import time
import threading
from datetime import datetime
from flask import Flask, Response, jsonify, request, send_from_directory
import requests
import cv2
from dotenv import load_dotenv
try:
    import gps3
except ImportError:
    gps3 = None

try:
    import geocoder
except ImportError:
    geocoder = None

try:
    from gpiozero import Button
except Exception:
    Button = None

load_dotenv()

SERVER_URL = os.getenv('SERVER_URL')
DEVICE_ID = os.getenv('DEVICE_ID', 'raspi')
API_KEY = os.getenv('API_KEY', '')
HELP_PIN = int(os.getenv('HELP_BUTTON_PIN', '17'))
POWER_PIN = int(os.getenv('POWER_BUTTON_PIN', '27'))
CAM_INDEX = int(os.getenv('CAMERA_INDEX', '0'))
STREAM_PORT = int(os.getenv('STREAM_PORT', '8000'))
VIDEOS_DIR = 'videos'
os.makedirs(VIDEOS_DIR, exist_ok=True)

app = Flask(__name__)

frame = None
location = None

# Camera manager: supports OpenCV (USB webcams) and optional picamera2 (official Pi camera module)
class CameraManager:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = False
        self._stop = threading.Event()
        self.cam_index = CAM_INDEX
        self.backend = os.getenv('CAMERA_BACKEND', 'auto').lower()
        self.picamera_available = False
        self.PC2 = None
        if self.backend in ('auto', 'picamera2'):
            try:
                # Picamera2 is Raspberry Pi specific; allow import errors on non-Pi systems
                from picamera2 import Picamera2  # type: ignore[import]
                self.PC2 = Picamera2
                self.picamera_available = True
            except Exception:
                self.picamera_available = False

    def start(self):
        if self.running:
            return
        self._stop.clear()
        if self.backend == 'opencv' or (self.backend == 'auto' and not self.picamera_available):
            t = threading.Thread(target=self._opencv_loop, daemon=True)
        else:
            # prefer picamera2 when available
            if self.picamera_available:
                t = threading.Thread(target=self._picamera2_loop, daemon=True)
            else:
                t = threading.Thread(target=self._opencv_loop, daemon=True)
        t.start()

    def stop(self):
        self._stop.set()

    def is_running(self):
        return self.running

    def _opencv_loop(self):
        global frame
        cap = cv2.VideoCapture(self.cam_index)
        if not cap.isOpened():
            print('Camera could not be opened (OpenCV)')
            self.running = False
            return
        self.running = True
        print('OpenCV camera started')
        while not self._stop.is_set():
            ret, img = cap.read()
            if not ret:
                time.sleep(0.1)
                continue
            # encode as JPEG
            ret, jpeg = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if ret:
                frame = jpeg.tobytes()
            time.sleep(0.1)  # ~10fps throttle for efficiency
        cap.release()
        frame = None
        self.running = False
        print('OpenCV camera stopped')

    def _picamera2_loop(self):
        global frame
        try:
            picam = self.PC2()
            # use video configuration for 1080p
            config = picam.create_video_configuration({'size': (1920, 1080)})
            picam.configure(config)
            picam.start()
        except Exception as e:
            print('Failed to start Picamera2:', e)
            self.running = False
            return
        self.running = True
        print('Picamera2 camera started at 1080p')
        while not self._stop.is_set():
            try:
                img = picam.capture_array()
                # Picamera2 returns RGB; convert to BGR for OpenCV encoding
                img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                ret, jpeg = cv2.imencode('.jpg', img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                if ret:
                    frame = jpeg.tobytes()
            except Exception as e:
                print('Picamera2 capture failed', e)
            time.sleep(0.1)  # Reduce to ~10fps for power efficiency
        try:
            picam.stop()
        except Exception:
            pass
        frame = None
        self.running = False
        print('Picamera2 camera stopped')


camera_mgr = CameraManager()

# GPS manager
class GPSManager:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = False
        self._stop = threading.Event()

    def start(self):
        if self.running or gps3 is None:
            return
        self._stop.clear()
        t = threading.Thread(target=self._gps_loop, daemon=True)
        t.start()

    def stop(self):
        self._stop.set()

    def is_running(self):
        return self.running

    def _gps_loop(self):
        global location
        while not self._stop.is_set():
            try:
                gps_socket = gps3.GPSDSocket()
                data_stream = gps3.DataStream()
                gps_socket.connect()
                gps_socket.watch()
                print('GPS connected and watching')
                break
            except Exception as e:
                print(f'Failed to connect GPS, retrying in 5 seconds: {e}')
                time.sleep(5)

        if self._stop.is_set():
            return

        self.running = True
        print('GPS started')
        consecutive_errors = 0

        while not self._stop.is_set():
            try:
                for new_data in gps_socket:
                    if new_data:
                        data_stream.unpack(new_data)
                        if data_stream.TPV['lat'] != 'n/a' and data_stream.TPV['lon'] != 'n/a':
                            location = {
                                'lat': float(data_stream.TPV['lat']),
                                'lng': float(data_stream.TPV['lon']),
                                'timestamp': int(time.time()),
                                'method': 'gps'
                            }
                            consecutive_errors = 0  # Reset error counter on successful read
                    if self._stop.is_set():
                        break
            except Exception as e:
                consecutive_errors += 1
                print(f'GPS error ({consecutive_errors}): {e}')
                if consecutive_errors > 10:
                    print('Too many GPS errors, restarting GPS connection')
                    try:
                        gps_socket.close()
                    except:
                        pass
                    time.sleep(2)
                    break  # Break to restart the connection
                time.sleep(1)

        try:
            gps_socket.close()
        except:
            pass
        self.running = False
        print('GPS stopped')

        # Auto-restart if not manually stopped
        if not self._stop.is_set():
            print('GPS auto-restarting in 5 seconds')
            time.sleep(5)
            if not self._stop.is_set():
                self.start()

gps_mgr = GPSManager()

# Geolocation manager for WiFi/IP-based location as fallback
class GeolocationManager:
    def __init__(self):
        self.last_location = None
        self.last_update = 0
        self.update_interval = 300  # Update every 5 minutes for IP-based location

    def get_location(self):
        """Get location using multiple methods with fallbacks"""
        current_time = time.time()

        # If we have recent GPS data, use it
        if location and (current_time - location.get('timestamp', 0)) < 60:  # GPS data fresh within 1 minute
            return location

        # Try WiFi-based geolocation if geocoder is available
        if geocoder and (current_time - self.last_update) > self.update_interval:
            try:
                # Try WiFi-based location first
                wifi_loc = geocoder.wifi()
                if wifi_loc and wifi_loc.ok and wifi_loc.latlng:
                    self.last_location = {
                        'lat': wifi_loc.latlng[0],
                        'lng': wifi_loc.latlng[1],
                        'timestamp': int(current_time),
                        'method': 'wifi'
                    }
                    self.last_update = current_time
                    return self.last_location
            except Exception as e:
                print(f'WiFi geolocation failed: {e}')

            try:
                # Fallback to IP-based geolocation
                ip_loc = geocoder.ip('me')
                if ip_loc and ip_loc.ok and ip_loc.latlng:
                    self.last_location = {
                        'lat': ip_loc.latlng[0],
                        'lng': ip_loc.latlng[1],
                        'timestamp': int(current_time),
                        'method': 'ip'
                    }
                    self.last_update = current_time
                    return self.last_location
            except Exception as e:
                print(f'IP geolocation failed: {e}')

        # Return cached location if available
        if self.last_location:
            return self.last_location

        # Final fallback: return a default location (shouldn't happen in real use)
        return {
            'lat': 37.7749,
            'lng': -122.4194,
            'timestamp': int(current_time),
            'method': 'fallback'
        }

geoloc_mgr = GeolocationManager()

# Continuous location updater
class LocationUpdater:
    def __init__(self):
        self.running = False
        self._stop = threading.Event()
        self.update_interval = 60  # Send updates every 60 seconds

    def start(self):
        if self.running:
            return
        self._stop.clear()
        t = threading.Thread(target=self._update_loop, daemon=True)
        t.start()

    def stop(self):
        self._stop.set()

    def _update_loop(self):
        self.running = True
        print('Location updater started')
        while not self._stop.is_set():
            try:
                current_loc = geoloc_mgr.get_location()
                if SERVER_URL and current_loc:
                    # Send location update to server
                    data = {
                        'device_id': DEVICE_ID,
                        'event': 'location_update',
                        'location': current_loc,
                        'timestamp': current_loc['timestamp']
                    }
                    headers = {'Authorization': f'Bearer {API_KEY}'} if API_KEY else {}
                    requests.post(SERVER_URL, json=data, headers=headers, timeout=10)
            except Exception as e:
                print(f'Location update failed: {e}')
            time.sleep(self.update_interval)
        self.running = False
        print('Location updater stopped')

location_updater = LocationUpdater()

def record_video(duration=30, audio=False):
    """Record video for given duration in seconds, with optional audio."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'{VIDEOS_DIR}/recording_{timestamp}.mp4'
    try:
        import subprocess
        cmd = ['libcamera-vid', '--output', filename, '--timeout', str(duration * 1000), '--width', '1920', '--height', '1080']
        if audio:
            cmd.extend(['--codec', 'libav', '--libav-format', 'mp4', '--libav-audio'])
        else:
            cmd.extend(['--codec', 'h264'])
        subprocess.run(cmd, check=True)
        print(f'Video recorded: {filename}')
    except Exception as e:
        print(f'Failed to record video: {e}')

def start_recording_thread():
    t = threading.Thread(target=record_video, daemon=True)
    t.start()


@app.route('/status', methods=['GET'])
def status():
    current_loc = geoloc_mgr.get_location()
    return jsonify({
        'device_id': DEVICE_ID,
        'camera_running': camera_mgr.is_running(),
        'gps_running': gps_mgr.is_running(),
        'location_method': current_loc.get('method', 'unknown'),
        'last_location_update': current_loc.get('timestamp', 0),
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


@app.route('/location', methods=['GET'])
def get_location():
    """Return current location using GPS or geolocation fallbacks"""
    loc = geoloc_mgr.get_location()
    return jsonify(loc)


@app.route('/camera/start', methods=['POST'])
def camera_start():
    if camera_mgr.is_running():
        return jsonify({'status': 'already running'})
    camera_mgr.start()
    return jsonify({'status': 'started'})


@app.route('/camera/stop', methods=['POST'])
def camera_stop():
    if not camera_mgr.is_running():
        return jsonify({'status': 'already stopped'})
    camera_mgr.stop()
    return jsonify({'status': 'stopping'})


def generate_mjpeg():
    global frame
    while True:
        if frame is None:
            time.sleep(0.05)
            continue
        chunk = (b'--frame\r\n'
                 b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        yield chunk
        time.sleep(0.03)


@app.route('/camera/stream')
def camera_stream():
    if not camera_mgr.is_running():
        camera_mgr.start()  # Start camera on demand for streaming
    return Response(generate_mjpeg(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/help', methods=['POST'])
def help_endpoint():
    data = {
        'device_id': DEVICE_ID,
        'event': 'help_pressed',
        'timestamp': int(time.time()),
    }
    headers = {'Authorization': f'Bearer {API_KEY}'} if API_KEY else {}
    try:
        if SERVER_URL:
            requests.post(SERVER_URL, json=data, headers=headers, timeout=5)
        else:
            print('No SERVER_URL configured, skipping POST', data)
    except Exception as e:
        print('Failed to post help event', e)
    return jsonify({'status': 'sent'})

@app.route('/videos', methods=['GET'])
def list_videos():
    try:
        files = [f for f in os.listdir(VIDEOS_DIR) if f.endswith('.avi')]
        videos = []
        for f in files:
            path = os.path.join(VIDEOS_DIR, f)
            stat = os.stat(path)
            videos.append({
                'filename': f,
                'size': stat.st_size,
                'timestamp': stat.st_mtime
            })
        videos.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify(videos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/videos/<filename>')
def get_video(filename):
    return send_from_directory(VIDEOS_DIR, filename)


def button_worker():
    # Allow disabling button monitoring on non-Pi/dev systems
    if os.getenv('DISABLE_BUTTONS', '0') == '1':
        print('DISABLE_BUTTONS=1, skipping button monitoring')
        return

    if Button is None:
        print('gpiozero not available, skipping button monitoring')
        return

    def on_help():
        print('Help button pressed')
        # start recording video
        start_recording_thread()
        # send local event
        try:
            requests.post(f'http://localhost:{STREAM_PORT}/help', timeout=2)
        except Exception:
            pass

        # send remote event
        data = {'device_id': DEVICE_ID, 'event': 'help_pressed', 'timestamp': int(time.time())}
        headers = {'Authorization': f'Bearer {API_KEY}'} if API_KEY else {}
        if SERVER_URL:
            try:
                requests.post(SERVER_URL, json=data, headers=headers, timeout=5)
            except Exception as e:
                print('Failed to post to SERVER_URL', e)

    def on_power():
        print('Open app button pressed - starting camera and GPS')
        if not camera_mgr.is_running():
            camera_mgr.start()
        if not gps_mgr.is_running():
            gps_mgr.start()

    # Try to initialize the buttons. On non-Raspberry Pi systems this can raise a
    # BadPinFactory (or other) exception; handle that gracefully and continue.
    try:
        help_btn = Button(HELP_PIN)
        help_btn.when_pressed = on_help

        power_btn = Button(POWER_PIN)
        power_btn.when_pressed = on_power
    except Exception as e:
        print('GPIO not available or unsupported on this platform, skipping button monitoring:', e)
        return


if __name__ == '__main__':
    # Start button worker in background
    t = threading.Thread(target=button_worker, daemon=True)
    t.start()

    # Optionally start camera automatically
    auto_start = os.getenv('AUTO_START_CAMERA', '1')
    if auto_start == '1':
        camera_mgr.start()

    # Optionally start GPS automatically
    auto_start_gps = os.getenv('AUTO_START_GPS', '1')
    if auto_start_gps == '1':
        gps_mgr.start()

    # Start continuous location updates
    location_updater.start()

    print(f'Starting Flask on 0.0.0.0:{STREAM_PORT}')
    app.run(host='0.0.0.0', port=STREAM_PORT)
