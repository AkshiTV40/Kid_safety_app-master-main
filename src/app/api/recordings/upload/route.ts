import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
    }

    // Convert to MP4
    const buffer = await file.arrayBuffer();
    const inputStream = new PassThrough();
    inputStream.end(Buffer.from(buffer));

    const outputBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      ffmpeg(inputStream)
        .inputFormat(file.type.split('/')[1]) // e.g., 'webm'
        .toFormat('mp4')
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('error', (err) => reject(err))
        .pipe(new PassThrough())
        .on('data', (chunk) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)));
    });

    const filename = `recording-${Date.now()}.mp4`;

    // Upload to Supabase Storage
    const supabase = createClient();
    const { data, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filename, outputBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filename);

    // Store metadata in Supabase
    const { error } = await supabase
      .from('videos')
      .insert({
        filename,
        url: urlData.publicUrl,
        timestamp: Date.now(),
        size: outputBuffer.length,
        device_id: 'rpi'
      });

    if (error) throw error;

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (e: any) {
    console.error('Upload failed', e);
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}
