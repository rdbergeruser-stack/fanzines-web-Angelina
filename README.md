# Angelina Fanzines - Tienda Digital y Lector Online de Fanzines

Plataforma autogestionable y segura para la publicación, venta, lectura online y distribución de fanzines independientes en formato PDF. Desarrollada con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (Auth, PostgreSQL DB y Storage privado) y desplegada en **Vercel**.

🌐 **Sitio en Producción:** [https://fanzines-angelina.vercel.app](https://fanzines-angelina.vercel.app)  
📦 **Repositorio:** [https://github.com/rdbergeruser-stack/fanzines-web-Angelina.git](https://github.com/rdbergeruser-stack/fanzines-web-Angelina.git)

---

## ✨ Características Principales

### 1. 📖 Lector Online Interactivo en Pantalla (HTML5 Canvas + PDF.js)
* **Lectura directa sin forzar descarga:** Los fanzines se renderizan página por página en pantalla mediante Canvas con el motor de Mozilla PDF.js.
* **Diseñado para celulares:** 
  * Soporte de **gestos táctiles (swipe)**: desliza con el dedo hacia la izquierda o derecha para pasar de página.
  * Toca los bordes de la pantalla para avanzar o retroceder.
  * Barra inferior flotante con navegación y contador: `Página X de Y`.
  * **Auto-ajuste:** Optimizado para pantallas móviles HD y Retina.
* **Marcador Automático (Recordar Última Página Leída):** El lector memoriza en el navegador (`localStorage`) la página exacta en la que se quedó el lector para cada fanzine. Al reabrirlo, un aviso flotante inteligente le ofrece continuar desde donde lo dejó o reiniciar desde la página 1.
* **Modos Visuales de Lectura (Noche / Sepia / Claro):** Barra de temas visuales en la cabecera para adaptar la experiencia a cualquier ambiente:
  * 🌙 **Noche (Dark):** Fondo oscuro mate para leer cómodamente en la oscuridad sin cansar la vista.
  * 📜 **Sepia:** Tonalidad papel clásico cálido (`#F4ECD8`) que emula la lectura física tradicional.
  * ☀️ **Claro:** Fondo luminoso y nítido para lectura diurna.
  * La preferencia de color se guarda automáticamente para todas las lecturas futuras.
* **Controles y Protección de Obra:** Botones de Zoom (+ / -), modo auto, pantalla completa y bloqueo de clic derecho. **Modalidad 100% lectura online:** se elimina la descarga directa del archivo PDF para proteger los derechos y autoría de Angelina, impidiendo la distribución no autorizada del archivo digital.

### 2. 🏷️ Ficha Editorial, Perfil de Autores y Categorías Dinámicas
* **Pestaña Dedicada "Autores" en el Panel de Administración:**
  * Vista centralizada para gestionar todos los autores/as y colaboradores.
  * Buscador en tiempo real de autores por nombre, Instagram o biografía.
  * Botón **"+ Registrar Nuevo Autor"** para dar de alta perfiles antes o después de subir sus obras.
  * Edición completa de fichas: Nombre, usuario de Instagram (con link directo), biografía o semblanza literaria, y carga de foto/avatar (subiendo archivo o indicando URL).
  * Si se renombra un autor, el sistema actualiza automáticamente todas sus obras publicadas.
* **Menú Desplegable de Autores al Crear o Editar Fanzines:**
  * Al subir un nuevo fanzine o editar uno existente, el campo *Autor / Autora* ofrece un selector desplegable (`<select>`) con todos los autores registrados en la plataforma.
  * Incluye la opción `➕ Escribir otro / Nuevo autor...` para ingresar un autor nuevo al instante sin salir del formulario.
  * Acceso directo con un clic a "Gestionar" para revisar perfiles.
* **Perfil / Ficha de Autor/a en 1 Toque en la Tienda Pública:**
  * Al hacer clic en el nombre de cualquier autor/a en las tarjetas del catálogo público, se abre una ventana modal con su perfil completo: avatar/foto, biografía editorial, enlace directo a su cuenta de Instagram y listado con portadas de todas sus obras publicadas en la tienda.
  * Incluye botón para filtrar instantáneamente el catálogo por ese autor/a.
* **Campos editoriales completos:**
  * **Autor / Autora:** Identifica a la creadora o coautores (ej. *"Angelina"*, *"Angelina & Martín"*).
  * **Género / Categoría Autodefinible:** Angelina puede escribir cualquier género nuevo al subir o editar una obra (ej. *"Crónica & Murga"*, *"Terror"*, *"Poesía"*, *"Historietas"*). El sistema lo memoriza dinámicamente sin necesidad de listas fijas o intervenciones técnicas.
  * **Sugerencias y Chips Rápidos:** Al crear o editar fanzines, el formulario ofrece autocompletado inteligente (`<datalist>`) y botones interactivos de 1 clic con todos los géneros ya existentes.
  * **Cantidad de Páginas:** Registro del número de páginas para que los lectores conozcan la extensión de la obra.
  * **N° de Edición o Año:** Permite documentar la tirada (ej. *"N° 1"*, *"Edición 2024"*).
* **Filtros en el Catálogo Público:** La página principal genera automáticamente barras de filtros por categoría y por autor para que los visitantes descubran y filtren las publicaciones con un solo toque.
* **Edición de Fanzines Existentes:** Botón de edición rápida con modal en el panel de control para actualizar títulos, autores, categorías, páginas, precios, portadas y descripciones en tiempo real.

### 3. 💰 Rendición de Cuentas, Métricas y Liquidación a Autores
* **Panel Financiero para Múltiples Autores:** La administradora centraliza los cobros y cuenta con un módulo dedicado a rendir cuentas a cada creador/a participante.
* **Métricas en Tiempo Real:**
  * **Total Recaudado ($):** Suma total de las ventas aprobadas.
  * **Ejemplares Vendidos:** Conteo exacto de copias habilitadas.
  * **Autores Activos** y **Fanzine Estrella** con mayor popularidad.
* **Liquidación por Autor en 1 Clic:**
  * Agrupación automática de todas las ventas por autor/a.
  * Detalle de cada obra vendida, precio unitario y subtotal recaudado.
  * **Botón "Copiar Rendición WhatsApp":** Genera un informe detallado listo para pegar en WhatsApp al autor con el resumen de sus ventas y el total exacto a transferirle.
  * **Botón "Abrir WhatsApp":** Abre WhatsApp Web directamente con el texto prearmado.
* **Filtros por Período:** Permite liquidar por *Todo el Historial*, *Este Mes*, *Mes Anterior* o un *Rango Personalizado* con fechas desde/hasta.
* **Ranking por Fanzines & Registro de Movimientos:** Visualización de ventas por publicación con barra de participación porcentual e historial cronológico detallado de cada comprador.
* **Exportación a CSV / Excel:** Botón para descargar una planilla completa con todas las transacciones del período.

### 4. 📱 Integración con WhatsApp y Agenda de Compradores
* **Agenda integrada:** Guarda el número de teléfono/WhatsApp en el perfil de cada usuario al crearlo o editarlo.
* **Auto-guardado inteligente:** Si la administradora escribe o corrige un número directamente en el modal de WhatsApp, se guarda automáticamente en la base de datos.
* **Formateo internacional automático:** Adapta cualquier formato ingresado (`11 2345-6789`, `011...`, `+54 9 11...`) al estándar internacional exigido por WhatsApp (`54911...`).
* **Mensajes en 1 clic:**
  * **Alta y Credenciales:** Saludo personalizado, usuario, clave temporal, enlace de inicio de sesión y aviso de cambio de contraseña.
  * **Fanzine Habilitado:** Aviso automático con el título del fanzine adquirido y enlace directo a su biblioteca personal.
* **Flujo "Aprobar y Avisar":** Al aprobar una compra en el panel de administración, se habilita el acceso y se abre WhatsApp listo para enviar con un solo clic.

### 5. 🔒 Onboarding Seguro y Protección de Acceso
* **Registro administrativo exclusivo:** Registro público cerrado; solo la administradora crea cuentas para compradores autorizados, evitando cuentas spam.
* **Primer ingreso con cambio obligatorio de contraseña:** Cada usuario nuevo recibe una clave temporal (ej. `123456`) y el flag `must_change_password`. En su primer inicio de sesión, el sistema lo redirige obligatoriamente a `/cambiar-clave` para crear su contraseña personal.
* **Gestión total de usuarios:** La administradora puede restablecer contraseñas, actualizar nombres, teléfonos o correos en cualquier momento.

### 6. 🛡️ Almacenamiento Privado y Seguridad de Archivos
* **Bucket Privado (`fanzines-private`):** Los archivos PDF completos nunca son accesibles mediante URLs públicas.
* **URLs Firmadas de 60 segundos:** Solo los usuarios autenticados con acceso aprobado o la administradora pueden solicitar enlaces de lectura temporales que expiran en un minuto.
* **Cabeceras HTTP de Lectura:** Se sirven con `Content-Disposition: inline` para alimentar exclusivamente el visor interactivo de la aplicación.

### 7. ⏰ Keep-Alive Cron Anti-Pausa de Supabase
* **Endpoint de ping:** `/api/ping` ejecuta una consulta liviana a la base de datos para mantenerla activa.
* **GitHub Actions Workflow:** Tarea automática en `.github/workflows/keep-alive.yml` que se ejecuta 4 veces al día (`0 */6 * * *`), garantizando que el proyecto de Supabase en el tier gratuito no entre en modo de reposo/pausa.

---

## 🏗️ Arquitectura y Tecnologías

* **Frontend & Backend:** Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
* **Visor PDF:** Mozilla PDF.js v3.11 alojado localmente en `/public/pdfjs/` para máxima velocidad e independencia de CDNs externos.
* **Base de Datos & Autenticación:** Supabase (PostgreSQL, Supabase Auth con confirmación automática y Row Level Security).
* **Almacenamiento:** Supabase Storage (`fanzines-covers` público para miniaturas, `fanzines-private` privado para PDFs).
* **Despliegue:** Vercel con integración continua (CI/CD) vinculada a la rama `main` de GitHub.

---

## 🗄️ Esquema de Base de Datos

El esquema se encuentra documentado en [`supabase-schema.sql`](./supabase-schema.sql) e incluye:

1. **`profiles`:**
   * `id` (UUID, referencia a `auth.users`)
   * `email` (TEXT)
   * `full_name` (TEXT)
   * `phone` (TEXT, número de WhatsApp para contacto)
   * `role` (`'admin'` | `'user'`)
   * `must_change_password` (BOOLEAN, para exigir cambio en primer login)
   * `created_at` (TIMESTAMP WITH TIME ZONE)
2. **`fanzines`:**
   * `id` (UUID)
   * `title` (TEXT)
   * `description` (TEXT)
   * `author` (TEXT, autor o autora de la obra)
   * `category` (TEXT, género o categoría autodefinible)
   * `pages_count` (INTEGER, cantidad total de páginas)
   * `edition_number` (TEXT, número de edición o año de publicación)
   * `price` (NUMERIC)
   * `cover_url` (TEXT)
   * `pdf_path` (TEXT, ruta en bucket privado)
   * `is_active` (BOOLEAN, visibilidad en catálogo)
   * `created_at` (TIMESTAMP WITH TIME ZONE)
3. **`user_access`:**
   * `user_id` (UUID)
   * `fanzine_id` (UUID)
   * `status` (`'pending'` | `'approved'` | `'rejected'`)
   * `notes` (TEXT)
   * `granted_at` (TIMESTAMP WITH TIME ZONE)
4. **`payment_notifications`:**
   * `user_id` (UUID)
   * `fanzine_id` (UUID)
   * `reference_code` (TEXT)
   * `status` (`'pending'` | `'approved'` | `'rejected'`)
   * `created_at` (TIMESTAMP WITH TIME ZONE)
5. **`authors`:**
   * `id` (UUID)
   * `name` (TEXT UNIQUE, nombre del autor/a coincidente con `fanzines.author`)
   * `bio` (TEXT, biografía o semblanza literaria)
   * `instagram` (TEXT, usuario de Instagram sin `@` para link directo)
   * `avatar_url` (TEXT, foto o ilustración de perfil)
   * `created_at` (TIMESTAMP WITH TIME ZONE)

---

## 🚀 Puesta en Marcha en Desarrollo Local

### Prerrequisitos
* Node.js v18+ o superior.
* Cuenta en Supabase.

### 1. Clonar e Instalar
```bash
git clone https://github.com/rdbergeruser-stack/fanzines-web-Angelina.git
cd "fanzines-web-Angelina"
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zahqoetdwonueuicufms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_NAME=Fanzines de Angelina
NEXT_PUBLIC_PAYMENT_INFO=Alias: angelina.fanzines | CBU: 0000003100010000000000 | Titular: Angelina
```

### 3. Ejecutar en Servidor Local
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Compilar para Producción
```bash
npm run build
npm run start
```

---

## 👩‍💼 Manual de Operación para la Administradora

1. **Acceso al Panel:** Iniciar sesión con la cuenta de administradora y acceder a `/admin`.
2. **Subir o Editar un Fanzine:** 
   * En la pestaña **Fanzines**, ingresar el título, autor/a, género/categoría (escribiendo uno nuevo o tocando un chip existente con un clic), cantidad de páginas, número de edición, precio, cargar el PDF y opcionalmente una imagen de portada.
   * Para modificar una publicación ya existente, hacer clic en el botón del lápiz (**Editar**) en cualquier tarjeta de la lista.
3. **Dar de alta un nuevo comprador:**
   * Ir a la pestaña **Gestión de Usuarios** -> botón **+ Crear Nuevo Usuario**.
   * Ingresar nombre, email/usuario, teléfono de WhatsApp y clave temporal.
   * El sistema creará la cuenta y abrirá el modal para enviar las credenciales por WhatsApp en 1 clic.
4. **Aprobar pagos y habilitar lecturas:**
   * En **Avisos de Pago**, revisar los comprobantes informados y presionar **Aprobar y Avisar**.
   * Se abrirá automáticamente WhatsApp con el mensaje pre-armado y el teléfono del cliente para confirmar la entrega del fanzine.
5. **Rendición de cuentas y liquidaciones a autores:**
   * En la pestaña **Rendición & Ventas**, seleccionar el período a liquidar (*Este Mes*, *Mes Anterior*, etc.).
   * Revisar el total recaudado por cada autor/a y sus obras.
   * Presionar **"Copiar Rendición WhatsApp"** o **"Abrir WhatsApp"** para enviar el desglose exacto a cada creador y rendirle su dinero.
   * Si es necesario, pulsar **"Exportar CSV"** para guardar el balance en Excel.
6. **Lectura por parte del cliente:**
   * El cliente entra a [https://fanzines-angelina.vercel.app/login](https://fanzines-angelina.vercel.app/login).
   * La primera vez ingresa su clave temporal y crea su contraseña propia.
   * En la sección **Mis Fanzines** puede presionar **"Abrir Lector Online"** para disfrutar el fanzine directamente en pantalla completa (en móvil o PC) sin descargar el archivo.
