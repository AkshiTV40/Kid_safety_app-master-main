-- Complete Supabase Setup for Kid Safety App with Multi-Device Sync
-- Run each command separately in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the videos table
CREATE TABLE videos (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  size BIGINT NOT NULL,
  device_id TEXT DEFAULT 'rpi',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Create guardians table for multi-device sync
CREATE TABLE guardians (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- 3. Create locations table for device tracking
CREATE TABLE locations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  timestamp BIGINT NOT NULL,
  method TEXT DEFAULT 'gps'
);

-- 4. Create devices table for RPi status tracking
CREATE TABLE devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT,
  type TEXT DEFAULT 'rpi',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  battery_level INTEGER,
  location JSONB,
  UNIQUE(user_id, device_id)
);

-- 5. Enable Row Level Security on all tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- 6. Videos policies
CREATE POLICY "Users can view their own videos" ON videos
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert videos" ON videos
FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Public read access for videos" ON videos
FOR SELECT TO anon
USING (true);

-- 7. Guardians policies
CREATE POLICY "Users can manage their own guardians" ON guardians
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Locations policies
CREATE POLICY "Users can view their own locations" ON locations
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert locations" ON locations
FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Users can insert their own locations" ON locations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 9. Devices policies
CREATE POLICY "Users can manage their own devices" ON devices
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update devices" ON devices
FOR ALL TO service_role
USING (true);

-- 10. Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Allow public access to video files
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- 12. Allow uploads to videos bucket
CREATE POLICY "Allow Uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

-- 13. Create indexes for performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_timestamp ON videos(timestamp DESC);
CREATE INDEX idx_guardians_user_id ON guardians(user_id);
CREATE INDEX idx_locations_user_id_timestamp ON locations(user_id, timestamp DESC);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_last_seen ON devices(last_seen DESC);