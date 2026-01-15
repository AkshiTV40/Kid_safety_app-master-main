import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, device_id, name, type = 'rpi', is_online = true, location, ip_address, port } = body;

    if (!user_id || !device_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('devices')
      .upsert({
        user_id,
        device_id,
        name: name || `Raspberry Pi (${device_id})`,
        type,
        last_seen: new Date().toISOString(),
        is_online,
        location,
        ip_address,
        port
      }, {
        onConflict: 'user_id,device_id'
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Device sync failed', e);
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 500 });
  }
}