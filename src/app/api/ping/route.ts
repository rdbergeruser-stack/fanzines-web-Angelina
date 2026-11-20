import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    // Consulta liviana para despertar la base de datos
    const { data, error } = await supabase
      .from('fanzines')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'error', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase keep-alive ping exitoso',
      timestamp: new Date().toISOString(),
      activeFanzinesSample: data?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}
