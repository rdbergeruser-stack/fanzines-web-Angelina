# Angelina Fanzines - Tienda Digital de Fanzines en PDF

Sitio web autogestionable para la publicación, venta manual y descarga segura de fanzines en formato PDF. Desarrollado con **Next.js (App Router)**, **Tailwind CSS**, **Supabase** (Auth, Database y Storage con buckets privados) y listo para desplegar en **Vercel**.

---

## 🚀 Características Principales

1. **Seguridad Total de Archivos (PDFs Privados):**
   * Los PDFs se almacenan en un bucket privado de Supabase (`fanzines-private`).
   * No existen URLs públicas de los archivos completos.
   * La descarga se realiza mediante **URLs firmadas temporales de 60 segundos**, accesibles únicamente por usuarios que tengan el acceso aprobado en la base de datos o por la administradora.

2. **Catálogo y Compra por Transferencia:**
   * Catálogo de fanzines con portadas, descripciones y precios.
   * Visualización del CBU/Alias bancario para realizar la transferencia.
   * Botón para que el comprador notifique su pago y deje un comprobante/referencia.

3. **Zona de Clientes ("Mis Fanzines"):**
   * Los compradores registrados ven sus publicaciones adquiridas.
   * Botón de descarga directa del PDF.
   * Estado de pagos en revisión.

4. **Panel de Control de la Administradora (`/admin`):**
   * **Subir Fanzine:** Carga el PDF original, la foto de portada, título, descripción y precio.
   * **Avisos de Pago:** Listado de transferencias informadas por clientes con botón de aprobación en 1 clic.
   * **Gestión de Usuarios y Accesos:** Buscador de usuarios registrados para habilitar o revocar fanzines con un solo botón.

---

## 🛠️ Paso 1: Configurar la Base de Datos en Supabase (Solo una vez)

1. Ingresa a tu proyecto en [Supabase](https://supabase.com).
2. Ve al menú lateral izquierdo y entra en **SQL Editor**.
3. Haz clic en **New query** (Nueva consulta).
4. Abre el archivo [`supabase-schema.sql`](./supabase-schema.sql), copia todo su contenido, pégalo en el editor y presiona **Run**.
5. ¡Listo! Este script crea automáticamente las tablas (`profiles`, `fanzines`, `user_access`, `payment_notifications`), los triggers de nuevos usuarios y las políticas de seguridad (RLS).
*(Nota: Los buckets de almacenamiento `fanzines-covers` y `fanzines-private` ya fueron creados e inicializados).*

---

## 🌐 Paso 2: Despliegue en Vercel

1. Ingresa a [Vercel](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona tu repositorio `fanzines-web-Angelina` y haz clic en **Import**.
4. En la sección **Environment Variables**, añade las siguientes variables:
   * `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de Supabase (`https://zahqoetdwonueuicufms.supabase.co`)
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase
   * `SUPABASE_SERVICE_ROLE_KEY`: Tu clave service_role de Supabase
   * `NEXT_PUBLIC_SITE_NAME`: `Fanzines de Angelina`
   * `NEXT_PUBLIC_PAYMENT_INFO`: `Alias: tu.alias.aqui | CBU: 0000000000000000000000 | Titular: Tu Nombre`
5. Haz clic en **Deploy**. ¡Vercel compilará y publicará la web automáticamente!

---

## 🔑 Cómo ser Administradora

El script SQL está configurado para que **el primer usuario registrado en la web adquiera automáticamente el rol de Administrador (`admin`)**.

Si tu compañera se registra primero, tendrá acceso inmediato al **Panel Admin** en la barra de navegación.

Si necesitas hacer admin a otro usuario manualmente, en Supabase ve a **Table Editor** -> tabla `profiles`, busca su email y cambia el campo `role` de `'user'` a `'admin'`.

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
