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

// Crear nuevo usuario exclusivamente por la administradora
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

    const body = await request.json();
    const { email, password = '123456', fullName, mustChangePassword = true, role = 'user' } = body;

    if (!email) {
      return NextResponse.json({ error: 'El correo o nombre de usuario es obligatorio' }, { status: 400 });
    }

    let emailToUse = email.trim().toLowerCase();
    if (!emailToUse.includes('@')) {
      emailToUse = `${emailToUse}@fanzines.com`;
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Crear en Supabase Auth con confirmación automática
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: emailToUse,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        must_change_password: mustChangePassword,
      },
    });

    if (createError) throw createError;

    // Crear registro en profiles con el flag must_change_password
    const { error: pError } = await admin.from('profiles').upsert({
      id: createdUser.user.id,
      email: emailToUse,
      full_name: fullName || email.split('@')[0],
      role: role,
      must_change_password: mustChangePassword,
    });

    if (pError) throw pError;

    return NextResponse.json({ success: true, user: createdUser.user });
  } catch (err: any) {
    console.error('Error creating user by admin:', err);
    return NextResponse.json({ error: err.message || 'Error al crear usuario' }, { status: 500 });
  }
}

// Modificar usuario: contraseña, email, nombre, rol y flag de cambio de clave
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { userId, newPassword, newEmail, fullName, role, mustChangePassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const authUpdates: any = {};
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }
      authUpdates.password = newPassword;
    }

    if (newEmail) {
      authUpdates.email = newEmail;
      authUpdates.email_confirm = true;
    }

    if (fullName !== undefined || mustChangePassword !== undefined) {
      authUpdates.user_metadata = {
        ...(fullName !== undefined ? { full_name: fullName } : {}),
        ...(mustChangePassword !== undefined ? { must_change_password: mustChangePassword } : {}),
      };
    }

    // 1. Actualizar en Supabase Auth si hubo cambios
    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, authUpdates);
      if (authUpdateError) throw authUpdateError;
    }

    // 2. Actualizar en tabla profiles
    const profileUpdates: any = {};
    if (fullName !== undefined) profileUpdates.full_name = fullName;
    if (newEmail) profileUpdates.email = newEmail;
    if (role && (role === 'admin' || role === 'user')) profileUpdates.role = role;
    if (mustChangePassword !== undefined) profileUpdates.must_change_password = mustChangePassword;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: pError } = await admin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);
      if (pError) throw pError;
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado con éxito' });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ error: err.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}

// Eliminar usuario
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
