'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Fanzine, Profile, UserAccess, PaymentNotification } from '@/types/database';
import {
  Shield,
  Upload,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Search,
  DollarSign,
  FileText,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'fanzines' | 'requests' | 'users'>('fanzines');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Datos
  const [fanzines, setFanzines] = useState<Fanzine[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accesses, setAccesses] = useState<UserAccess[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Formulario nuevo fanzine
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [newCover, setNewCover] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Búsqueda de usuarios
  const [searchUser, setSearchUser] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Verificar rol admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Cargar fanzines
      const { data: fList } = await supabase
        .from('fanzines')
        .select('*')
        .order('created_at', { ascending: false });
      setFanzines(fList || []);

      // Cargar usuarios y accesos via API admin
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const uData = await res.json();
        setProfiles(uData.profiles || []);
        setAccesses(uData.accesses || []);
        setNotifications(uData.notifications || []);
      }
    } catch (e) {
      console.error('Error loading admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [supabase, router]);

  // Subir nuevo fanzine
  const handleUploadFanzine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdf || !newTitle) {
      setUploadMsg({ type: 'err', text: 'El título y el PDF son obligatorios' });
      return;
    }

    setUploading(true);
    setUploadMsg(null);

    try {
      const fd = new FormData();
      fd.append('title', newTitle);
      fd.append('description', newDesc);
      fd.append('price', newPrice || '0');
      fd.append('pdf', newPdf);
      if (newCover) fd.append('cover', newCover);

      const res = await fetch('/api/admin/fanzines', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el fanzine');

      setUploadMsg({ type: 'ok', text: '¡Fanzine subido con éxito!' });
      setNewTitle('');
      setNewDesc('');
      setNewPrice('');
      setNewPdf(null);
      setNewCover(null);

      // Recargar fanzines
      const { data: fList } = await supabase
        .from('fanzines')
        .select('*')
        .order('created_at', { ascending: false });
      setFanzines(fList || []);
    } catch (err: any) {
      setUploadMsg({ type: 'err', text: err.message || 'Error en la carga' });
    } finally {
      setUploading(false);
    }
  };

  // Toggle activo
  const handleToggleActive = async (fanzine: Fanzine) => {
    try {
      await fetch('/api/admin/fanzines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fanzine.id, is_active: !fanzine.is_active }),
      });
      setFanzines((prev) =>
        prev.map((f) => (f.id === fanzine.id ? { ...f, is_active: !f.is_active } : f))
      );
    } catch (e) {
      alert('Error al actualizar estado');
    }
  };

  // Eliminar fanzine
  const handleDeleteFanzine = async (id: string) => {
    if (!confirm('¿Estás segura de eliminar este fanzine? Se borrará el PDF y la portada.')) return;
    try {
      const res = await fetch(`/api/admin/fanzines?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFanzines((prev) => prev.filter((f) => f.id !== id));
      } else {
        alert('Error al eliminar');
      }
    } catch (e) {
      alert('Error');
    }
  };

  // Habilitar acceso a un usuario
  const handleGrantAccess = async (userId: string, fanzineId: string) => {
    setActionLoading(`${userId}_${fanzineId}`);
    try {
      const res = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fanzineId, status: 'approved' }),
      });
      if (res.ok) {
        await loadAdminData();
      } else {
        alert('Error al otorgar acceso');
      }
    } catch (e) {
      alert('Error');
    } finally {
      setActionLoading(null);
    }
  };

  // Revocar acceso a un usuario
  const handleRevokeAccess = async (userId: string, fanzineId: string) => {
    setActionLoading(`${userId}_${fanzineId}`);
    try {
      const res = await fetch('/api/admin/revoke-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fanzineId }),
      });
      if (res.ok) {
        await loadAdminData();
      } else {
        alert('Error al revocar acceso');
      }
    } catch (e) {
      alert('Error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-stone-500 text-sm">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Acceso Restringido</h2>
        <p className="text-sm text-stone-600 mt-2">
          Esta sección es exclusiva para la administradora. Tu cuenta no cuenta con permisos de administrador en Supabase.
        </p>
      </div>
    );
  }

  const pendingRequests = notifications.filter((n) => n.status === 'pending');

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      (p.full_name && p.full_name.toLowerCase().includes(searchUser.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Panel de Administración</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900">Gestión de Fanzines y Usuarios</h1>
          <p className="text-sm text-stone-600 mt-1">
            Sube nuevos fanzines en PDF y habilita las descargas a los compradores que te hayan transferido.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('fanzines')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'fanzines'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Fanzines ({fanzines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative ${
              activeTab === 'requests'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Avisos de Pago</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios ({profiles.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FANZINES */}
      {activeTab === 'fanzines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de carga */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-brand-600" />
                <span>Subir Nuevo Fanzine</span>
              </h2>

              {uploadMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                    uploadMsg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {uploadMsg.type === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span>{uploadMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUploadFanzine} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Título del Fanzine *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Fanzine N° 1 - Recuerdos"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Descripción / Sinopsis
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Breve reseña o texto de presentación..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Archivo PDF (Privado) *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,application/pdf"
                    onChange={(e) => setNewPdf(e.target.files?.[0] || null)}
                    className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Foto de Portada (Pública, opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewCover(e.target.files?.[0] || null)}
                    className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm text-sm disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Subiendo archivos...' : 'Guardar y Publicar'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Listado de fanzines existentes */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Fanzines Publicados</h2>
            {fanzines.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 text-stone-500 text-sm">
                No hay fanzines cargados todavía. Usa el formulario de la izquierda para subir el primero.
              </div>
            ) : (
              fanzines.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200">
                      {f.cover_url ? (
                        <img src={f.cover_url} alt={f.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900">{f.title}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          ${f.price}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-1 max-w-md">
                        {f.description || 'Sin descripción'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            f.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {f.is_active ? 'Visible en catálogo' : 'Oculto'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          PDF: {f.pdf_path}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleActive(f)}
                      title={f.is_active ? 'Ocultar del catálogo' : 'Hacer visible'}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                    >
                      {f.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteFanzine(f.id)}
                      title="Eliminar fanzine"
                      className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 hover:border-red-200 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AVISOS DE PAGO PENDIENTES */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Avisos de Transferencias de Clientes</h2>
          <p className="text-xs text-stone-500">
            Aquí aparecen las personas que transfirieron y avisaron desde la web. Al hacer clic en "Habilitar", se les desbloquea automáticamente la descarga.
          </p>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 text-stone-500 text-sm">
              No hay avisos de pago registrados hasta el momento.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
              {notifications.map((notif) => {
                const isPending = notif.status === 'pending';
                const isApproved = notif.status === 'approved';

                return (
                  <div
                    key={notif.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">
                          {notif.profile?.email || 'Usuario'}
                        </span>
                        {notif.profile?.full_name && (
                          <span className="text-xs text-stone-500">({notif.profile.full_name})</span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {notif.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-stone-600">
                        Fanzine solicitado:{' '}
                        <span className="font-semibold text-brand-700">
                          {notif.fanzine?.title || 'Fanzine'}
                        </span>
                        {' '}- Monto: ${notif.fanzine?.price}
                      </div>

                      <div className="mt-1 text-xs text-stone-500 flex items-center gap-2">
                        <span>Ref / Comprobante:</span>
                        <code className="bg-stone-100 px-2 py-0.5 rounded text-stone-800 font-mono text-[11px]">
                          {notif.reference_code || 'Sin referencia'}
                        </code>
                        <span className="text-[10px] text-stone-400">
                          • {new Date(notif.created_at).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleGrantAccess(notif.user_id, notif.fanzine_id)}
                            disabled={actionLoading === `${notif.user_id}_${notif.fanzine_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar y Habilitar</span>
                          </button>
                          <button
                            onClick={() => handleRevokeAccess(notif.user_id, notif.fanzine_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5 text-stone-400" />
                            <span>Descartar</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Acceso ya otorgado</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USUARIOS Y HABILITACIÓN MANUAL */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Usuarios Registrados</h2>
              <p className="text-xs text-stone-500">
                Puedes habilitar o quitar el acceso a cualquier fanzine para cualquier usuario registrado.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
            {filteredProfiles.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-500">
                No se encontraron usuarios.
              </div>
            ) : (
              filteredProfiles.map((p) => {
                // Accesos de este usuario
                const userAccessList = accesses.filter((a) => a.user_id === p.id && a.status === 'approved');

                return (
                  <div key={p.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{p.email}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              p.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        {p.full_name && (
                          <p className="text-xs text-stone-500">{p.full_name}</p>
                        )}
                      </div>

                      <div className="text-xs text-stone-500">
                        Fanzines habilitados:{' '}
                        <span className="font-semibold text-stone-800">
                          {userAccessList.length}
                        </span>
                      </div>
                    </div>

                    {/* Fanzines checkboxes / botones */}
                    <div className="pt-2 border-t border-stone-100">
                      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                        Habilitar / Deshabilitar Fanzines:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fanzines.map((f) => {
                          const hasAccess = userAccessList.some((a) => a.fanzine_id === f.id);
                          const loadingKey = `${p.id}_${f.id}`;
                          const isAction = actionLoading === loadingKey;

                          return (
                            <button
                              key={f.id}
                              onClick={() => {
                                if (hasAccess) {
                                  handleRevokeAccess(p.id, f.id);
                                } else {
                                  handleGrantAccess(p.id, f.id);
                                }
                              }}
                              disabled={isAction}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                hasAccess
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {isAction ? (
                                <span className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                              ) : hasAccess ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-stone-400" />
                              )}
                              <span>{f.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
