#!/usr/bin/env bash
set -euo pipefail

# setup_rpi.sh — simple deployment helper for Guardian Keychain RPi service
# Usage (on the Pi):
#   cd /path/to/guardian-keychain/rpi/..  # repo root
#   sudo ./rpi/setup_rpi.sh
# Options:
#   SKIP_PICAMERA=1  (export to skip installing picamera2/libcamera packages)
#   VENV_DIR=/opt/guardian/.venv (export to use custom venv path)

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="${VENV_DIR:-$PROJECT_DIR/.venv}"
SERVICE_USER="${SERVICE_USER:-${SUDO_USER:-pi}}"
SERVICE_NAME="guardian_rpi"
SERVICE_FILE_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
REQUIREMENTS_FILE="$PROJECT_DIR/rpi/requirements.txt"
ENV_EXAMPLE="$PROJECT_DIR/rpi/.env.example"
ENV_FILE="$PROJECT_DIR/rpi/.env"

# Ensure script runs as root (for installing packages and copying service file)
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run with sudo or as root. Try: sudo $0"
  exit 1
fi

echo "Project dir: $PROJECT_DIR"
echo "Venv dir: $VENV_DIR"
echo "Service user: $SERVICE_USER"

echo "Detecting platform and setting apt options..."
ARCH="$(dpkg --print-architecture 2>/dev/null || uname -m)"
IS_PI=0
PI_MODEL=""
if [ -f /proc/device-tree/model ]; then
  PI_MODEL=$(tr -d '\0' < /proc/device-tree/model || true)
  case "$PI_MODEL" in
    *"Raspberry Pi 4"*) IS_PI=1 ;;
    *"Raspberry Pi 3"*) IS_PI=1 ;;
    *) ;;
  esac
fi

export DEBIAN_FRONTEND=noninteractive
echo "Updating apt and installing system dependencies (non-interactive)..."
apt update -y
apt-get install -y --no-install-recommends python3-venv python3-pip python3-opencv build-essential cmake libjpeg-dev libatlas-base-dev libavcodec-dev libavformat-dev libswscale-dev || true

if [ "$IS_PI" -eq 1 ]; then
  echo "Raspberry Pi detected: $PI_MODEL (arch=$ARCH). Installing Pi-specific packages..."
  apt-get install -y --no-install-recommends libcamera-apps || true
fi

if [ "${SKIP_PICAMERA:-0}" != "1" ]; then
  if [ "$IS_PI" -eq 1 ]; then
    echo "Attempting to install Picamera2/libcamera (may require apt sources for Pi OS)..."
    apt-get install -y --no-install-recommends python3-picamera2 || true
    if command -v raspi-config >/dev/null 2>&1; then
      echo "Enabling camera via raspi-config (may require reboot)..."
      raspi-config nonint do_camera 0 || true
    fi
  else
    echo "Non-Pi system detected; skipping Picamera2 apt install. To install manually set SKIP_PICAMERA=0."
  fi
fi

# Create virtualenv
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtualenv at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

PIP_BIN="$VENV_DIR/bin/pip"
PY_BIN="$VENV_DIR/bin/python"

echo "Upgrading pip..."
"$PIP_BIN" install --upgrade pip setuptools

if [ -f "$REQUIREMENTS_FILE" ]; then
  echo "Installing Python requirements from $REQUIREMENTS_FILE"
  "$PIP_BIN" install -r "$REQUIREMENTS_FILE"
else
  echo "WARNING: requirements file not found at $REQUIREMENTS_FILE"
fi

# Create .env if missing
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    echo "Creating $ENV_FILE from example"
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Please edit $ENV_FILE and set SERVER_URL / API_KEY / DEVICE_ID as needed"
  else
    echo "No .env.example found; create $ENV_FILE manually"
  fi
else
  echo "$ENV_FILE already exists; leaving it alone"
fi

# Create systemd service file
echo "Writing systemd unit to $SERVICE_FILE_PATH"
cat > "$SERVICE_FILE_PATH" <<EOF
[Unit]
Description=Guardian Keychain Raspberry Pi Service
After=network.target

[Service]
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR/rpi
EnvironmentFile=$PROJECT_DIR/rpi/.env
ExecStart=$VENV_DIR/bin/python $PROJECT_DIR/rpi/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME" || true

echo "Setup complete. Service status (last 20 lines):"
journalctl -u "$SERVICE_NAME" -n 20 --no-pager || true

cat <<MSG

Next steps:
  - Edit '$ENV_FILE' and set SERVER_URL, API_KEY, DEVICE_ID, pins if needed.
  - If using the official Pi camera, ensure the camera is enabled in raspi-config.
  - Check camera is accessible: run 'libcamera-hello' or check /camera/stream after starting camera via POST /camera/start
  - View logs: sudo journalctl -u $SERVICE_NAME -f

MSG

exit 0
