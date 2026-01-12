-- Supabase Setup Script for Kid Safety App
-- Run this in Supabase SQL Editor

-- Create videos table
CREATE TABLE videos (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  size BIGINT NOT NULL,
  device_id TEXT DEFAULT 'rpi'
);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON videos
FOR SELECT TO anon
USING (true);

-- Allow service role insert
CREATE POLICY "Allow insert" ON videos
FOR INSERT TO service_role
WITH CHECK (true);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- Allow public access to storage
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Allow Uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');