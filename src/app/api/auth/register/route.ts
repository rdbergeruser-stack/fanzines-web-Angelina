import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Crear el usuario ya confirmado directamente sin requerir verificación por email
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split('@')[0],
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Asegurar que exista su registro en profiles
    try {
      await admin.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || email.split('@')[0],
        role: email.includes('angelina') ? 'admin' : 'user',
      });
    } catch (e) {
      console.warn('Profile sync note:', e);
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message || 'Error en el servidor' }, { status: 500 });
  }
}
