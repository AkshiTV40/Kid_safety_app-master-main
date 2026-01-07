# Comprehensive Raspberry Pi Setup Guide for Kid Safety App

This guide provides detailed instructions for setting up the Raspberry Pi companion service for the Kid Safety App. The service runs a Flask server on the Pi that provides camera streaming, button monitoring, GPS tracking, and video recording capabilities, integrating with the main app via API calls.

## Hardware Requirements

### Minimum Hardware
- **Raspberry Pi**: Model 3B+ or 4 (recommended for better performance with camera and video processing)
- **Camera**: 
  - Official Raspberry Pi Camera Module (v2 or v3) for best compatibility with libcamera/picamera2
  - Or USB webcam (compatible with OpenCV)
- **Buttons**: 2 momentary push buttons for HELP/SOS and POWER functions
- **Power Supply**: Official Raspberry Pi power supply (5V, 3A for Pi 4)
- **MicroSD Card**: 16GB or larger, Class 10

### Optional Hardware
- **GPS Module**: USB GPS receiver (e.g., u-blox NEO-6M) for location tracking
- **Case**: Protective case for the Pi
- **Cooling**: Heat sinks or fan for Pi 4

### Wiring Diagram
- HELP button: Connect one side to GPIO pin 17, other to GND
- POWER button: Connect one side to GPIO pin 27, other to GND
- Camera: Connect ribbon cable to CSI port and enable in raspi-config

## Software Requirements

### Operating System
- **Raspberry Pi OS**: Bullseye (11) or Bookworm (12) 64-bit Lite or Desktop
- **Python**: 3.9 or higher (pre-installed on Pi OS)

### System Dependencies
- `python3-venv` - Virtual environment support
- `python3-pip` - Python package manager
- `python3-opencv` - OpenCV for camera processing
- `python3-picamera2` - Pi camera support (optional, for official camera module)
- `libcamera-apps` - Camera utilities
- `build-essential cmake libjpeg-dev libatlas-base-dev libavcodec-dev libavformat-dev libswscale-dev` - Build dependencies

### Python Dependencies
See `requirements.txt` for full list:
- Flask>=2.0 - Web server
- requests - HTTP client for API calls
- python-dotenv - Environment variable loading
- gpiozero - GPIO button handling
- opencv-python-headless - Computer vision
- gps3 - GPS support (optional)
- picamera2 - Pi camera support (optional)

## Installation Steps

### Option 1: Automated Setup (Recommended)

1. **Flash Raspberry Pi OS** to SD card using Raspberry Pi Imager
2. **Initial Setup**: Boot Pi, configure WiFi, enable SSH, update system
3. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd Kid_safety_app-master-main
   ```
4. **Run Automated Setup**:
   ```bash
   sudo ./rpi/setup_rpi.sh
   ```
   This script will:
   - Install system dependencies
   - Create Python virtual environment
   - Install Python packages
   - Configure systemd service
   - Start the service

### Option 2: Manual Installation

1. **Update System**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install System Dependencies**:
   ```bash
   sudo apt install -y python3-venv python3-pip python3-opencv build-essential cmake libjpeg-dev libatlas-base-dev libavcodec-dev libavformat-dev libswscale-dev
   ```

3. **Enable Camera** (if using Pi Camera):
   ```bash
   sudo raspi-config
   # Navigate to Interface Options > Camera > Enable
   ```

4. **Install Pi Camera Support** (optional):
   ```bash
   sudo apt install -y python3-picamera2 libcamera-apps
   ```

5. **Create Virtual Environment**:
   ```bash
   cd rpi
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

6. **Configure Environment**:
   Create `.env` file (see Configuration section below)

7. **Test Service**:
   ```bash
   python app.py
   ```

8. **Setup Systemd Service**:
   ```bash
   sudo cp guardian_rpi.service.example /etc/systemd/system/guardian_rpi.service
   sudo systemctl daemon-reload
   sudo systemctl enable guardian_rpi
   sudo systemctl start guardian_rpi
   ```

## Configuration

### Environment Variables (.env file)

Create a `.env` file in the `rpi/` directory with the following variables:

```bash
# Required: URL of your kid safety app server
SERVER_URL=https://your-app-domain.com/api/rpi-events

# Required: Unique identifier for this Pi device
DEVICE_ID=pi-keychain-001

# Optional: API key for authentication (if required by your app)
API_KEY=your-secret-api-key

# GPIO pins for buttons (default values)
HELP_BUTTON_PIN=17
POWER_BUTTON_PIN=27

# Camera settings
CAMERA_INDEX=0  # For USB cameras, 0 is usually correct
CAMERA_BACKEND=auto  # 'auto', 'opencv', or 'picamera2'

# Service settings
STREAM_PORT=8000
AUTO_START_CAMERA=1  # Start camera on boot
AUTO_START_GPS=1     # Start GPS on boot (if available)

# Optional: Disable button monitoring for testing
DISABLE_BUTTONS=0

# Optional: Fixed location coordinates for this device (latitude, longitude)
# If set, these will be used instead of GPS/geolocation for consistent location
# Useful for indoor testing or when GPS is not available
# DEVICE_LAT=37.7749
# DEVICE_LNG=-122.4194
```

### GPIO Pin Configuration

Default pins:
- HELP/SOS Button: GPIO 17
- POWER Button: GPIO 27

Change these in `.env` if needed, ensuring they don't conflict with other hardware.

### Systemd Service Configuration

The service file (`guardian_rpi.service`) should be installed at `/etc/systemd/system/guardian_rpi.service`. Update paths if your installation differs from the default.

## Integration with Kid Safety App

### API Endpoints

The Pi service exposes these endpoints:

- `GET /status` - Service status (camera, GPS running state)
- `GET /health` - Health check
- `GET /location` - Current GPS location
- `POST /camera/start` - Start camera streaming
- `POST /camera/stop` - Stop camera streaming
- `GET /camera/stream` - MJPEG video stream
- `POST /help` - Trigger help event (also triggered by button)
- `GET /videos` - List recorded videos
- `GET /videos/<filename>` - Download video file

### Event Posting

The Pi posts events to `SERVER_URL` when:
- HELP button is pressed (triggers video recording)
- POWER button is pressed (starts camera and GPS)

Event payload example:
```json
{
  "device_id": "pi-keychain-001",
  "event": "help_pressed",
  "timestamp": 1640995200
}
```

### Video Recording

HELP button press automatically starts 30-second video recording using `libcamera-vid`. Videos are saved in `rpi/videos/` directory.

## Testing and Troubleshooting

### Basic Testing

1. **Check Service Status**:
   ```bash
   sudo systemctl status guardian_rpi
   ```

2. **View Logs**:
   ```bash
   sudo journalctl -u guardian_rpi -f
   ```

3. **Test Endpoints**:
   Use the included test script:
   ```bash
   python rpi/check_rpi.py --base http://localhost:8000
   ```

### Camera Issues

- **Pi Camera**: Ensure enabled in raspi-config, test with `libcamera-hello`
- **USB Camera**: Check with `ls /dev/video*`, may need different CAMERA_INDEX

### Button Issues

- Verify GPIO pins are correct
- Check wiring (pull-up resistors may be needed)
- Test with `gpiozero` examples

### Network Issues

- Ensure Pi can reach SERVER_URL
- Check firewall settings
- Verify API_KEY if authentication is required

## Security Considerations

- Use HTTPS for SERVER_URL
- Implement API_KEY authentication
- Keep system updated
- Use strong, unique DEVICE_ID
- Consider VPN for remote access
- Regularly rotate API keys

## Performance Optimization

- Use Pi 4 for better video processing
- Adjust camera resolution in app.py if needed
- Monitor CPU/GPU usage with `htop`
- Consider headless setup (no desktop) for better performance

## Maintenance

- **Updates**: Pull latest code, reinstall requirements
- **Logs**: Monitor systemd logs regularly
- **Storage**: Clean up old videos periodically
- **Backup**: Backup .env file and configuration

## Support

If issues persist:
1. Check existing GitHub issues
2. Provide logs and configuration (redact sensitive info)
3. Include Pi model, OS version, and camera type