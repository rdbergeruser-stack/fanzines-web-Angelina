'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Fanzine } from '@/types/database';
import { Download, BookOpen, Clock, AlertCircle, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface AccessItem {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  granted_at: string;
  fanzine: Fanzine;
}

export default function MisFanzinesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<AccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyFanzines() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('user_access')
          .select('id, status, granted_at, fanzine:fanzines(*)')
          .eq('user_id', user.id);

        if (error) throw error;
        setItems((data as any) || []);
      } catch (e) {
        console.error('Error fetching fanzines:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchMyFanzines();
  }, [supabase, router]);

  const handleDownload = async (fanzineId: string) => {
    setDownloadingId(fanzineId);
    try {
      const res = await fetch(`/api/download/${fanzineId}`);
      const data = await res.json();
      if (data.downloadUrl) {
        // Abrir o forzar descarga
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.error || 'No se pudo descargar el fanzine');
      }
    } catch (e) {
      alert('Error en la descarga');
    } finally {
      setDownloadingId(null);
    }
  };

  const approved = items.filter((i) => i.status === 'approved' && i.fanzine);
  const pending = items.filter((i) => i.status === 'pending' && i.fanzine);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Catálogo</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Mis Fanzines</h1>
          <p className="text-sm text-stone-600 mt-1">
            Tu biblioteca digital. Puedes descargar tus fanzines en PDF cuantas veces quieras.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-stone-200 animate-pulse space-y-4">
              <div className="aspect-[3/4] bg-stone-100 rounded-2xl" />
              <div className="h-5 bg-stone-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : approved.length === 0 && pending.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-800">Aún no tienes fanzines habilitados</h3>
          <p className="text-sm text-stone-500 mt-2 mb-6">
            Pasa por nuestro catálogo para ver las publicaciones disponibles y solicita la tuya.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explorar Catálogo</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Fanzines Habilitados */}
          {approved.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Listos para Descargar ({approved.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {approved.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative aspect-[3/4] bg-stone-100">
                      {item.fanzine.cover_url ? (
                        <img
                          src={item.fanzine.cover_url}
                          alt={item.fanzine.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-6">
                          <BookOpen className="w-12 h-12 mb-2 stroke-1" />
                          <span className="text-xs">Sin portada</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-stone-900 leading-snug">{item.fanzine.title}</h3>
                        {item.fanzine.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {item.fanzine.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-stone-100">
                        <button
                          onClick={() => handleDownload(item.fanzine.id)}
                          disabled={downloadingId === item.fanzine.id}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all text-sm disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          <span>
                            {downloadingId === item.fanzine.id ? 'Generando descarga...' : 'Descargar PDF'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fanzines Pendientes de Aprobación */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Pendientes de Aprobación ({pending.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-amber-200/80 p-5 flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-16 h-20 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.fanzine.cover_url ? (
                        <img
                          src={item.fanzine.cover_url}
                          alt={item.fanzine.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-stone-900 truncate">{item.fanzine.title}</h4>
                      <p className="text-xs text-amber-700 font-medium mt-1">
                        Pago en revisión por la administradora
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Te llegará el acceso apenas se verifique la transferencia.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
