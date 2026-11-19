import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Angelina Fanzines - Tienda y Descargas',
  description: 'Descarga tus fanzines favoritos en PDF de manera segura y directa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] pb-16">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Angelina Fanzines. Todos los derechos reservados.</p>
        </footer>
      </body>
    </html>
  );
}
