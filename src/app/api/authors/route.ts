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

// Guardar o actualizar datos de autor (solo admin / Angelina)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createAdminClient();
    const isAngelina = user.email?.toLowerCase().includes('angelina');
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!isAngelina && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado: solo administradores' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let bio: string | null = null;
    let instagram: string | null = null;
    let avatar_url: string | null = null;
    let oldName: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = (formData.get('name') as string) || '';
      bio = (formData.get('bio') as string) || null;
      instagram = (formData.get('instagram') as string) || null;
      avatar_url = (formData.get('avatar_url') as string) || null;
      oldName = (formData.get('oldName') as string) || null;
      const avatarFile = formData.get('avatar') as File | null;

      // Si subió un archivo de imagen para el avatar
      if (avatarFile && avatarFile.size > 0) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
        const fileName = `authors/avatar_${Date.now()}_${cleanName}.${ext}`;
        const bytes = await avatarFile.arrayBuffer();

        const { error: uploadErr } = await admin.storage
          .from('fanzines-covers')
          .upload(fileName, bytes, {
            contentType: avatarFile.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadErr) {
          const { data: pubData } = admin.storage
            .from('fanzines-covers')
            .getPublicUrl(fileName);
          avatar_url = pubData.publicUrl;
        } else {
          console.error('Error subiendo avatar de autor:', uploadErr);
        }
      }
    } else {
      const body = await request.json();
      name = body.name || '';
      bio = body.bio || null;
      instagram = body.instagram || null;
      avatar_url = body.avatar_url || null;
      oldName = body.oldName || null;
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del autor es obligatorio' }, { status: 400 });
    }

    const trimmedName = name.trim();
    let cleanInstagram = instagram ? instagram.trim().replace(/^@+/, '') : null;
    if (cleanInstagram && cleanInstagram.includes('instagram.com/')) {
      const parts = cleanInstagram.split('instagram.com/');
      cleanInstagram = parts[parts.length - 1].replace(/\/$/, '').replace(/^@+/, '');
    }

    // Si se renombró el autor y existía bajo oldName
    if (oldName && oldName.trim() && oldName.trim().toLowerCase() !== trimmedName.toLowerCase()) {
      // 1. Actualizar autor en la tabla authors si existía
      await admin
        .from('authors')
        .delete()
        .eq('name', oldName.trim());

      // 2. Actualizar las obras asociadas en fanzines
      await admin
        .from('fanzines')
        .update({ author: trimmedName })
        .ilike('author', oldName.trim());
    }

    const { data, error } = await admin
      .from('authors')
      .upsert(
        {
          name: trimmedName,
          bio: bio ? bio.trim() : null,
          instagram: cleanInstagram,
          avatar_url: avatar_url ? avatar_url.trim() : null,
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

// Eliminar un autor
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createAdminClient();
    const isAngelina = user.email?.toLowerCase().includes('angelina');
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!isAngelina && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado: solo administradores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const authorName = searchParams.get('name');
    const authorId = searchParams.get('id');

    if (!authorName && !authorId) {
      return NextResponse.json({ error: 'Se requiere id o nombre del autor a eliminar' }, { status: 400 });
    }

    let query = admin.from('authors').delete();
    if (authorId) {
      query = query.eq('id', authorId);
    } else if (authorName) {
      query = query.eq('name', authorName.trim());
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting author:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
