#!/usr/bin/env python3
"""Simple health-check/test utility for the Raspberry Pi companion service.

Usage:
  python rpi/check_rpi.py --base http://127.0.0.1:8000 [--check-stream] [--timeout 10]

The script performs the following checks:
 - GET /health
 - GET /status
 - POST /camera/start and poll until camera_running is True
 - Optionally check /camera/stream for an MJPEG boundary
 - POST /camera/stop and poll until camera_running is False

Exit status: 0 on success, non-zero on any failure.
"""

import sys
import time
import argparse
from typing import Optional

import requests


def get_json(path: str, base: str, timeout: int = 5):
    try:
        r = requests.get(base + path, timeout=timeout)
    except Exception as e:
        return None, f'HTTP error: {e}'
    if r.status_code != 200:
        return None, f'Bad status {r.status_code}'
    try:
        return r.json(), None
    except Exception as e:
        return None, f'JSON parse error: {e}'


def post_json(path: str, base: str, timeout: int = 5):
    try:
        r = requests.post(base + path, timeout=timeout)
    except Exception as e:
        return None, f'HTTP error: {e}'
    if r.status_code != 200:
        return None, f'Bad status {r.status_code}'
    try:
        return r.json(), None
    except Exception as e:
        return None, f'JSON parse error: {e}'


def check_stream(base: str, timeout: int = 5):
    url = base + '/camera/stream'
    try:
        r = requests.get(url, stream=True, timeout=timeout)
    except Exception as e:
        return False, f'HTTP error: {e}'
    if r.status_code != 200:
        return False, f'Bad status {r.status_code}'
    # Read a small chunk and look for JPEG boundary
    try:
        chunk = r.raw.read(2048)
    except Exception as e:
        return False, f'read error: {e}'
    if b'--frame' in chunk or b'Content-Type: image/jpeg' in chunk:
        return True, None
    return False, 'no MJPEG boundary found in stream sample'


def poll_status(base: str, expect_running: bool, timeout: int = 10, interval: float = 0.5):
    deadline = time.time() + timeout
    while time.time() < deadline:
        j, err = get_json('/status', base, timeout=2)
        if j is None:
            time.sleep(interval)
            continue
        running = bool(j.get('camera_running'))
        if running == expect_running:
            return True, None
        time.sleep(interval)
    return False, f'camera_running did not become {expect_running} within {timeout}s'


def main(argv: Optional[list] = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--base', default='http://127.0.0.1:8000', help='Base URL of the service')
    p.add_argument('--timeout', type=int, default=10, help='Timeout for start/stop polling (seconds)')
    p.add_argument('--check-stream', action='store_true', help='Verify MJPEG stream contains a frame boundary')
    p.add_argument('--no-camera', action='store_true', help='Skip starting/stopping the camera (useful for dev machines without a camera)')

    args = p.parse_args(argv)
    base = args.base.rstrip('/')

    print('Checking /health...')
    j, err = get_json('/health', base)
    if j is None:
        print('FAIL /health ->', err)
        return 2
    print('OK /health ->', j)

    print('Checking /status...')
    j, err = get_json('/status', base)
    if j is None:
        print('FAIL /status ->', err)
        return 3
    print('OK /status ->', j)

    if args.no_camera:
        print('Skipping camera start/stop (--no-camera)')
    else:
        print('Stopping camera (best-effort)')
        post_json('/camera/stop', base)
        ok, err = poll_status(base, expect_running=False, timeout=args.timeout)
        if not ok:
            print('FAIL stopping camera ->', err)
            # Continue to try starting
        else:
            print('camera stopped')

        print('Starting camera')
        j, err = post_json('/camera/start', base)
        if j is None:
            print('FAIL /camera/start ->', err)
            return 4
        print('start response ->', j)
        ok, err = poll_status(base, expect_running=True, timeout=args.timeout)
        if not ok:
            print('FAIL starting camera ->', err)
            return 5
        print('camera started')

        if args.check_stream:
            print('Checking /camera/stream (sample read)...')
            ok, err = check_stream(base, timeout=5)
            if not ok:
                print('FAIL /camera/stream ->', err)
                return 6
            print('OK /camera/stream')

    print('Stopping camera (cleanup)')
    post_json('/camera/stop', base)
    ok, err = poll_status(base, expect_running=False, timeout=args.timeout)
    if not ok:
        print('WARNING: could not stop camera cleanly ->', err)

    print('All checks passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
