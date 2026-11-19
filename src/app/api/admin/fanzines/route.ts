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

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const priceStr = (formData.get('price') as string) || '0';
    const price = parseFloat(priceStr) || 0;
    const coverFile = formData.get('cover') as File | null;
    const pdfFile = formData.get('pdf') as File | null;

    if (!title || !pdfFile) {
      return NextResponse.json(
        { error: 'El título y el archivo PDF son obligatorios' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);

    // 1. Subir PDF al bucket privado
    const pdfFileName = `${timestamp}_${cleanTitle}.pdf`;
    const pdfBytes = await pdfFile.arrayBuffer();
    const { error: pdfUploadError } = await admin.storage
      .from('fanzines-private')
      .upload(pdfFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (pdfUploadError) {
      console.error('Error uploading PDF:', pdfUploadError);
      return NextResponse.json({ error: 'Error al subir el archivo PDF: ' + pdfUploadError.message }, { status: 500 });
    }

    // 2. Subir Portada (si viene) al bucket público
    let coverUrl: string | null = null;
    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split('.').pop() || 'jpg';
      const coverFileName = `${timestamp}_${cleanTitle}.${ext}`;
      const coverBytes = await coverFile.arrayBuffer();

      const { error: coverUploadError } = await admin.storage
        .from('fanzines-covers')
        .upload(coverFileName, coverBytes, {
          contentType: coverFile.type,
          upsert: false,
        });

      if (!coverUploadError) {
        const { data: publicUrlData } = admin.storage
          .from('fanzines-covers')
          .getPublicUrl(coverFileName);
        coverUrl = publicUrlData.publicUrl;
      }
    }

    // 3. Insertar registro en la tabla fanzines
    const { data: fanzine, error: dbError } = await admin
      .from('fanzines')
      .insert({
        title,
        description,
        price,
        cover_url: coverUrl,
        pdf_path: pdfFileName,
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error inserting fanzine row:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, fanzine });
  } catch (err: any) {
    console.error('Error creating fanzine:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}

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
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    // Obtener info del fanzine para borrar archivos
    const { data: fanzine } = await admin
      .from('fanzines')
      .select('pdf_path, cover_url')
      .eq('id', id)
      .single();

    if (fanzine) {
      if (fanzine.pdf_path) {
        await admin.storage.from('fanzines-private').remove([fanzine.pdf_path]);
      }
      if (fanzine.cover_url) {
        const parts = fanzine.cover_url.split('/');
        const coverName = parts[parts.length - 1];
        if (coverName) {
          await admin.storage.from('fanzines-covers').remove([coverName]);
        }
      }
    }

    const { error } = await admin.from('fanzines').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { id, is_active, title, description, price } = body;
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const updates: any = {};
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;

    const { error } = await admin.from('fanzines').update(updates).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
