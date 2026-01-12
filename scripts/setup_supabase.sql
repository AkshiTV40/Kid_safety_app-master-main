-- Simple Supabase Setup for Kid Safety App
-- Run each command separately in Supabase SQL Editor

-- 1. Create the videos table
CREATE TABLE videos (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  size BIGINT NOT NULL,
  device_id TEXT DEFAULT 'rpi'
);

-- 2. Enable security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to read videos
CREATE POLICY "Public read access" ON videos
FOR SELECT TO anon
USING (true);

-- 4. Allow server to add videos
CREATE POLICY "Allow insert" ON videos
FOR INSERT TO service_role
WITH CHECK (true);

-- 5. Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- 6. Allow public access to video files
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- 7. Allow uploads to videos bucket
CREATE POLICY "Allow Uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');