def record_video(duration=10):
    global recording
    if recording:
        return

    recording = True
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    filepath = os.path.join(VIDEOS_DIR, filename)

    cam.start_recording(filepath)
    start_time = time.time()
    while recording and (time.time() - start_time) < duration:
        time.sleep(0.1)
    cam.stop_recording()

    recording = False
    print(f"Saved video: {filepath}")
