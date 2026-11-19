import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
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

    // Traer todos los usuarios registrados
    const { data: profiles, error: pError } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError) throw pError;

    // Traer todos los accesos actuales
    const { data: accesses, error: aError } = await admin
      .from('user_access')
      .select('*');

    if (aError) throw aError;

    // Traer notificaciones de pago pendientes
    const { data: notifs, error: nError } = await admin
      .from('payment_notifications')
      .select('*, fanzine:fanzines(*), profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (nError) throw nError;

    return NextResponse.json({
      profiles: profiles || [],
      accesses: accesses || [],
      notifications: notifs || []
    });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
