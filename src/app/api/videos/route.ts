import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}