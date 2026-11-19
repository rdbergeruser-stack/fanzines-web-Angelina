import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fanzineId } = await params;
    if (!fanzineId) {
      return NextResponse.json({ error: 'ID de fanzine no proporcionado' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para descargar' }, { status: 401 });
    }

    // Verificar si el usuario es Admin o si tiene el fanzine habilitado
    const adminClient = createAdminClient();

    // 1. Verificar si es admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // 2. Si no es admin, verificar si tiene acceso aprobado
    if (!isAdmin) {
      const { data: access, error: accessError } = await adminClient
        .from('user_access')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('fanzine_id', fanzineId)
        .eq('status', 'approved')
        .single();

      if (accessError || !access) {
        return NextResponse.json(
          { error: 'No tienes acceso habilitado para este fanzine.' },
          { status: 403 }
        );
      }
    }

    // 3. Obtener la ruta del archivo del fanzine
    const { data: fanzine, error: fanzineError } = await adminClient
      .from('fanzines')
      .select('title, pdf_path')
      .eq('id', fanzineId)
      .single();

    if (fanzineError || !fanzine || !fanzine.pdf_path) {
      return NextResponse.json({ error: 'Fanzine o archivo no encontrado' }, { status: 404 });
    }

    // 4. Generar URL firmada de 60 segundos
    const fileName = `${fanzine.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const { data: signedData, error: signError } = await adminClient.storage
      .from('fanzines-private')
      .createSignedUrl(fanzine.pdf_path, 60, {
        download: fileName,
      });

    if (signError || !signedData?.signedUrl) {
      console.error('Error generando URL firmada:', signError);
      return NextResponse.json(
        { error: 'No se pudo generar el enlace de descarga seguro.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ downloadUrl: signedData.signedUrl });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
