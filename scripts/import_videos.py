#!/usr/bin/env python3
"""
Script to import existing videos from Google Drive to Supabase Storage
Run this on your local machine with internet access
"""

import os
import requests
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for server operations

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of Google Drive video links
VIDEO_LINKS = [
    "https://drive.google.com/uc?id=1nbPXnr26pgJj9CobCEEgUNKxwgjvkAga",
    "https://drive.google.com/uc?id=10d2mLTJ4phxO9nSlQsoFCdkcRittq3tG",
    "https://drive.google.com/uc?id=1xupWIJCdxpe1u_a7ZGqVz-UnoX43JGDC",
    "https://drive.google.com/uc?id=1m2QHrNJGKYOdY8sUoaBB20qALtM9KF84",
    "https://drive.google.com/uc?id=1vZqUAuu2n9rRX8-vzcX4jxj8N3BvyWx0",
    "https://drive.google.com/uc?id=1gsmgUdIQ9h2mRDBatIDc2tOqEULWuYQz",
    "https://drive.google.com/uc?id=1mElIt8KjYV-4VXf2bH-P4SmCr8qLd9f2",
    "https://drive.google.com/uc?id=1qnj0OhpNKG5dg57lFE-9Q0K4yr1aACKD"
]

def download_and_upload(url: str, filename: str):
    print(f"Downloading {filename}...")
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to download {filename}")
        return

    video_data = response.content

    print(f"Uploading {filename} to Supabase...")
    bucket = supabase.storage.from_('videos')
    result = bucket.upload(filename, video_data, {"content-type": "video/mp4"})

    if result.status_code == 200:
        # Get public URL
        public_url = supabase.storage.from_('videos').get_public_url(filename)

        # Save metadata
        supabase.table('videos').insert({
            "filename": filename,
            "url": public_url,
            "timestamp": int(time.time() * 1000),
            "size": len(video_data),
            "device_id": "imported"
        }).execute()

        print(f"✅ Successfully imported {filename}")
    else:
        print(f"❌ Failed to upload {filename}: {result}")

if __name__ == "__main__":
    import time

    for i, link in enumerate(VIDEO_LINKS):
        filename = f"imported_video_{i+1}.mp4"
        download_and_upload(link, filename)
        time.sleep(1)  # Rate limiting

    print("Import complete!")