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
  phone text,
  role text default 'user' check (role in ('admin', 'user')),
  must_change_password boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Función para verificar si un usuario es admin
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
  using (auth.uid() = id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Los administradores pueden modificar perfiles" on public.profiles;
create policy "Los administradores pueden modificar perfiles"
  on public.profiles for all
  using (public.is_admin() or auth.role() = 'service_role');

-- Trigger para crear perfil automáticamente
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case 
      when is_first or new.email ilike '%angelina%' then 'admin' 
      else 'user' 
    end
  )
  on conflict (id) do update set role = case when new.email ilike '%angelina%' then 'admin' else profiles.role end;
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
  author text,
  category text,
  pages_count integer,
  edition_number text,
  cover_url text,
  pdf_path text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.fanzines enable row level security;

drop policy if exists "Cualquiera puede ver fanzines activos" on public.fanzines;
create policy "Cualquiera puede ver fanzines activos"
  on public.fanzines for select
  using (is_active = true or public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Admin gestiona fanzines" on public.fanzines;
create policy "Admin gestiona fanzines"
  on public.fanzines for all
  using (public.is_admin() or auth.role() = 'service_role');


-- 3. Tabla de Accesos / Habilitaciones (user_access)
create table if not exists public.user_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  fanzine_id uuid references public.fanzines(id) on delete cascade not null,
  status text default 'approved' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  granted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, fanzine_id)
);

alter table public.user_access enable row level security;

drop policy if exists "Los usuarios pueden ver sus propios accesos" on public.user_access;
create policy "Los usuarios pueden ver sus propios accesos"
  on public.user_access for select
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Solo administradores gestionan accesos" on public.user_access;
create policy "Solo administradores gestionan accesos"
  on public.user_access for all
  using (public.is_admin() or auth.role() = 'service_role');


-- 4. Notificaciones de Pago (payment_notifications)
create table if not exists public.payment_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  fanzine_id uuid references public.fanzines(id) on delete cascade not null,
  reference_code text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payment_notifications enable row level security;

drop policy if exists "Usuarios ven sus notificaciones de pago" on public.payment_notifications;
create policy "Usuarios ven sus notificaciones de pago"
  on public.payment_notifications for select
  using (auth.uid() = user_id or public.is_admin() or auth.role() = 'service_role');

drop policy if exists "Usuarios autenticados pueden crear notificaciones" on public.payment_notifications;
create policy "Usuarios autenticados pueden crear notificaciones"
  on public.payment_notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admin gestiona notificaciones" on public.payment_notifications;
create policy "Admin gestiona notificaciones"
  on public.payment_notifications for all
  using (public.is_admin() or auth.role() = 'service_role');


-- 5. Tabla de Autores (authors - Ficha y Perfil público)
create table if not exists public.authors (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  bio text,
  instagram text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.authors enable row level security;

drop policy if exists "Cualquiera puede ver autores" on public.authors;
create policy "Cualquiera puede ver autores"
  on public.authors for select
  using (true);

drop policy if exists "Admin gestiona autores" on public.authors;
create policy "Admin gestiona autores"
  on public.authors for all
  using (public.is_admin() or auth.role() = 'service_role');

-- 6. Vincular a Angelina si ya existe en auth.users
insert into public.profiles (id, email, full_name, role)
select id, email, coalesce(raw_user_meta_data->>'full_name', 'Angelina'), 'admin'
from auth.users
where email ilike '%angelina%'
on conflict (id) do update set role = 'admin';


-- 6. PERMISOS CRUCIALES (Para que la API de Supabase pueda leer y escribir las tablas sin error)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
