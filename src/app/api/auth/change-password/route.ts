import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para cambiar tu contraseña' }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Actualizar contraseña del usuario en Supabase Auth
    const { error: authErrorUpdate } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...user.user_metadata,
        must_change_password: false,
      },
    });

    if (authErrorUpdate) throw authErrorUpdate;

    // 2. Marcar en profiles que ya cambió su contraseña
    const { error: pError } = await admin
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id);

    if (pError) throw pError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error changing password:', err);
    return NextResponse.json(
      { error: err.message || 'Error al cambiar la contraseña' },
      { status: 500 }
    );
  }
}
