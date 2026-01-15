#!/bin/bash
set -e

echo "🚀 Installing Raspberry Pi Safety Device"

# ---------------- SYSTEM ----------------
sudo apt update
sudo apt install -y \
  python3 python3-pip python3-venv \
  ffmpeg \
  git \
  libatlas-base-dev \
  libjpeg-dev \
  libopenjp2-7 \
  libtiff5 \
  libgtk-3-dev \
  libv4l-dev \
  network-manager \
  qrencode \
  portaudio19-dev

# Enable camera
sudo raspi-config nonint do_camera 0

# ---------------- PROJECT ----------------
cd /home/pi
rm -rf raspi-backend
git clone https://github.com/YOUR_REPO/raspi-backend.git
cd raspi-backend

# ---------------- PYTHON ----------------
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

pip install \
  flask flask-cors \
  requests python-dotenv \
  opencv-python-headless \
  numpy \
  gpiozero \
  qrcode[pil] \
  aiortc \
  av

# ---------------- ENV ----------------
cat <<EOF > .env
DEVICE_ID=raspi-demo-01
USER_ID=demo-user-001
SYNC_BASE_URL=https://kid-safety-app.vercel.app
STREAM_PORT=8000
HELP_BUTTON_PIN=17
LED_PIN=27
DEMO_MODE=true
EOF

# ---------------- WIFI (HOTSPOT AUTO-CONNECT) ----------------
nmcli device wifi connect "Samsung Galaxy S6 5192" password "akshi123" || true

# ---------------- SYSTEMD AUTOSTART ----------------
sudo tee /etc/systemd/system/raspi-safety.service > /dev/null <<EOF
[Unit]
Description=Raspberry Pi Safety Backend
After=network-online.target
Wants=network-online.target

[Service]
User=pi
WorkingDirectory=/home/pi/raspi-backend
ExecStart=/home/pi/raspi-backend/venv/bin/python app.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable raspi-safety
sudo systemctl restart raspi-safety

echo "✅ INSTALL COMPLETE"
echo "🔌 Rebooting..."
sudo reboot