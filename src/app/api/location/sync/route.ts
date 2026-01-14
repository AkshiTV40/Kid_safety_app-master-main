import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, device_id, latitude, longitude, timestamp, method = 'ip' } = body;

    if (!user_id || !device_id || latitude === undefined || longitude === undefined || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('locations')
      .insert({
        user_id,
        device_id,
        latitude,
        longitude,
        timestamp,
        method
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Location sync failed', e);
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 500 });
  }
}