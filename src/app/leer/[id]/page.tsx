'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Moon,
  Sun,
  Coffee,
} from 'lucide-react';

export default function LeerFanzinePage() {
  const params = useParams();
  const fanzineId = params?.id as string;

  const [fanzineTitle, setFanzineTitle] = useState<string>('Fanzine');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Cargando fanzine...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modo de lectura (Noche, Sepia, Día) y Marcapáginas
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [resumeToast, setResumeToast] = useState<{ page: number; show: boolean }>({ page: 1, show: false });

  // Cargar tema guardado al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fanzine_reader_theme') as 'dark' | 'sepia' | 'light' | null;
      if (saved && ['dark', 'sepia', 'light'].includes(saved)) {
        setReaderTheme(saved);
      }
    } catch (_) {}
  }, []);

  const changeTheme = (newTheme: 'dark' | 'sepia' | 'light') => {
    setReaderTheme(newTheme);
    try {
      localStorage.setItem('fanzine_reader_theme', newTheme);
    } catch (_) {}
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Cargar PDF.js dinámicamente desde /pdfjs/pdf.min.js
  const loadPdfJsLibrary = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = '/pdfjs/pdf.min.js';
      script.async = true;
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
          resolve(lib);
        } else {
          reject(new Error('No se pudo inicializar el visor de PDF'));
        }
      };
      script.onerror = () => reject(new Error('Error cargando el motor de lectura'));
      document.body.appendChild(script);
    });
  };

  // Inicializar y descargar documento en memoria
  const initFanzine = async () => {
    setLoading(true);
    setErrorMsg(null);
    setLoadingMessage('Obteniendo acceso seguro...');

    try {
      // 1. Obtener URL firmada inline y título
      const res = await fetch(`/api/download/${fanzineId}`);
      const data = await res.json();

      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || 'No tienes acceso a este fanzine o la sesión expiró.');
      }

      if (data.title) {
        setFanzineTitle(data.title);
      }

      setLoadingMessage('Iniciando lector...');
      const pdfjs = await loadPdfJsLibrary();

      setLoadingMessage('Descargando páginas...');
      const loadingTask = pdfjs.getDocument({
        url: data.downloadUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      });

      const loadedDoc = await loadingTask.promise;
      setPdfDoc(loadedDoc);
      setTotalPages(loadedDoc.numPages);

      // Recordar última página leída (Marcapáginas)
      try {
        const savedPageStr = localStorage.getItem(`fanzine_reading_page_${fanzineId}`);
        const savedPage = savedPageStr ? parseInt(savedPageStr, 10) : 1;
        if (savedPage > 1 && savedPage <= loadedDoc.numPages) {
          setCurrentPage(savedPage);
          setResumeToast({ page: savedPage, show: true });
          setTimeout(() => setResumeToast((prev) => ({ ...prev, show: false })), 4500);
        } else {
          setCurrentPage(1);
        }
      } catch (_) {
        setCurrentPage(1);
      }
    } catch (err: any) {
      console.error('Error al cargar fanzine:', err);
      setErrorMsg(err.message || 'Error al cargar el fanzine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fanzineId) {
      initFanzine();
    }
  }, [fanzineId]);

  // Guardar última página en localStorage cuando avanza
  useEffect(() => {
    if (fanzineId && currentPage > 0 && totalPages > 0) {
      try {
        localStorage.setItem(`fanzine_reading_page_${fanzineId}`, currentPage.toString());
      } catch (_) {}
    }
  }, [fanzineId, currentPage, totalPages]);

  // Renderizar la página actual en el canvas
  const renderPage = useCallback(
    async (num: number, doc: any) => {
      if (!doc || !canvasRef.current || !containerRef.current) return;

      try {
        // Cancelar render previo si aún sigue ejecutándose
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (_) {}
        }

        const page = await doc.getPage(num);
        const containerWidth = containerRef.current.clientWidth - 32; // margen de 16px a cada lado
        const containerHeight = containerRef.current.clientHeight - 32;

        const unscaledViewport = page.getViewport({ scale: 1.0 });

        let currentScale = scale;
        if (isAutoFit) {
          // Ajustar al ancho de pantalla en celulares y a altura/ancho en PC
          const scaleW = Math.max(0.4, containerWidth / unscaledViewport.width);
          // En escritorio podemos considerar también la altura para que no desborde
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            currentScale = scaleW;
          } else {
            const scaleH = containerHeight / unscaledViewport.height;
            currentScale = Math.min(scaleW, scaleH * 0.95);
          }
        }

        const viewport = page.getViewport({ scale: currentScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Soporte para pantallas Retina / alta resolución (móviles HD)
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          transform: transform || undefined,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error renderizando página:', err);
        }
      }
    },
    [scale, isAutoFit]
  );

  // Re-render cuando cambia página, documento o escala
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage, pdfDoc);
    }
  }, [pdfDoc, currentPage, renderPage]);

  // Manejar redimensionamiento de pantalla (orientación celular)
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc && isAutoFit) {
        renderPage(currentPage, pdfDoc);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc, currentPage, isAutoFit, renderPage]);

  // Atajos de teclado para PC (flechas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Manejo de gestos táctiles (Swipe en celulares)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    // Detectar deslizamiento horizontal con umbral de 45px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX < 0) {
        // Deslizó hacia la izquierda -> Siguiente página
        goToNextPage();
      } else {
        // Deslizó hacia la derecha -> Página anterior
        goToPrevPage();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleZoomIn = () => {
    setIsAutoFit(false);
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setIsAutoFit(false);
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setIsAutoFit(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Clases según tema de lectura (dark, sepia, light)
  const themeClasses = {
    dark: {
      root: 'bg-stone-950 text-stone-100',
      header: 'bg-stone-900 border-stone-800 text-stone-200',
      headerButton: 'text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700',
      controlsBg: 'bg-stone-800 border-stone-700 text-stone-300',
      main: 'bg-stone-950',
      canvas: 'shadow-2xl shadow-black/80 ring-1 ring-white/10',
      footer: 'bg-stone-900/95 border-stone-800',
      footerBar: 'bg-stone-800/90 border-stone-700/80 text-stone-300',
      prevBtn: 'bg-stone-700/80 hover:bg-stone-700 text-white',
      pageHighlight: 'text-white',
    },
    sepia: {
      root: 'bg-[#F4ECD8] text-[#422D1D]',
      header: 'bg-[#EADDC2] border-[#D8C7A5] text-[#422D1D]',
      headerButton: 'text-[#422D1D] hover:text-stone-900 bg-[#DECEAD] hover:bg-[#D4C3A0]',
      controlsBg: 'bg-[#DECEAD] border-[#D8C7A5] text-[#422D1D]',
      main: 'bg-[#F4ECD8]',
      canvas: 'shadow-2xl shadow-[#422D1D]/20 ring-1 ring-[#D8C7A5]',
      footer: 'bg-[#EADDC2]/95 border-[#D8C7A5]',
      footerBar: 'bg-[#DECEAD]/95 border-[#D8C7A5] text-[#422D1D]',
      prevBtn: 'bg-[#CEBE9D] hover:bg-[#C2B18E] text-[#422D1D]',
      pageHighlight: 'text-[#2D1B0F]',
    },
    light: {
      root: 'bg-stone-200 text-stone-900',
      header: 'bg-white border-stone-300 text-stone-800',
      headerButton: 'text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200',
      controlsBg: 'bg-stone-100 border-stone-300 text-stone-700',
      main: 'bg-stone-200',
      canvas: 'shadow-2xl shadow-stone-500/30 ring-1 ring-stone-300',
      footer: 'bg-white/95 border-stone-300',
      footerBar: 'bg-stone-100/95 border-stone-300 text-stone-700',
      prevBtn: 'bg-stone-200 hover:bg-stone-300 text-stone-800',
      pageHighlight: 'text-stone-900',
    },
  };

  const currentTheme = themeClasses[readerTheme];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden transition-colors duration-300 ${currentTheme.root}`}>
      {/* Toast de Marcapáginas / Reanudar Lectura */}
      {resumeToast.show && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 text-white border border-brand-500/50 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 text-xs">
          <BookOpen className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span>Continuando desde la <strong className="text-brand-300">página {resumeToast.page}</strong></span>
          <button
            onClick={() => {
              setCurrentPage(1);
              setResumeToast({ page: 1, show: false });
            }}
            className="text-[11px] font-semibold text-brand-300 hover:text-white underline pl-1"
          >
            Ir al inicio
          </button>
          <button
            onClick={() => setResumeToast((prev) => ({ ...prev, show: false }))}
            className="text-stone-400 hover:text-white text-xs pl-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra Superior */}
      <header className={`h-14 border-b px-3 sm:px-4 flex items-center justify-between flex-shrink-0 z-20 transition-colors duration-300 ${currentTheme.header}`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/mis-fanzines"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors flex-shrink-0 ${currentTheme.headerButton}`}
            title="Volver a mis fanzines"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Biblioteca</span>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] sm:text-xs font-mono uppercase bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/30 px-1.5 py-0.5 rounded font-semibold hidden md:inline">
              Lector
            </span>
            <h1 className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-xs md:max-w-md">
              {fanzineTitle}
            </h1>
          </div>
        </div>

        {/* Controles de Vista y Selector de Tema */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Selector de Tema: Noche / Sepia / Día */}
          <div className={`flex items-center rounded-xl p-0.5 border ${currentTheme.controlsBg}`}>
            <button
              onClick={() => changeTheme('dark')}
              className={`p-1.5 rounded-lg transition-colors ${
                readerTheme === 'dark'
                  ? 'bg-stone-700 text-brand-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-100'
              }`}
              title="Modo Noche (Oscuro)"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => changeTheme('sepia')}
              className={`p-1.5 rounded-lg transition-colors ${
                readerTheme === 'sepia'
                  ? 'bg-[#CDBE9F] text-[#422D1D] font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Modo Sepia (Cálido / Papel)"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => changeTheme('light')}
              className={`p-1.5 rounded-lg transition-colors ${
                readerTheme === 'light'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-400 hover:text-stone-800'
              }`}
              title="Modo Día (Claro)"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          {totalPages > 0 && (
            <div className={`hidden sm:flex items-center rounded-xl p-0.5 border ${currentTheme.controlsBg}`}>
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:opacity-80 rounded-lg transition-colors"
                title="Alejar (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className={`px-2 py-1 text-[11px] font-mono rounded-lg transition-colors ${
                  isAutoFit ? 'text-brand-500 font-semibold' : 'hover:opacity-80'
                }`}
                title="Ajustar al ancho de pantalla"
              >
                {isAutoFit ? 'Auto' : `${Math.round(scale * 100)}%`}
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:opacity-80 rounded-lg transition-colors"
                title="Acercar (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition-colors inline-flex ${currentTheme.headerButton}`}
            title="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Área del Visor (Canvas) */}
      <main
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex-1 w-full flex items-center justify-center relative overflow-auto p-2 sm:p-4 select-none transition-colors duration-300 ${currentTheme.main}`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">{loadingMessage}</p>
            <p className="text-xs opacity-60 mt-1">Preparando páginas para tu dispositivo</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <div className="w-12 h-12 bg-red-950/80 border border-red-800 text-red-400 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">No se pudo abrir el fanzine</h3>
            <p className="text-xs opacity-75 mt-2">{errorMsg}</p>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={initFanzine}
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
          <div className="relative inline-block my-auto">
            {/* Canvas donde se dibuja la página */}
            <canvas
              ref={canvasRef}
              className={`rounded-lg bg-white max-w-none transition-all duration-300 ${currentTheme.canvas}`}
            />

            {/* Zonas de navegación táctil a los costados (pantalla completa) */}
            <div
              onClick={goToPrevPage}
              className="absolute left-0 top-0 bottom-0 w-1/5 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-start pl-2 text-stone-400 hover:text-white transition-opacity"
              title="Página anterior"
            >
              {currentPage > 1 && (
                <div className="bg-stone-900/80 p-2 rounded-full backdrop-blur-sm shadow-lg">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div
              onClick={goToNextPage}
              className="absolute right-0 top-0 bottom-0 w-1/5 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-end pr-2 text-stone-400 hover:text-white transition-opacity"
              title="Página siguiente"
            >
              {currentPage < totalPages && (
                <div className="bg-stone-900/80 p-2 rounded-full backdrop-blur-sm shadow-lg">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Barra Inferior Flotante de Páginas */}
      {!loading && !errorMsg && totalPages > 0 && (
        <footer className={`h-14 backdrop-blur-sm border-t px-4 flex items-center justify-center flex-shrink-0 z-20 transition-colors duration-300 ${currentTheme.footer}`}>
          <div className={`flex items-center gap-3 border px-3 py-1.5 rounded-2xl shadow-lg transition-colors duration-300 ${currentTheme.footerBar}`}>
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl disabled:opacity-30 transition-all ${currentTheme.prevBtn}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <span className="text-xs font-mono font-medium px-2">
              Página <strong className={`font-bold ${currentTheme.pageHighlight}`}>{currentPage}</strong> de{' '}
              <strong>{totalPages}</strong>
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-30 text-white transition-all shadow-sm"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
