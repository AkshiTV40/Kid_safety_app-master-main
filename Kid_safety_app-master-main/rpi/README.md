Guardian Keychain — Raspberry Pi Companion

Overview

This folder contains example Python code to run on a Raspberry Pi with a camera module and buttons (e.g., On/Off and Help/SOS). The script runs a small Flask server that: 
- Serves an MJPEG camera stream
- Allows remote control (start/stop camera)
- Sends events when local buttons are pressed (POST to your server)

Requirements

- Raspberry Pi OS (Bullseye/Bookworm)
- Python 3.9+ recommended
- Camera connected and enabled (raspi-config or libcamera/picamera2 depending on setup)

Installation

1. Install system dependencies (recommended)

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip python3-opencv build-essential cmake libjpeg-dev libatlas-base-dev libavcodec-dev libavformat-dev libswscale-dev
```

> **Tip:** Installing OpenCV via `apt` is recommended on Raspberry Pi OS — pip may attempt to build OpenCV from source on ARM devices and require many build dependencies.

2. Create a Python virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and update values

4. Run the service (for local testing)

```bash
python app.py
```

5. To run as a background service, configure the `guardian_rpi.service` systemd unit (see below) and update the unit's paths if your project is located somewhere else (e.g., `WorkingDirectory` and `ExecStart` paths).

Hardware wiring

- HELP button: Connect one side to a GPIO pin (default: 17) and the other to GND
- POWER toggle button: Connect to another GPIO pin (default: 27) and to GND
- Camera: Connect the camera ribbon to the camera port and enable camera in raspi-config

Default GPIO mapping (can be changed via `.env`):
- HELP_BUTTON_PIN=17
- POWER_BUTTON_PIN=27

Environment variables (`.env`)

- SERVER_URL: `https://your-server/api/rpi-events` (where the Pi will POST events)
- DEVICE_ID: unique id for the Pi
- API_KEY: optional shared secret header for authentication
- HELP_BUTTON_PIN, POWER_BUTTON_PIN: GPIO pins used for buttons

Systemd unit

Copy `guardian_rpi.service` to `/etc/systemd/system/guardian_rpi.service`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable guardian_rpi
sudo systemctl start guardian_rpi
sudo journalctl -u guardian_rpi -f
```

**Note:** Double-check and update `WorkingDirectory` and `ExecStart` in `guardian_rpi.service` to match your deployment paths (for example, `/home/pi/guardian-keychain/rpi` and the path to your virtualenv python).
Security

- Use HTTPS for SERVER_URL
- Use API_KEY to authenticate requests from the Pi

Notes

This example uses OpenCV for camera capture which works with USB cameras and some Pi cameras. If using the official camera module with libcamera, you may prefer `picamera2`.

Using the official Raspberry Pi Camera Module (libcamera / picamera2) 🔧

- Enable the camera support: run `sudo raspi-config` → Interface Options → Camera (or ensure libcamera is available on Bookworm).
- Install Picamera2 and libcamera apps (recommended on Raspberry Pi OS):

```bash
sudo apt update
sudo apt install -y python3-picamera2 libcamera-apps
```

- Test the camera:
  - `libcamera-hello` (preview)
  - `libcamera-jpeg -o test.jpg` (capture image)

- To use picamera2 with this service either set `CAMERA_BACKEND=picamera2` in `.env` or leave it on `auto` (the service will use picamera2 when available).

- Note: Picamera2 is typically installed via apt on Raspberry Pi OS; if a pip wheel is available for your platform you can try installing `picamera2` via pip, but apt is preferred.

**See** `rpi/requirements.txt` for the canonical list of Python packages used by this example (install into your virtualenv on development machines). `picamera2` is Raspberry Pi–specific and is best installed via apt on Raspberry Pi OS (see note in `rpi/requirements.txt`).

The code is purposely simple and should be extended to match your exact hardware and security needs.

---

## Deployment script (recommended)

A helper script is provided to automate common setup steps on a Raspberry Pi:

```bash
# From repository root (on the Pi):
sudo ./rpi/setup_rpi.sh
```

What it does:
- Installs recommended apt packages (Python, OpenCV system packages, build deps)
- Creates a Python virtualenv (`.venv` by default)
- Installs Python requirements from `rpi/requirements.txt`
- Copies `.env.example` to `.env` if missing
- Installs a systemd unit at `/etc/systemd/system/guardian_rpi.service` and starts the service

Notes:
- To skip Picamera2/libcamera install on non-RPi machines, run `SKIP_PICAMERA=1 sudo ./rpi/setup_rpi.sh`.
- Review and edit `rpi/.env` before starting the service to set `SERVER_URL`, `API_KEY`, and pins.
- A template `rpi/guardian_rpi.service.example` is provided as a reference if you prefer to create a systemd unit by hand.

Testing

A small test utility is included to exercise the RPi companion endpoints:

```bash
# From project root (with virtualenv activated):
python rpi/check_rpi.py --base http://127.0.0.1:8000
# To also check the MJPEG stream briefly:
python rpi/check_rpi.py --base http://127.0.0.1:8000 --check-stream
# If running on a development machine without a camera, skip camera start/stop with:
python rpi/check_rpi.py --base http://127.0.0.1:8000 --no-camera

Windows helper scripts

- PowerShell wrapper: `rpi/run_checks.ps1`
  - Start the server, run the checks, and stop the server:
    - `.\rpi\run_checks.ps1 -StartServer`
  - Run checks against a running server (no server start):
    - `.\rpi\run_checks.ps1 -Base http://127.0.0.1:8000`
  - Skip camera start/stop if you have no camera:
    - `.\rpi\run_checks.ps1 -NoCamera`
  - Note: Windows PowerShell may block script execution due to its ExecutionPolicy. To run the script without changing system policy, use the temporary bypass:
    - `powershell -ExecutionPolicy Bypass -File .\rpi\run_checks.ps1 -StartServer -NoCamera`
    - To permanently allow scripts (requires Administrator), run in an elevated PowerShell: `Set-ExecutionPolicy RemoteSigned`

- Batch shim: `rpi/run_checks.bat` (for cmd.exe; forwards to the PowerShell script)

```

The script exits with a non-zero code on failures and prints details about any failing step.