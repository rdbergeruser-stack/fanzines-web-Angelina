'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Fanzine, UserAccess, Author } from '@/types/database';
import {
  BookOpen,
  CreditCard,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Copy,
  Eye,
  User,
  Instagram,
} from 'lucide-react';

export default function HomePage() {
  const supabase = createClient();
  const [fanzines, setFanzines] = useState<Fanzine[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [userAccess, setUserAccess] = useState<Record<string, 'pending' | 'approved'>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal para avisar pago
  const [selectedFanzine, setSelectedFanzine] = useState<Fanzine | null>(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modal y filtro de Ficha de Autor
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null);

  const paymentInfo = process.env.NEXT_PUBLIC_PAYMENT_INFO || 'Alias: angelina.fanzines | CBU: 0000003100010000000000';

  const categories = [
    'Todos',
    ...(Array.from(new Set(fanzines.map((f) => f.category?.trim()).filter(Boolean))) as string[]),
  ];

  const filteredFanzines = fanzines.filter((f) => {
    const matchesCat =
      selectedCategory === 'Todos' ||
      f.category?.trim().toLowerCase() === selectedCategory.toLowerCase();
    const matchesAuthor =
      !filterAuthor || (f.author?.trim() || 'Angelina').toLowerCase() === filterAuthor.toLowerCase();
    return matchesCat && matchesAuthor;
  });

  const openAuthorModal = (authorName: string) => {
    const clean = authorName.trim();
    const found = authors.find((a) => a.name.toLowerCase() === clean.toLowerCase()) || {
      id: clean,
      name: clean,
      bio: 'Creador/a participante de la plataforma de Angelina Fanzines.',
      instagram: null,
      avatar_url: null,
      created_at: '',
    };
    setSelectedAuthor(found);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Cargar fanzines activos
        const { data: fanzinesData } = await supabase
          .from('fanzines')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        setFanzines(fanzinesData || []);

        // Cargar fichas de autores
        const { data: authorsData } = await supabase
          .from('authors')
          .select('*');

        setAuthors(authorsData || []);

        // Si el usuario está logueado, cargar sus accesos
        if (user) {
          const { data: accessData } = await supabase
            .from('user_access')
            .select('fanzine_id, status')
            .eq('user_id', user.id);

          const accessMap: Record<string, 'pending' | 'approved'> = {};
          accessData?.forEach((acc: any) => {
            accessMap[acc.fanzine_id] = acc.status;
          });
          setUserAccess(accessMap);
        }
      } catch (err) {
        console.error('Error cargando catálogo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const handleNotifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFanzine) return;
    setNotifying(true);

    try {
      const res = await fetch('/api/notify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanzineId: selectedFanzine.id,
          referenceCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotifySuccess(true);
      setUserAccess((prev) => ({
        ...prev,
        [selectedFanzine.id]: 'pending',
      }));

      setTimeout(() => {
        setNotifySuccess(false);
        setSelectedFanzine(null);
        setReferenceCode('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Error notificando pago');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fanzines & Publicaciones Digitales</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Historias y arte en formato <span className="text-brand-600">Digital</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed">
          Explora los fanzines, apoya el trabajo independiente y léelos online directamente en pantalla desde cualquier dispositivo.
        </p>
      </div>

      {/* Catálogo de Fanzines */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Catálogo Disponible</h2>
          <p className="text-sm text-stone-500">Selecciona el fanzine que quieras sumar a tu biblioteca</p>
        </div>
      </div>

      {/* Filtros de Categorías dinámicas */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Banner de filtro por Autor activo */}
      {filterAuthor && (
        <div className="mb-8 flex items-center justify-between p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>Mostrando obras de: <strong>{filterAuthor}</strong></span>
          </div>
          <button
            onClick={() => setFilterAuthor(null)}
            className="font-semibold text-brand-700 hover:text-brand-900 hover:underline text-xs"
          >
            Quitar filtro (Ver todos)
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-stone-200 animate-pulse space-y-4">
              <div className="aspect-[3/4] bg-stone-100 rounded-2xl" />
              <div className="h-5 bg-stone-100 rounded w-3/4" />
              <div className="h-4 bg-stone-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredFanzines.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-800">
            {selectedCategory === 'Todos'
              ? 'No hay fanzines cargados aún'
              : `No hay fanzines en la categoría "${selectedCategory}"`}
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            {selectedCategory === 'Todos'
              ? 'Muy pronto Angelina estará subiendo nuevas publicaciones.'
              : 'Selecciona otra categoría o explora todas las publicaciones.'}
          </p>
          {selectedCategory !== 'Todos' && (
            <button
              onClick={() => setSelectedCategory('Todos')}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Ver todos los fanzines
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFanzines.map((fanzine) => {
            const status = userAccess[fanzine.id];
            const isApproved = status === 'approved';
            const isPending = status === 'pending';

            return (
              <div
                key={fanzine.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all flex flex-col group"
              >
                {/* Portada */}
                <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                  {fanzine.cover_url ? (
                    <img
                      src={fanzine.cover_url}
                      alt={fanzine.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-6 text-center">
                      <BookOpen className="w-12 h-12 mb-2 stroke-1" />
                      <span className="text-xs font-medium">Sin imagen de portada</span>
                    </div>
                  )}

                  {/* Badge de Precio */}
                  <div className="absolute top-3 right-3 bg-stone-900/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    ${fanzine.price}
                  </div>

                  {/* Badge de estado si está logueado */}
                  {isApproved && (
                    <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Habilitado</span>
                    </div>
                  )}

                  {isPending && (
                    <div className="absolute bottom-3 left-3 bg-amber-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Verificando pago</span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {fanzine.category && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-[11px] font-semibold mb-2">
                        {fanzine.category}
                      </span>
                    )}

                    <h3 className="font-bold text-lg text-stone-900 leading-snug">{fanzine.title}</h3>

                    {(fanzine.author || fanzine.pages_count || fanzine.edition_number) && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 mt-1 mb-2">
                        {fanzine.author && (
                          <button
                            type="button"
                            onClick={() => openAuthorModal(fanzine.author || 'Angelina')}
                            className="font-medium text-stone-700 hover:text-brand-600 hover:underline transition-colors cursor-pointer text-left inline-flex items-center gap-1 group/author"
                            title={`Ver ficha y obras de ${fanzine.author}`}
                          >
                            <span>Por {fanzine.author}</span>
                            <User className="w-3 h-3 text-stone-400 group-hover/author:text-brand-500 transition-colors" />
                          </button>
                        )}
                        {fanzine.pages_count && (
                          <span>· {fanzine.pages_count} págs.</span>
                        )}
                        {fanzine.edition_number && (
                          <span>· {fanzine.edition_number}</span>
                        )}
                      </div>
                    )}

                    {fanzine.description && (
                      <p className="mt-2 text-stone-600 text-sm line-clamp-3 leading-relaxed">
                        {fanzine.description}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    {isApproved ? (
                      <Link
                        href={`/leer/${fanzine.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/15 transition-all text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Leer Online</span>
                      </Link>
                    ) : isPending ? (
                      <div className="text-center py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                        Tu pago está pendiente de aprobación por Angelina
                      </div>
                    ) : user ? (
                      <button
                        onClick={() => {
                          setSelectedFanzine(fanzine);
                          setReferenceCode('');
                          setNotifySuccess(false);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 transition-all text-sm"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Ya transferí / Notificar</span>
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all text-sm"
                      >
                        <span>Inicia sesión para comprar</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Notificar Pago */}
      {selectedFanzine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 relative">
            <h3 className="text-xl font-bold text-stone-900">
              Notificar compra de <span className="text-brand-600">{selectedFanzine.title}</span>
            </h3>

            <p className="text-xs text-stone-500 mt-1">
              Transfiere el monto correspondiente y luego confirma aquí abajo para que Angelina te lo habilite.
            </p>

            <div className="my-5 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
              <p className="font-semibold text-stone-700">Monto: ${selectedFanzine.price}</p>
              <p className="text-stone-600 font-mono text-[11px] break-all">{paymentInfo}</p>
            </div>

            {notifySuccess ? (
              <div className="py-6 text-center text-emerald-700 space-y-2">
                <CheckCircle className="w-10 h-10 mx-auto text-emerald-600" />
                <p className="font-semibold">¡Aviso enviado con éxito!</p>
                <p className="text-xs text-stone-500">
                  Angelina revisará el pago y te habilitará el fanzine a la brevedad.
                </p>
              </div>
            ) : (
              <form onSubmit={handleNotifyPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Número de comprobante o referencia (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Op 12345678 o nombre de titular"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFanzine(null)}
                    className="w-1/2 py-2.5 px-4 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={notifying}
                    className="w-1/2 py-2.5 px-4 rounded-xl text-white bg-brand-600 hover:bg-brand-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {notifying ? 'Enviando...' : 'Confirmar aviso'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Ficha de Autor / Autora */}
      {selectedAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
                  {selectedAuthor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-semibold mb-1">
                    <User className="w-3 h-3 text-brand-600" />
                    <span>Ficha de Autor / Autora</span>
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-xl leading-tight">
                    {selectedAuthor.name}
                  </h3>
                  {selectedAuthor.instagram && (
                    <a
                      href={`https://instagram.com/${selectedAuthor.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 font-semibold mt-0.5 transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>{selectedAuthor.instagram.startsWith('@') ? selectedAuthor.instagram : `@${selectedAuthor.instagram}`}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Biografía */}
            <div className="mb-6 bg-stone-50 border border-stone-200/80 p-4 rounded-2xl text-xs text-stone-700 leading-relaxed">
              <p className="font-bold text-stone-900 mb-1">Presentación / Bio:</p>
              <p className="whitespace-pre-line text-stone-600">
                {selectedAuthor.bio || 'Creador/a participante de la plataforma independiente de Angelina Fanzines.'}
              </p>
            </div>

            {/* Obras publicadas de este autor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-stone-900 text-sm">
                  Obras de {selectedAuthor.name} ({fanzines.filter(f => (f.author || 'Angelina').toLowerCase() === selectedAuthor.name.toLowerCase()).length})
                </h4>
                <button
                  onClick={() => {
                    setFilterAuthor(selectedAuthor.name);
                    setSelectedAuthor(null);
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold underline"
                >
                  Filtrar catálogo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {fanzines
                  .filter(f => (f.author || 'Angelina').toLowerCase() === selectedAuthor.name.toLowerCase())
                  .map(f => (
                    <div key={f.id} className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center gap-3 shadow-sm hover:border-brand-300 transition-colors">
                      <div className="w-12 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                        {f.cover_url ? (
                          <img src={f.cover_url} alt={f.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-stone-900 truncate leading-snug">{f.title}</p>
                        <p className="text-[11px] font-extrabold text-brand-600 mt-0.5">${f.price}</p>
                        {f.category && (
                          <span className="inline-block text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded mt-1 truncate max-w-full">
                            {f.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setFilterAuthor(selectedAuthor.name);
                  setSelectedAuthor(null);
                }}
                className="py-2.5 px-4 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors border border-brand-200/80"
              >
                Ver sólo sus obras
              </button>
              <button
                type="button"
                onClick={() => setSelectedAuthor(null)}
                className="py-2.5 px-5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
