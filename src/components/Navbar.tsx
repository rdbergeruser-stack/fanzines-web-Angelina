'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, LogOut, Shield, User, Download } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      setLoading(false);
      return;
    }

    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, must_change_password')
            .eq('id', user.id)
            .single();

          setRole(profile?.role || 'user');

          // Si el usuario tiene pendiente cambiar la contraseña, redirigir a /cambiar-clave
          if (profile?.must_change_password && pathname !== '/cambiar-clave') {
            router.push('/cambiar-clave');
          }
        } else {
          setRole(null);
        }
      } catch (e) {
        console.error('Error checking user:', e);
      } finally {
        setLoading(false);
      }
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, must_change_password')
            .eq('id', currentUser.id)
            .single();

          setRole(profile?.role || 'user');

          if (profile?.must_change_password && pathname !== '/cambiar-clave') {
            router.push('/cambiar-clave');
          }
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, pathname, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-stone-900 group-hover:text-brand-600 transition-colors">
                Angelina Fanzines
              </span>
              <span className="hidden sm:inline-block text-xs font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded ml-2">
                PDF Store
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/'
                  ? 'text-brand-700 bg-brand-50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Catálogo
            </Link>

            {user && (
              <Link
                href="/mis-fanzines"
                className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/mis-fanzines'
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Mis Fanzines</span>
              </Link>
            )}

            {role === 'admin' && (
              <Link
                href="/admin"
                className={`text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'text-amber-800 bg-amber-100'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Panel Admin</span>
              </Link>
            )}

            {/* Auth Button */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                    <span className="hidden md:inline-block text-xs text-stone-500 truncate max-w-[150px]">
                      {user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-red-600 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:border-red-200 hover:bg-red-50 transition-colors"
                      title="Cerrar sesión"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Salir</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Iniciar sesión</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
