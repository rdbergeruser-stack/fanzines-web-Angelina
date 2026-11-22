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
  RefreshCw,
  Key,
  Lock,
  Mail,
  User,
  UserPlus,
  Share2,
  Copy,
  MessageCircle,
  ExternalLink,
  Phone,
  Send,
  Pencil,
  Tag,
  Layers,
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  Award,
  Wallet,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'fanzines' | 'users' | 'requests' | 'sales'>('fanzines');
  const [salesPeriod, setSalesPeriod] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [salesSubTab, setSalesSubTab] = useState<'authors' | 'fanzines' | 'movements'>('authors');
  const [copiedAuthor, setCopiedAuthor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Datos
  const [fanzines, setFanzines] = useState<Fanzine[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accesses, setAccesses] = useState<UserAccess[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Formulario nuevo fanzine
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newAuthor, setNewAuthor] = useState('Angelina');
  const [newCategory, setNewCategory] = useState('');
  const [newPagesCount, setNewPagesCount] = useState('');
  const [newEditionNumber, setNewEditionNumber] = useState('');
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [newCover, setNewCover] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Modal para EDITAR fanzine
  const [editingFanzine, setEditingFanzine] = useState<Fanzine | null>(null);
  const [editFTitle, setEditFTitle] = useState('');
  const [editFDesc, setEditFDesc] = useState('');
  const [editFPrice, setEditFPrice] = useState('');
  const [editFAuthor, setEditFAuthor] = useState('Angelina');
  const [editFCategory, setEditFCategory] = useState('');
  const [editFPagesCount, setEditFPagesCount] = useState('');
  const [editFEditionNumber, setEditFEditionNumber] = useState('');
  const [savingFanzine, setSavingFanzine] = useState(false);
  const [editFMsg, setEditFMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Búsqueda de usuarios
  const [searchUser, setSearchUser] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal para CREAR usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('123456');
  const [createMustChange, setCreateMustChange] = useState(true);
  const [createRole, setCreateRole] = useState<'admin' | 'user'>('user');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Modal para EDITAR usuario / contraseña
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editMustChange, setEditMustChange] = useState(false);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [savingUser, setSavingUser] = useState(false);
  const [userModalMsg, setUserModalMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Modal para COMPARTIR credenciales o avisar fanzine por WhatsApp
  const [shareUser, setShareUser] = useState<Profile | null>(null);
  const [shareTempPass, setShareTempPass] = useState('123456');
  const [sharePhone, setSharePhone] = useState('');
  const [shareMode, setShareMode] = useState<'credentials' | 'fanzine_ready'>('credentials');
  const [shareFanzineTitle, setShareFanzineTitle] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Si el email es angelina, la consideramos admin directamente
      const isAngelina = user.email?.includes('angelina');

      // Verificar rol admin en base de datos
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!isAngelina && profile?.role !== 'admin') {
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
      const uData = await res.json();
      if (res.ok) {
        setProfiles(uData.profiles || []);
        setAccesses(uData.accesses || []);
        setNotifications(uData.notifications || []);
      } else {
        console.error('Error admin users API:', uData.error);
        if (uData.error?.includes('permission denied')) {
          setErrorMessage('Faltan otorgar permisos en la base de datos de Supabase.');
        }
      }
    } catch (e: any) {
      console.error('Error loading admin:', e);
      setErrorMessage(e.message);
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
      fd.append('author', newAuthor || '');
      fd.append('category', newCategory || '');
      fd.append('pagesCount', newPagesCount || '');
      fd.append('editionNumber', newEditionNumber || '');
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
      setNewAuthor('Angelina');
      setNewCategory('');
      setNewPagesCount('');
      setNewEditionNumber('');
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

  // Abrir modal de edición de fanzine
  const openEditFanzine = (f: Fanzine) => {
    setEditingFanzine(f);
    setEditFTitle(f.title || '');
    setEditFDesc(f.description || '');
    setEditFPrice(f.price?.toString() || '0');
    setEditFAuthor(f.author || 'Angelina');
    setEditFCategory(f.category || '');
    setEditFPagesCount(f.pages_count?.toString() || '');
    setEditFEditionNumber(f.edition_number || '');
    setEditFMsg(null);
  };

  // Guardar edición de fanzine
  const handleSaveFanzine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFanzine) return;
    setSavingFanzine(true);
    setEditFMsg(null);

    try {
      const res = await fetch('/api/admin/fanzines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFanzine.id,
          title: editFTitle,
          description: editFDesc,
          price: parseFloat(editFPrice) || 0,
          author: editFAuthor,
          category: editFCategory,
          pages_count: editFPagesCount ? parseInt(editFPagesCount, 10) : null,
          edition_number: editFEditionNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar fanzine');

      setEditFMsg({ type: 'ok', text: '¡Fanzine actualizado correctamente!' });

      setFanzines((prev) =>
        prev.map((f) =>
          f.id === editingFanzine.id
            ? {
                ...f,
                title: editFTitle,
                description: editFDesc,
                price: parseFloat(editFPrice) || 0,
                author: editFAuthor,
                category: editFCategory,
                pages_count: editFPagesCount ? parseInt(editFPagesCount, 10) : null,
                edition_number: editFEditionNumber,
              }
            : f
        )
      );

      setTimeout(() => {
        setEditingFanzine(null);
      }, 1000);
    } catch (err: any) {
      setEditFMsg({ type: 'err', text: err.message || 'Error al guardar' });
    } finally {
      setSavingFanzine(false);
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

  // Formatear teléfono para la API de WhatsApp internacional
  const formatWhatsAppPhone = (raw: string): string => {
    let digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.startsWith('549')) return digits;
    if (digits.startsWith('54') && digits.length >= 12) {
      return '549' + digits.slice(2);
    }
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    if (digits.length === 10) {
      return `549${digits}`;
    }
    return digits;
  };

  // Abrir modal de compartir WhatsApp
  const openShareWhatsApp = (
    u: Profile,
    options?: {
      mode?: 'credentials' | 'fanzine_ready';
      fanzineTitle?: string;
      tempPass?: string;
    }
  ) => {
    setShareUser(u);
    setSharePhone(u.phone || '');
    setShareTempPass(options?.tempPass || '123456');
    setShareMode(options?.mode || 'credentials');
    setShareFanzineTitle(options?.fanzineTitle || (fanzines[0]?.title || 'el fanzine'));
    setCopiedShare(false);
  };

  // Habilitar acceso a un usuario
  const handleGrantAccess = async (
    userId: string,
    fanzineId: string,
    autoNotifyWhatsApp: boolean = false
  ) => {
    setActionLoading(`${userId}_${fanzineId}`);
    try {
      const res = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fanzineId, status: 'approved' }),
      });
      if (res.ok) {
        await loadAdminData();

        if (autoNotifyWhatsApp) {
          const targetUser = profiles.find((p) => p.id === userId);
          const targetFanzine = fanzines.find((f) => f.id === fanzineId);
          if (targetUser && targetFanzine) {
            openShareWhatsApp(targetUser, {
              mode: 'fanzine_ready',
              fanzineTitle: targetFanzine.title,
            });
          }
        }
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

  const getWhatsAppMessage = () => {
    if (!shareUser) return '';
    const cleanUser = shareUser.email.replace('@fanzines.com', '');
    const name = shareUser.full_name || cleanUser;

    if (shareMode === 'fanzine_ready') {
      return `¡Hola ${name}! 🎨 Te aviso que ya tienes habilitado el fanzine "${shareFanzineTitle}" en tu cuenta de Angelina Fanzines.\n\nYa puedes entrar a leerlo directamente en pantalla desde tu celular o computadora en tu biblioteca:\n👉 https://fanzines-angelina.vercel.app/mis-fanzines\n\n¡Muchas gracias por apoyar mis publicaciones y que lo disfrutes mucho! ✨`;
    }

    return `¡Hola ${name}! Ya tienes listo tu acceso a Angelina Fanzines para leer tus publicaciones online.\n\n🌐 Entra en: https://fanzines-angelina.vercel.app/login\n👤 Usuario: ${cleanUser}\n🔑 Clave temporal: ${shareTempPass}\n\n(En tu primer ingreso la web te pedirá crear tu contraseña personal). ¡Que lo disfrutes mucho! ✨`;
  };

  // Guardar teléfono modificado desde el modal de WhatsApp
  const handleSavePhoneFromModal = async () => {
    if (!shareUser) return;
    try {
      const cleanPhone = sharePhone.trim();
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: shareUser.id, phone: cleanPhone }),
      });
      setProfiles((prev) =>
        prev.map((p) => (p.id === shareUser.id ? { ...p, phone: cleanPhone } : p))
      );
      setShareUser((prev) => (prev ? { ...prev, phone: cleanPhone } : null));
    } catch (_) {}
  };

  const handleOpenWhatsApp = () => {
    // Si cambió o escribió un teléfono en el modal, lo guardamos permanentemente
    if (shareUser && sharePhone.trim() !== (shareUser.phone || '')) {
      handleSavePhoneFromModal();
    }

    const text = encodeURIComponent(getWhatsAppMessage());
    const formattedPhone = formatWhatsAppPhone(sharePhone);
    let url = `https://api.whatsapp.com/send?text=${text}`;
    if (formattedPhone) {
      url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Crear usuario manualmente
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setCreateMsg(null);

    const emailToUse = createEmail.includes('@') ? createEmail.trim().toLowerCase() : `${createEmail.trim().toLowerCase()}@fanzines.com`;
    const tempPass = createPassword || '123456';

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createEmail,
          fullName: createFullName,
          phone: createPhone,
          password: tempPass,
          mustChangePassword: createMustChange,
          role: createRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el usuario');

      await loadAdminData();

      // Abrir automáticamente el modal de WhatsApp con los datos recién creados
      const newCreatedProfile: Profile = {
        id: data.user?.id || 'temp',
        email: emailToUse,
        full_name: createFullName,
        phone: createPhone,
        role: createRole,
        must_change_password: createMustChange,
        created_at: new Date().toISOString(),
      };

      setShowCreateModal(false);
      openShareWhatsApp(newCreatedProfile, {
        mode: 'credentials',
        tempPass: tempPass,
      });

      setCreateEmail('');
      setCreateFullName('');
      setCreatePhone('');
      setCreatePassword('123456');
      setCreateMustChange(true);
    } catch (err: any) {
      setCreateMsg({ type: 'err', text: err.message || 'Error al crear usuario' });
    } finally {
      setCreatingUser(false);
    }
  };

  // Abrir modal de edición de usuario
  const openEditUser = (u: Profile) => {
    setEditingUser(u);
    setEditFullName(u.full_name || '');
    setEditPhone(u.phone || '');
    setEditEmail(u.email || '');
    setEditPassword('');
    setEditMustChange(u.must_change_password || false);
    setEditRole(u.role || 'user');
    setUserModalMsg(null);
  };

  // Guardar edición de usuario
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    setUserModalMsg(null);

    try {
      const payload: any = {
        userId: editingUser.id,
        fullName: editFullName,
        phone: editPhone,
        newEmail: editEmail !== editingUser.email ? editEmail : undefined,
        role: editRole,
        mustChangePassword: editMustChange,
      };

      if (editPassword.trim()) {
        if (editPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        payload.newPassword = editPassword;
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario');

      setUserModalMsg({ type: 'ok', text: '¡Usuario actualizado correctamente!' });
      
      // Actualizar estado local
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === editingUser.id
            ? { ...p, full_name: editFullName, phone: editPhone, email: editEmail, role: editRole, must_change_password: editMustChange }
            : p
        )
      );

      setTimeout(() => {
        setEditingUser(null);
      }, 1200);
    } catch (err: any) {
      setUserModalMsg({ type: 'err', text: err.message || 'Error al guardar' });
    } finally {
      setSavingUser(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`¿Estás segura de eliminar permanentemente la cuenta de ${email}?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');

      setProfiles((prev) => prev.filter((p) => p.id !== userId));
      setEditingUser(null);
    } catch (e: any) {
      alert(e.message || 'Error al eliminar usuario');
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
          Esta sección es exclusiva para la administradora. Tu cuenta no cuenta con permisos de administrador.
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

  const existingCategories = Array.from(
    new Set(fanzines.map((f) => f.category?.trim()).filter(Boolean))
  ) as string[];

  // --- MÓDULO DE VENTAS & RENDICIONES ---
  const getPeriodLabel = () => {
    if (salesPeriod === 'this_month') {
      const d = new Date();
      return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }
    if (salesPeriod === 'last_month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }
    if (salesPeriod === 'custom') {
      return `${customStart || 'Inicio'} al ${customEnd || 'Hoy'}`;
    }
    return 'Histórico Completo';
  };

  const fanzineMap = new Map<string, Fanzine>(fanzines.map((f) => [f.id, f]));
  const profileMap = new Map<string, Profile>(profiles.map((p) => [p.id, p]));

  // Filtrar accesos aprobados según el período
  const filteredSales = accesses.filter((acc) => {
    if (acc.status !== 'approved') return false;
    if (!acc.granted_at) return true;

    const grantedDate = new Date(acc.granted_at);
    const now = new Date();

    if (salesPeriod === 'this_month') {
      return (
        grantedDate.getFullYear() === now.getFullYear() &&
        grantedDate.getMonth() === now.getMonth()
      );
    }
    if (salesPeriod === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        grantedDate.getFullYear() === lastMonth.getFullYear() &&
        grantedDate.getMonth() === lastMonth.getMonth()
      );
    }
    if (salesPeriod === 'custom') {
      if (customStart && new Date(customStart) > grantedDate) return false;
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (end < grantedDate) return false;
      }
    }
    return true;
  });

  // Métricas globales
  const totalSalesCount = filteredSales.length;
  const totalSalesRevenue = filteredSales.reduce((acc, sale) => {
    const f = sale.fanzine || fanzineMap.get(sale.fanzine_id);
    return acc + (f?.price || 0);
  }, 0);

  // Rendición agrupada por autor
  interface AuthorReportItem {
    fanzineId: string;
    title: string;
    price: number;
    copies: number;
    revenue: number;
    coverUrl?: string | null;
  }

  interface AuthorReport {
    authorName: string;
    totalCopies: number;
    totalRevenue: number;
    fanzines: AuthorReportItem[];
  }

  const authorReportsMap = new Map<string, AuthorReport>();

  // 1. Agregar todos los fanzines del catálogo a su respectivo autor
  fanzines.forEach((f) => {
    const authorName = (f.author?.trim() || 'Angelina');
    if (!authorReportsMap.has(authorName)) {
      authorReportsMap.set(authorName, {
        authorName,
        totalCopies: 0,
        totalRevenue: 0,
        fanzines: [],
      });
    }
    const report = authorReportsMap.get(authorName)!;
    report.fanzines.push({
      fanzineId: f.id,
      title: f.title,
      price: f.price || 0,
      copies: 0,
      revenue: 0,
      coverUrl: f.cover_url,
    });
  });

  // 2. Sumar las ventas del período
  filteredSales.forEach((sale) => {
    const f = sale.fanzine || fanzineMap.get(sale.fanzine_id);
    const authorName = (f?.author?.trim() || 'Angelina');
    const price = f?.price || 0;
    const fId = f?.id || sale.fanzine_id;

    if (!authorReportsMap.has(authorName)) {
      authorReportsMap.set(authorName, {
        authorName,
        totalCopies: 0,
        totalRevenue: 0,
        fanzines: [],
      });
    }

    const report = authorReportsMap.get(authorName)!;
    report.totalCopies += 1;
    report.totalRevenue += price;

    let fEntry = report.fanzines.find((item) => item.fanzineId === fId);
    if (!fEntry) {
      fEntry = {
        fanzineId: fId,
        title: f?.title || 'Fanzine',
        price,
        copies: 0,
        revenue: 0,
        coverUrl: f?.cover_url,
      };
      report.fanzines.push(fEntry);
    }
    fEntry.copies += 1;
    fEntry.revenue += price;
  });

  const authorReports = Array.from(authorReportsMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue || b.totalCopies - a.totalCopies
  );

  // Ranking por fanzine
  const fanzineReports = fanzines
    .map((f) => {
      const count = filteredSales.filter((s) => s.fanzine_id === f.id).length;
      const revenue = count * (f.price || 0);
      return {
        ...f,
        copiesSold: count,
        revenue,
      };
    })
    .sort((a, b) => b.copiesSold - a.copiesSold || b.revenue - a.revenue);

  const topFanzine = fanzineReports.length > 0 && fanzineReports[0].copiesSold > 0 ? fanzineReports[0] : null;
  const topAuthor = authorReports.length > 0 && authorReports[0].totalCopies > 0 ? authorReports[0] : null;

  // Generador de texto para WhatsApp
  const getAuthorWhatsAppText = (author: AuthorReport) => {
    const periodLabel = getPeriodLabel();
    let msg = `*Rendición de Ventas - ${author.authorName}*\n`;
    msg += `📅 Período: ${periodLabel}\n`;
    msg += `📚 Total ejemplares vendidos: ${author.totalCopies}\n\n`;
    msg += `*Detalle por obra:*\n`;

    const sold = author.fanzines.filter((item) => item.copies > 0);
    if (sold.length === 0) {
      msg += `_Sin ventas registradas en este período._\n`;
    } else {
      sold.forEach((item) => {
        msg += `• *${item.title}*: ${item.copies} ${item.copies === 1 ? 'ejemplar' : 'ejemplares'} ($${item.price} c/u) = *$${item.revenue.toLocaleString('es-AR')}*\n`;
      });
    }

    msg += `\n💰 *Total a rendir: $${author.totalRevenue.toLocaleString('es-AR')}*\n\n`;
    msg += `_Plataforma digital Fanzines Angelina_`;
    return msg;
  };

  const handleCopyAuthorReport = (author: AuthorReport) => {
    const msg = getAuthorWhatsAppText(author);
    navigator.clipboard.writeText(msg);
    setCopiedAuthor(author.authorName);
    setTimeout(() => setCopiedAuthor(null), 3000);
  };

  const handleExportCSV = () => {
    const periodLabel = getPeriodLabel().replace(/\s+/g, '_');
    const headers = ['Fecha Aprobacion', 'Fanzine', 'Autor', 'Precio ($)', 'Comprador', 'Email Comprador', 'WhatsApp'];
    const rows = filteredSales.map((sale) => {
      const f = sale.fanzine || fanzineMap.get(sale.fanzine_id);
      const p = sale.profile || profileMap.get(sale.user_id);
      const dateStr = sale.granted_at ? new Date(sale.granted_at).toLocaleDateString('es-AR') : '';
      return [
        `"${dateStr}"`,
        `"${(f?.title || 'Fanzine').replace(/"/g, '""')}"`,
        `"${(f?.author || 'Angelina').replace(/"/g, '""')}"`,
        `"${f?.price || 0}"`,
        `"${(p?.full_name || 'Comprador').replace(/"/g, '""')}"`,
        `"${p?.email || ''}"`,
        `"${p?.phone || ''}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rendicion_Ventas_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Panel de Control - Administradora</span>
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900">Administración de Fanzines</h1>
            <p className="text-sm text-stone-600 mt-1">
              Sube tus fanzines en PDF, crea usuarios para tus clientes y pásales sus credenciales por WhatsApp.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar datos</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Aviso de Permisos en Supabase</span>
            </p>
            <p className="text-amber-800">{errorMessage}</p>
          </div>
        )}

        {/* PESTAÑAS PRINCIPALES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          <button
            onClick={() => setActiveTab('fanzines')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'fanzines'
                ? 'bg-white text-stone-900 shadow-md shadow-stone-200/50'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-brand-600" />
            <span>Fanzines ({fanzines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-stone-900 shadow-md shadow-stone-200/50'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Users className="w-4 h-4 text-brand-600" />
            <span>Usuarios ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'requests'
                ? 'bg-white text-stone-900 shadow-md shadow-stone-200/50'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-brand-600" />
            <span>Avisos Pago</span>
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'sales'
                ? 'bg-white text-emerald-800 shadow-md shadow-stone-200/50'
                : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Rendición & Ventas</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: FANZINES */}
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
                    placeholder="Ej: La murga se va"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>

                {/* Autor y Género */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Autor / Autora
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Angelina"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-700">
                        Género / Categoría
                      </label>
                    </div>
                    <input
                      type="text"
                      list="categories-list"
                      placeholder="Ej: Terror, Poesía..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    />
                    <datalist id="categories-list">
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Sugerencias de categorías autodefinidas */}
                {existingCategories.length > 0 && (
                  <div className="bg-stone-50 border border-stone-200/80 p-2.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                      Categorías existentes (toca para elegir):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {existingCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewCategory(cat)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                            newCategory.toLowerCase() === cat.toLowerCase()
                              ? 'bg-brand-600 text-white border-brand-600 font-semibold shadow-xs'
                              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Páginas y Edición / N° */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Cantidad de Páginas
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 16"
                      value={newPagesCount}
                      onChange={(e) => setNewPagesCount(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      N° Edición / Año
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: N° 1 o 2024"
                      value={newEditionNumber}
                      onChange={(e) => setNewEditionNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Descripción / Sinopsis
                  </label>
                  <textarea
                    rows={2}
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
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-semibold"
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
            <h2 className="text-lg font-bold text-stone-900">Tus Fanzines Publicados</h2>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-stone-900">{f.title}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          ${f.price}
                        </span>
                        {f.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                            {f.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
                        {f.author && (
                          <span>Por <strong className="text-stone-700">{f.author}</strong></span>
                        )}
                        {f.pages_count && (
                          <span className="font-mono text-[11px] text-stone-400">• {f.pages_count} págs</span>
                        )}
                        {f.edition_number && (
                          <span className="text-[11px] text-stone-400">• {f.edition_number}</span>
                        )}
                      </div>

                      {f.description && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-1 max-w-md">
                          {f.description}
                        </p>
                      )}

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
                      onClick={() => openEditFanzine(f)}
                      title="Editar datos del fanzine"
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 hover:border-brand-300 text-stone-600 hover:text-brand-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
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

      {/* SECCIÓN 2: GESTIÓN DE USUARIOS Y ACCESOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Usuarios Registrados y Sus Fanzines</h2>
              <p className="text-xs text-stone-500">
                Solo tú como administradora puedes crear nuevos usuarios para tus compradores.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setCreateEmail('');
                  setCreateFullName('');
                  setCreatePassword('123456');
                  setCreateMustChange(true);
                  setCreateRole('user');
                  setCreateMsg(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Crear Nuevo Usuario</span>
              </button>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por email o alias..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
            {filteredProfiles.length === 0 ? (
              <div className="p-12 text-center text-sm text-stone-500 space-y-3">
                <Users className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-700">No hay usuarios registrados que coincidan</p>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Usa el botón "+ Crear Nuevo Usuario" arriba para dar de alta a un comprador con su contraseña inicial.
                </p>
              </div>
            ) : (
              filteredProfiles.map((p) => {
                const userAccessList = accesses.filter((a) => a.user_id === p.id && a.status === 'approved');

                return (
                  <div key={p.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
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

                          {p.must_change_password ? (
                            <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                              Debe cambiar clave en 1° login
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                              Clave personalizada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {p.full_name && (
                            <span className="text-xs text-stone-600 font-medium">{p.full_name}</span>
                          )}
                          {p.phone ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{p.phone}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              Sin WhatsApp agendado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-stone-500 mr-1">
                          Habilitados:{' '}
                          <strong className="text-stone-800">{userAccessList.length}</strong>
                        </span>

                        {/* Botón WhatsApp */}
                        <button
                          onClick={() => openShareWhatsApp(p, { mode: 'credentials' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all shadow-sm"
                          title="Enviar credenciales o avisos por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Botón para editar usuario y contraseña */}
                        <button
                          onClick={() => openEditUser(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-brand-300 hover:bg-brand-50 text-stone-700 hover:text-brand-700 text-xs font-semibold transition-all shadow-sm"
                        >
                          <Key className="w-3.5 h-3.5 text-stone-500" />
                          <span>Editar / Clave</span>
                        </button>
                      </div>
                    </div>

                    {/* Fanzines checkboxes / botones */}
                    <div className="pt-2 border-t border-stone-100">
                      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                        Toca un fanzine para habilitar o quitar acceso:
                      </p>
                      {fanzines.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">Primero debes subir algún fanzine en la pestaña Fanzines.</p>
                      ) : (
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
                                    handleGrantAccess(p.id, f.id, true);
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
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: AVISOS DE PAGO PENDIENTES */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-900">Avisos de Transferencias Recibidas</h2>
          <p className="text-xs text-stone-500">
            Aquí aparecen las notificaciones enviadas por clientes.
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

                    <div className="flex items-center gap-2 flex-wrap">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleGrantAccess(notif.user_id, notif.fanzine_id, true)}
                            disabled={actionLoading === `${notif.user_id}_${notif.fanzine_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                            title="Aprobar acceso y abrir WhatsApp para avisar al comprador"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar y Avisar</span>
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Habilitado</span>
                          </span>
                          <button
                            onClick={() => {
                              const p = notif.profile;
                              const f = notif.fanzine;
                              if (p && f) {
                                openShareWhatsApp(p, {
                                  mode: 'fanzine_ready',
                                  fanzineTitle: f.title,
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all shadow-sm"
                            title="Reenviar o avisar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Avisar WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 4: RENDICIÓN & VENTAS */}
      {activeTab === 'sales' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header de la sección y acciones */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Panel Financiero y Liquidaciones</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Rendición de Cuentas y Ventas</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Total de ventas aprobadas por autor y fanzine. Rinde el dinero correspondiente a cada creador con 1 clic.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={filteredSales.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                title="Descargar planilla CSV para Excel o Google Sheets"
              >
                <Download className="w-4 h-4 text-stone-600" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros por Período */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Filtrar por Período:</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'Todo el Historial' },
                  { id: 'this_month', label: 'Este Mes' },
                  { id: 'last_month', label: 'Mes Anterior' },
                  { id: 'custom', label: 'Personalizado' },
                ].map((item) => {
                  const isActive = salesPeriod === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSalesPeriod(item.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {salesPeriod === 'custom' && (
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-medium">Desde:</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-medium">Hasta:</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                {(customStart || customEnd) && (
                  <button
                    onClick={() => {
                      setCustomStart('');
                      setCustomEnd('');
                    }}
                    className="text-stone-500 hover:text-stone-800 underline text-xs"
                  >
                    Limpiar fechas
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tarjetas de Métricas Generales (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Recaudado</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-stone-900 tracking-tight">
                ${totalSalesRevenue.toLocaleString('es-AR')}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">Período: {getPeriodLabel()}</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Ejemplares Vendidos</span>
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-stone-900 tracking-tight">
                {totalSalesCount}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">Ventas y accesos aprobados</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Autores Activos</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-stone-900 tracking-tight">
                {authorReports.filter((a) => a.totalCopies > 0).length} / {authorReports.length}
              </p>
              <p className="text-[11px] text-stone-400 mt-1">Con ventas en el período</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Fanzine Estrella</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              {topFanzine ? (
                <>
                  <p className="text-lg font-bold text-stone-900 truncate" title={topFanzine.title}>
                    {topFanzine.title}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    {topFanzine.copiesSold} {topFanzine.copiesSold === 1 ? 'venta' : 'ventas'} (${topFanzine.revenue.toLocaleString('es-AR')})
                  </p>
                </>
              ) : (
                <p className="text-xs text-stone-400 mt-2">Sin ventas en este período</p>
              )}
            </div>
          </div>

          {/* Sub-navegación: Por Autor | Por Fanzine | Movimientos Detallados */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSalesSubTab('authors')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'authors'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rendición por Autor ({authorReports.length})</span>
            </button>

            <button
              onClick={() => setSalesSubTab('fanzines')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'fanzines'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Ranking por Fanzine ({fanzines.length})</span>
            </button>

            <button
              onClick={() => setSalesSubTab('movements')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'movements'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Registro Detallado ({filteredSales.length})</span>
            </button>
          </div>

          {/* SUB-VISTA 1: RENDICIÓN POR AUTOR */}
          {salesSubTab === 'authors' && (
            <div className="space-y-6">
              {authorReports.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300">
                  <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-stone-700">No hay autores registrados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {authorReports.map((author) => {
                    const isCopied = copiedAuthor === author.authorName;

                    return (
                      <div
                        key={author.authorName}
                        className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        {/* Cabecera del Autor */}
                        <div className="p-6 border-b border-stone-100 bg-gradient-to-br from-stone-50/50 to-white">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center shadow-inner">
                                {author.authorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-stone-900 text-lg leading-tight">
                                  {author.authorName}
                                </h3>
                                <p className="text-xs text-stone-500 mt-0.5">
                                  {author.fanzines.length} {author.fanzines.length === 1 ? 'obra publicada' : 'obras publicadas'}
                                </p>
                              </div>
                            </div>

                            {/* Monto Total a Rendir */}
                            <div className="text-right">
                              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                                Total a Rendir
                              </span>
                              <span className="text-2xl font-black text-emerald-600">
                                ${author.totalRevenue.toLocaleString('es-AR')}
                              </span>
                              <span className="text-xs text-stone-500 block">
                                {author.totalCopies} {author.totalCopies === 1 ? 'ejemplar' : 'ejemplares'}
                              </span>
                            </div>
                          </div>

                          {/* Botones de acción para WhatsApp */}
                          <div className="mt-4 pt-4 border-t border-stone-200/60 flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleCopyAuthorReport(author)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                                isCopied
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title="Copiar desglose completo para pegar en WhatsApp"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>¡Reporte Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar Rendición WhatsApp</span>
                                </>
                              )}
                            </button>

                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getAuthorWhatsAppText(author))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all shadow-sm"
                              title="Abrir WhatsApp Web con el texto prearmado"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Abrir WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        {/* Desglose de Fanzines del Autor */}
                        <div className="p-6 divide-y divide-stone-100 flex-1">
                          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">
                            Desglose por Fanzine ({getPeriodLabel()}):
                          </p>
                          {author.fanzines.map((item) => (
                            <div key={item.fanzineId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-stone-800 truncate">{item.title}</p>
                                <p className="text-[11px] text-stone-500">
                                  Precio: ${item.price} c/u
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className={`font-semibold ${item.copies > 0 ? 'text-stone-900' : 'text-stone-400'}`}>
                                  {item.copies} {item.copies === 1 ? 'venta' : 'ventas'}
                                </span>
                                <span className={`block font-bold text-xs ${item.copies > 0 ? 'text-emerald-700' : 'text-stone-400'}`}>
                                  ${item.revenue.toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-VISTA 2: RANKING POR FANZINE */}
          {salesSubTab === 'fanzines' && (
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Rendimiento por Fanzine</h3>
                  <p className="text-xs text-stone-500">Listado de títulos ordenados por cantidad de ventas</p>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  {fanzineReports.length} obras en catálogo
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Fanzine</th>
                      <th className="py-3 px-4">Autor / Autora</th>
                      <th className="py-3 px-4 text-center">Precio Unitario</th>
                      <th className="py-3 px-4 text-center">Ejemplares Vendidos</th>
                      <th className="py-3 px-4 text-right">Total Recaudado</th>
                      <th className="py-3 px-4 text-center">Popularidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {fanzineReports.map((item, idx) => {
                      const sharePercent =
                        totalSalesCount > 0 ? Math.round((item.copiesSold / totalSalesCount) * 100) : 0;

                      return (
                        <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-stone-900 flex items-center gap-3">
                            <span className="text-[11px] font-bold text-stone-400 w-4 text-center">
                              #{idx + 1}
                            </span>
                            <div className="w-9 h-11 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                              {item.cover_url ? (
                                <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 leading-snug">{item.title}</p>
                              {item.category && (
                                <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded font-medium">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-stone-600 font-medium">
                            {item.author || 'Angelina'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                            ${item.price}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                                item.copiesSold > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-100 text-stone-400'
                              }`}
                            >
                              {item.copiesSold}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-stone-900">
                            ${item.revenue.toLocaleString('es-AR')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="w-24 mx-auto bg-stone-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${sharePercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-stone-400 mt-0.5 block">{sharePercent}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VISTA 3: REGISTRO DETALLADO DE VENTAS */}
          {salesSubTab === 'movements' && (
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Movimientos Individuales</h3>
                  <p className="text-xs text-stone-500">Historial de cada acceso y venta aprobada</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {filteredSales.length} ventas en el período
                </span>
              </div>

              {filteredSales.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-700">No hay movimientos en este período</p>
                  <p className="text-xs text-stone-400 mt-1">Prueba seleccionando "Todo el Historial".</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Fanzine</th>
                        <th className="py-3 px-4">Autor/a</th>
                        <th className="py-3 px-4 text-right">Precio</th>
                        <th className="py-3 px-4">Comprador</th>
                        <th className="py-3 px-4">Contacto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredSales.map((sale) => {
                        const f = sale.fanzine || fanzineMap.get(sale.fanzine_id);
                        const p = sale.profile || profileMap.get(sale.user_id);
                        const dateStr = sale.granted_at
                          ? new Date(sale.granted_at).toLocaleString('es-AR', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Fecha s/d';

                        return (
                          <tr key={sale.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                              {dateStr}
                            </td>
                            <td className="py-3 px-4 font-bold text-stone-900">
                              {f?.title || 'Fanzine'}
                            </td>
                            <td className="py-3 px-4 text-stone-600 font-medium">
                              {f?.author || 'Angelina'}
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-emerald-700 font-mono">
                              ${f?.price || 0}
                            </td>
                            <td className="py-3 px-4 text-stone-800 font-medium">
                              {p?.full_name || 'Comprador'}
                            </td>
                            <td className="py-3 px-4 text-stone-500 text-[11px]">
                              <div>{p?.email}</div>
                              {p?.phone && <div className="text-emerald-700 font-mono">{p.phone}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREAR NUEVO USUARIO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Crear Usuario Comprador</h3>
                  <p className="text-xs text-stone-500">Alta de cuenta para un cliente</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {createMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  createMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {createMsg.type === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{createMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre o Alias del Comprador
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Ej: Sofía Martínez"
                    value={createFullName}
                    onChange={(e) => setCreateFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="Ej: 11 2345 6789 o +54 9 11..."
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Quedará agendado para enviarle accesos o avisos de fanzines en 1 clic.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Usuario o Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="sofia o sofia@email.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Si escribes solo el nombre (ej: "sofia"), el sistema le asignará "sofia@fanzines.com".
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contraseña Inicial Temporal
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-mono font-semibold"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Por defecto sugerimos <code>123456</code>.
                </p>
              </div>

              {/* Checkbox para forzar cambio de clave */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createMustChange}
                    onChange={(e) => setCreateMustChange(e.target.checked)}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-stone-800 block">
                      Exigir cambio de clave al ingresar
                    </span>
                    <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                      Cuando el cliente inicie sesión por primera vez con la clave temporal, la página le obligará a crear su contraseña personal.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                >
                  <option value="user">Cliente estándar (solo lectura de fanzines habilitados)</option>
                  <option value="admin">Administrador (acceso completo al panel)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="py-2.5 px-4 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {creatingUser ? 'Creando...' : 'Crear y Continuar a WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR USUARIO Y CONTRASEÑA */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Editar Usuario</h3>
                  <p className="text-xs text-stone-500 truncate max-w-[240px]">{editingUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {userModalMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  userModalMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {userModalMsg.type === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{userModalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre o Alias
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="Ej: 11 2345 6789 o +54 9 11..."
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Puedes agendarlo o actualizarlo para tenerlo listo al mandar mensajes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nueva Contraseña (Opcional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Dejar en blanco si no quieres cambiarla"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Si el cliente se olvidó su clave, puedes escribirle aquí una nueva (mínimo 6 caracteres).
                </p>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editMustChange}
                    onChange={(e) => setEditMustChange(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-medium text-stone-700">
                    Exigirle cambiar contraseña en su próximo inicio de sesión
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Rol del Usuario
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                >
                  <option value="user">Cliente estándar (user)</option>
                  <option value="admin">Administrador (admin)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(editingUser.id, editingUser.email)}
                  className="p-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar usuario permanentemente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="py-2 px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="py-2 px-4 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {savingUser ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: COMPARTIR POR WHATSAPP */}
      {shareUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Enviar por WhatsApp</h3>
                  <p className="text-xs text-stone-500">Para: {shareUser.full_name || shareUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShareUser(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Pestañas para elegir tipo de mensaje */}
            <div className="flex rounded-xl bg-stone-100 p-1 mb-4 border border-stone-200">
              <button
                type="button"
                onClick={() => setShareMode('credentials')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  shareMode === 'credentials'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                🔑 Alta / Credenciales
              </button>
              <button
                type="button"
                onClick={() => setShareMode('fanzine_ready')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  shareMode === 'fanzine_ready'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                🎨 Fanzine Habilitado
              </button>
            </div>

            <div className="space-y-4">
              {/* Teléfono / WhatsApp con guardado automático */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Número de WhatsApp
                  </label>
                  {sharePhone.trim() && sharePhone.trim() !== (shareUser.phone || '') && (
                    <span className="text-[10px] text-emerald-600 font-semibold animate-pulse">
                      ✓ Se agendará en su perfil
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="Ej: 11 2345 6789 o +54 9 11..."
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  {shareUser.phone ? 'Número agendado del comprador. Puedes editarlo aquí si cambió.' : 'Escribe su número aquí y quedará guardado para futuros envíos.'}
                </p>
              </div>

              {/* Selector si es fanzine habilitado */}
              {shareMode === 'fanzine_ready' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Fanzine para notificar:
                  </label>
                  <select
                    value={shareFanzineTitle}
                    onChange={(e) => setShareFanzineTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                  >
                    {fanzines.map((f) => (
                      <option key={f.id} value={f.title}>
                        {f.title} (${f.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clave temporal si es credenciales */}
              {shareMode === 'credentials' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Clave Temporal Informada
                  </label>
                  <input
                    type="text"
                    value={shareTempPass}
                    onChange={(e) => setShareTempPass(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono font-semibold"
                  />
                </div>
              )}

              {/* Mensaje formateado listo */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Vista previa del mensaje:
                </label>
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {getWhatsAppMessage()}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">¡Mensaje Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Abrir WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDITAR DATOS DEL FANZINE */}
      {editingFanzine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200/60">
                  <Pencil className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Editar Fanzine</h3>
                  <p className="text-xs text-stone-500 truncate max-w-[280px]">{editingFanzine.title}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingFanzine(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {editFMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  editFMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {editFMsg.type === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{editFMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveFanzine} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Título del Fanzine *
                </label>
                <input
                  type="text"
                  required
                  value={editFTitle}
                  onChange={(e) => setEditFTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>

              {/* Autor y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Autor / Autora
                  </label>
                  <input
                    type="text"
                    value={editFAuthor}
                    onChange={(e) => setEditFAuthor(e.target.value)}
                    placeholder="Ej: Angelina"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Género / Categoría
                  </label>
                  <input
                    type="text"
                    list="edit-categories-list"
                    value={editFCategory}
                    onChange={(e) => setEditFCategory(e.target.value)}
                    placeholder="Ej: Terror, Poesía..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                  <datalist id="edit-categories-list">
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Categorías existentes como botones rápidos */}
              {existingCategories.length > 0 && (
                <div className="bg-stone-50 border border-stone-200/80 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Tocar categoría existente:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {existingCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditFCategory(cat)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          editFCategory.toLowerCase() === cat.toLowerCase()
                            ? 'bg-brand-600 text-white border-brand-600 font-semibold'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Páginas y Edición */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cantidad de Páginas
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 16"
                    value={editFPagesCount}
                    onChange={(e) => setEditFPagesCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    N° Edición / Año
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: N° 1 o 2024"
                    value={editFEditionNumber}
                    onChange={(e) => setEditFEditionNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Precio ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFPrice}
                  onChange={(e) => setEditFPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descripción / Sinopsis
                </label>
                <textarea
                  rows={3}
                  value={editFDesc}
                  onChange={(e) => setEditFDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingFanzine(null)}
                  className="py-2 px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFanzine}
                  className="py-2 px-4 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingFanzine ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
