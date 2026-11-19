import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const { fanzineId, referenceCode } = await request.json();

    if (!fanzineId) {
      return NextResponse.json({ error: 'Falta seleccionar el fanzine' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Guardar la notificación
    const { error: notifError } = await admin
      .from('payment_notifications')
      .insert({
        user_id: user.id,
        fanzine_id: fanzineId,
        reference_code: referenceCode || 'Notificado por el usuario',
        status: 'pending',
      });

    if (notifError) throw notifError;

    // 2. Registrar en user_access en estado 'pending' si aún no existe
    await admin
      .from('user_access')
      .upsert({
        user_id: user.id,
        fanzine_id: fanzineId,
        status: 'pending',
        notes: `Transferencia informada: ${referenceCode || 'Sin comprobante adjunto'}`
      }, { onConflict: 'user_id,fanzine_id' });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in notify-payment:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
