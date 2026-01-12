#!/usr/bin/env python3
"""
Script to import existing videos from Google Drive to Supabase Storage
Run this on your local machine with internet access
"""

import os
import time
import requests
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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

def download_and_upload(url, filename):
    print(f"⬇ Downloading {filename}")
    r = requests.get(url, stream=True)
    if r.status_code != 200:
        print("❌ Download failed")
        return

    data = r.content

    print(f"⬆ Uploading {filename}")
    res = supabase.storage.from_("videos").upload(
        filename,
        data,
        file_options={"content-type": "video/mp4", "upsert": True}
    )

    if res:
        public_url = supabase.storage.from_("videos").get_public_url(filename)
        supabase.table("videos").insert({
            "filename": filename,
            "url": public_url,
            "timestamp": int(time.time() * 1000),
            "size": len(data),
            "device_id": "imported"
        }).execute()
        print("✅ Done")

if __name__ == "__main__":
    for i, link in enumerate(VIDEO_LINKS):
        download_and_upload(link, f"imported_{i+1}.mp4")
        time.sleep(1)