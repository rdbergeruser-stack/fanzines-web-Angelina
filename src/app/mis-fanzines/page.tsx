'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Fanzine } from '@/types/database';
import { BookOpen, Clock, ArrowLeft, Sparkles, CheckCircle2, Eye } from 'lucide-react';

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
            Tu biblioteca digital. Lee tus publicaciones adquiridas directamente en pantalla desde cualquier celular o computadora.
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
            Pasa por nuestro catálogo para ver las publicaciones disponibles o comunícate con Angelina para que te habilite tu ejemplar.
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
                <span>Mis Lecturas Disponibles ({approved.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {approved.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    <Link href={`/leer/${item.fanzine.id}`} className="relative aspect-[3/4] bg-stone-100 overflow-hidden block">
                      {item.fanzine.cover_url ? (
                        <img
                          src={item.fanzine.cover_url}
                          alt={item.fanzine.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-6">
                          <BookOpen className="w-12 h-12 mb-2 stroke-1" />
                          <span className="text-xs">Sin portada</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-stone-900 font-semibold text-xs px-3 py-1.5 rounded-full shadow-lg transition-opacity flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-brand-600" />
                          <span>Abrir lector</span>
                        </span>
                      </div>
                    </Link>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {item.fanzine.category && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-[10px] font-semibold mb-2">
                            {item.fanzine.category}
                          </span>
                        )}
                        <Link href={`/leer/${item.fanzine.id}`}>
                          <h3 className="font-bold text-stone-900 leading-snug hover:text-brand-600 transition-colors">
                            {item.fanzine.title}
                          </h3>
                        </Link>
                        {(item.fanzine.author || item.fanzine.pages_count || item.fanzine.edition_number) && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 mt-1 mb-1.5">
                            {item.fanzine.author && (
                              <span className="font-medium text-stone-700">Por {item.fanzine.author}</span>
                            )}
                            {item.fanzine.pages_count && (
                              <span>· {item.fanzine.pages_count} págs.</span>
                            )}
                            {item.fanzine.edition_number && (
                              <span>· {item.fanzine.edition_number}</span>
                            )}
                          </div>
                        )}
                        {item.fanzine.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {item.fanzine.description}
                          </p>
                        )}
                      </div>

                      {/* Botón único: Leer online */}
                      <div className="mt-5 pt-4 border-t border-stone-100">
                        <Link
                          href={`/leer/${item.fanzine.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/15 transition-all text-xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Abrir Lector Online</span>
                        </Link>
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
                      {item.fanzine.category && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold mb-1">
                          {item.fanzine.category}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-stone-900 truncate">{item.fanzine.title}</h4>
                      {item.fanzine.author && (
                        <p className="text-xs text-stone-500 truncate">Por {item.fanzine.author}</p>
                      )}
                      <p className="text-xs text-amber-700 font-medium mt-1">
                        Acceso en preparación por Angelina
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Apenas lo habilite podrás leerlo directamente aquí.
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
