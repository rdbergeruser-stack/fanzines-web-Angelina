import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Obtener autores públicos
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authors, error } = await supabase
      .from('authors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ authors: authors || [] });
  } catch (err: any) {
    console.error('Error fetching authors:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Guardar o actualizar datos de autor (solo admin)
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
    const { name, bio, instagram, avatar_url } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del autor es obligatorio' }, { status: 400 });
    }

    const trimmedName = name.trim();

    const { data, error } = await admin
      .from('authors')
      .upsert(
        {
          name: trimmedName,
          bio: bio?.trim() || null,
          instagram: instagram?.trim() || null,
          avatar_url: avatar_url?.trim() || null,
        },
        { onConflict: 'name' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, author: data });
  } catch (err: any) {
    console.error('Error upserting author:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
