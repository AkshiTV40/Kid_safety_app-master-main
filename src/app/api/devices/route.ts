import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || 'demo-user'; // Default for demo

    const supabase = createClient();

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Devices fetch failed', e);
    return NextResponse.json({ error: e?.message || 'Fetch failed' }, { status: 500 });
  }
}