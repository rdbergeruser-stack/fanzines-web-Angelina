-- ==========================================================
-- ESQUEMA COMPLETO PARA EL SITIO DE FANZINES DE ANGELINA
-- Copia y pega todo este código en el "SQL Editor" de Supabase
-- y presiona RUN.
-- ==========================================================

-- 1. Tabla de Perfiles (profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en profiles
alter table public.profiles enable row level security;

-- Función de ayuda para saber si el usuario actual es Admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Políticas de seguridad para profiles
drop policy if exists "Los usuarios pueden ver su propio perfil" on public.profiles;
create policy "Los usuarios pueden ver su propio perfil"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Los administradores pueden modificar perfiles" on public.profiles;
create policy "Los administradores pueden modificar perfiles"
  on public.profiles for update
  using (public.is_admin());

-- Trigger para crear perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first boolean;
begin
  -- Si es el primer usuario que se registra, se vuelve admin automáticamente
  select not exists (select 1 from public.profiles) into is_first;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when is_first then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Tabla de Fanzines (fanzines)
create table if not exists public.fanzines (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric(10,2) default 0,
  cover_url text,
  pdf_path text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en fanzines
alter table public.fanzines enable row level security;

drop policy if exists "Cualquiera puede ver fanzines activos" on public.fanzines;
create policy "Cualquiera puede ver fanzines activos"
  on public.fanzines for select
  using (is_active = true or public.is_admin());

drop policy if exists "Solo administradores pueden insertar fanzines" on public.fanzines;
create policy "Solo administradores pueden insertar fanzines"
  on public.fanzines for insert
  with check (public.is_admin());

drop policy if exists "Solo administradores pueden actualizar fanzines" on public.fanzines;
create policy "Solo administradores pueden actualizar fanzines"
  on public.fanzines for update
  using (public.is_admin());

drop policy if exists "Solo administradores pueden eliminar fanzines" on public.fanzines;
create policy "Solo administradores pueden eliminar fanzines"
  on public.fanzines for delete
  using (public.is_admin());


-- 3. Tabla de Accesos / Habilitaciones de Usuarios (user_access)
create table if not exists public.user_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  fanzine_id uuid references public.fanzines(id) on delete cascade not null,
  status text default 'approved' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  granted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, fanzine_id)
);

-- Habilitar RLS en user_access
alter table public.user_access enable row level security;

drop policy if exists "Los usuarios pueden ver sus propios accesos" on public.user_access;
create policy "Los usuarios pueden ver sus propios accesos"
  on public.user_access for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Solo administradores gestionan accesos" on public.user_access;
create policy "Solo administradores gestionan accesos"
  on public.user_access for all
  using (public.is_admin());


-- 4. Notificaciones de Pago (payment_notifications)
create table if not exists public.payment_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  fanzine_id uuid references public.fanzines(id) on delete cascade not null,
  reference_code text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en payment_notifications
alter table public.payment_notifications enable row level security;

drop policy if exists "Usuarios ven sus notificaciones de pago" on public.payment_notifications;
create policy "Usuarios ven sus notificaciones de pago"
  on public.payment_notifications for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Usuarios autenticados pueden crear notificaciones de pago" on public.payment_notifications;
create policy "Usuarios autenticados pueden crear notificaciones de pago"
  on public.payment_notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Solo administradores actualizan notificaciones de pago" on public.payment_notifications;
create policy "Solo administradores actualizan notificaciones de pago"
  on public.payment_notifications for update
  using (public.is_admin());


-- 5. Políticas de Almacenamiento (Storage)
-- Portadas: Públicas para ver, solo Admin puede subir
drop policy if exists "Portadas públicas para todos" on storage.objects;
create policy "Portadas públicas para todos"
  on storage.objects for select
  using (bucket_id = 'fanzines-covers');

drop policy if exists "Admin puede subir portadas" on storage.objects;
create policy "Admin puede subir portadas"
  on storage.objects for insert
  with check (bucket_id = 'fanzines-covers' and (public.is_admin() or auth.role() = 'service_role'));

drop policy if exists "Admin puede eliminar portadas" on storage.objects;
create policy "Admin puede eliminar portadas"
  on storage.objects for delete
  using (bucket_id = 'fanzines-covers' and (public.is_admin() or auth.role() = 'service_role'));

-- Archivos PDFs privados:
drop policy if exists "Admin puede subir PDFs privados" on storage.objects;
create policy "Admin puede subir PDFs privados"
  on storage.objects for insert
  with check (bucket_id = 'fanzines-private' and (public.is_admin() or auth.role() = 'service_role'));

drop policy if exists "Admin puede eliminar PDFs privados" on storage.objects;
create policy "Admin puede eliminar PDFs privados"
  on storage.objects for delete
  using (bucket_id = 'fanzines-private' and (public.is_admin() or auth.role() = 'service_role'));

drop policy if exists "Usuarios habilitados pueden descargar su PDF" on storage.objects;
create policy "Usuarios habilitados pueden descargar su PDF"
  on storage.objects for select
  using (
    bucket_id = 'fanzines-private'
    and (
      public.is_admin()
      or auth.role() = 'service_role'
      or exists (
        select 1 from public.user_access ua
        join public.fanzines f on f.id = ua.fanzine_id
        where ua.user_id = auth.uid()
          and ua.status = 'approved'
          and f.pdf_path = storage.objects.name
      )
    )
  );
