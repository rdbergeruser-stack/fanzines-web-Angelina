import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado: solo administradores' }, { status: 403 });
    }

    const { userId, fanzineId, status = 'approved', notes } = await request.json();

    if (!userId || !fanzineId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Actualizar o insertar en user_access
    const { error: upsertError } = await admin
      .from('user_access')
      .upsert(
        {
          user_id: userId,
          fanzine_id: fanzineId,
          status: status,
          notes: notes || 'Habilitado manualmente por la administradora',
          granted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,fanzine_id' }
      );

    if (upsertError) throw upsertError;

    // Si fue aprobado o rechazado, actualizar cualquier notificación de pago pendiente de ese usuario y fanzine
    await admin
      .from('payment_notifications')
      .update({ status: status })
      .eq('user_id', userId)
      .eq('fanzine_id', fanzineId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in grant-access:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
