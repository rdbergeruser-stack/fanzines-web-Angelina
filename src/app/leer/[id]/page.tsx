'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export default function LeerFanzinePage() {
  const router = useRouter();
  const params = useParams();
  const fanzineId = params?.id as string;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSignedUrl = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/download/${fanzineId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No tienes acceso a este fanzine o la sesión expiró.');
      }

      if (data.downloadUrl) {
        setPdfUrl(data.downloadUrl);
      } else {
        throw new Error('No se pudo generar la vista de lectura.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar el fanzine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fanzineId) {
      fetchSignedUrl();
    }
  }, [fanzineId]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900 flex flex-col">
      {/* Barra superior de lectura */}
      <header className="h-14 bg-stone-900 border-b border-stone-800 px-4 flex items-center justify-between text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/mis-fanzines"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mis Fanzines</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase bg-brand-600/30 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-md font-semibold">
              Lector Online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pdfUrl && (
            <>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-xl transition-colors"
                title="Abrir en pestaña completa"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva pestaña</span>
              </a>

              <a
                href={pdfUrl}
                download
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Descargar PDF</span>
              </a>
            </>
          )}
        </div>
      </header>

      {/* Visor interactivo */}
      <main className="flex-1 w-full bg-stone-950 flex flex-col relative overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-stone-300">Cargando fanzine...</p>
            <p className="text-xs text-stone-500 mt-1">Preparando páginas para tu pantalla</p>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-red-950 border border-red-800 text-red-400 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No se pudo cargar el fanzine</h3>
            <p className="text-xs text-stone-400 mt-2 max-w-sm">{errorMsg}</p>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={fetchSignedUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
              <Link
                href="/mis-fanzines"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                Volver
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Aviso para celulares en caso de que el navegador bloquee iframes */}
            <div className="sm:hidden bg-stone-900 border-b border-stone-800 py-1.5 px-3 flex items-center justify-between text-[11px] text-stone-400">
              <span>¿No ves el visor completo en tu móvil?</span>
              <a
                href={pdfUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 underline font-semibold ml-2"
              >
                Toca aquí para abrirlo directo
              </a>
            </div>

            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              title="Lector de Fanzine"
              className="w-full flex-1 border-0 bg-stone-950"
            />
          </div>
        )}
      </main>
    </div>
  );
}
