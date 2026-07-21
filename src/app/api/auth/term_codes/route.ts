import { NextResponse } from 'next/server';
import { supabase } from '@/shared/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabase.from('term_codes').select('*');

  if (error) {
    return NextResponse.json(
      { message: 'Failed to fetch terms codes.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ termsCodes: data });
}