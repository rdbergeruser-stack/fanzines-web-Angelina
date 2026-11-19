'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isRegister, setIsRegister] = useState(false);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Si el usuario escribe solo "Angelina", lo convertimos a "angelina@fanzines.com"
    let emailToUse = emailOrUser.trim().toLowerCase();
    if (!emailToUse.includes('@')) {
      emailToUse = `${emailToUse}@fanzines.com`;
    }

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: emailToUse,
          password,
          options: {
            data: {
              full_name: fullName || emailOrUser,
            },
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg('¡Cuenta creada! Revisa tu correo electrónico para confirmar tu cuenta.');
        } else {
          setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1000);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (error) throw error;

        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-stone-200/50 border border-stone-200">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {isRegister ? 'Crear una cuenta' : 'Bienvenido/a de nuevo'}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {isRegister
              ? 'Regístrate para acceder y descargar tus fanzines'
              : 'Ingresa con tu email o usuario para ver tus fanzines'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Nombre o Alias
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Usuario o Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="text"
                required
                placeholder="angelina o tu@email.com"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.99] transition-all shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Crear mi cuenta' : 'Ingresar'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-600">
            {isRegister ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="ml-2 font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              {isRegister ? 'Inicia sesión aquí' : 'Regístrate aquí'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
