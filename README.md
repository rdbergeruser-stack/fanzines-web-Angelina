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
* **Controles y Protección de Obra:** Botones de Zoom (+ / -), modo auto, pantalla completa y bloqueo de clic derecho. **Modalidad 100% lectura online:** se elimina la descarga directa del archivo PDF para proteger los derechos y autoría de Angelina, impidiendo la distribución no autorizada del archivo digital.

### 2. 📱 Integración con WhatsApp y Agenda de Compradores
* **Agenda integrada:** Guarda el número de teléfono/WhatsApp en el perfil de cada usuario al crearlo o editarlo.
* **Auto-guardado inteligente:** Si la administradora escribe o corrige un número directamente en el modal de WhatsApp, se guarda automáticamente en la base de datos.
* **Formateo internacional automático:** Adapta cualquier formato ingresado (`11 2345-6789`, `011...`, `+54 9 11...`) al estándar internacional exigido por WhatsApp (`54911...`).
* **Mensajes en 1 clic:**
  * **Alta y Credenciales:** Saludo personalizado, usuario, clave temporal, enlace de inicio de sesión y aviso de cambio de contraseña.
  * **Fanzine Habilitado:** Aviso automático con el título del fanzine adquirido y enlace directo a su biblioteca personal.
* **Flujo "Aprobar y Avisar":** Al aprobar una compra en el panel de administración, se habilita el acceso y se abre WhatsApp listo para enviar con un solo clic.

### 3. 🔒 Onboarding Seguro y Protección de Acceso
* **Registro administrativo exclusivo:** Registro público cerrado; solo la administradora crea cuentas para compradores autorizados, evitando cuentas spam.
* **Primer ingreso con cambio obligatorio de contraseña:** Cada usuario nuevo recibe una clave temporal (ej. `123456`) y el flag `must_change_password`. En su primer inicio de sesión, el sistema lo redirige obligatoriamente a `/cambiar-clave` para crear su contraseña personal.
* **Gestión total de usuarios:** La administradora puede restablecer contraseñas, actualizar nombres, teléfonos o correos en cualquier momento.

### 4. 🛡️ Almacenamiento Privado y Seguridad de Archivos
* **Bucket Privado (`fanzines-private`):** Los archivos PDF completos nunca son accesibles mediante URLs públicas.
* **URLs Firmadas de 60 segundos:** Solo los usuarios autenticados con acceso aprobado o la administradora pueden solicitar enlaces de lectura temporales que expiran en un minuto.
* **Cabeceras HTTP de Lectura:** Se sirven con `Content-Disposition: inline` para alimentar exclusivamente el visor interactivo de la aplicación.

### 5. ⏰ Keep-Alive Cron Anti-Pausa de Supabase
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
2. **Subir un Fanzine:** En la pestaña **Fanzines**, ingresar título, descripción, precio, cargar el PDF y opcionalmente una imagen de portada.
3. **Dar de alta un nuevo comprador:**
   * Ir a la pestaña **Gestión de Usuarios** -> botón **+ Crear Nuevo Usuario**.
   * Ingresar nombre, email/usuario, teléfono de WhatsApp y clave temporal.
   * El sistema creará la cuenta y abrirá el modal para enviar las credenciales por WhatsApp en 1 clic.
4. **Aprobar pagos y habilitar lecturas:**
   * En **Transferencias Recibidas**, revisar los pagos informados y presionar **Aprobar y Avisar**.
   * Se abrirá automáticamente WhatsApp con el mensaje pre-armado y el teléfono del cliente para confirmar la entrega del fanzine.
5. **Lectura por parte del cliente:**
   * El cliente entra a [https://fanzines-angelina.vercel.app/login](https://fanzines-angelina.vercel.app/login).
   * La primera vez ingresa su clave temporal y crea su contraseña propia.
   * En la sección **Mis Fanzines** puede presionar **"Abrir Lector Online"** para disfrutar el fanzine directamente en pantalla completa (en móvil o PC) sin descargar el archivo.
