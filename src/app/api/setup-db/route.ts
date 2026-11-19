import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key !== 'fanzines2026') {
    return NextResponse.json({ error: 'Clave no válida' }, { status: 401 });
  }

  const client = new Client({
    user: 'postgres',
    password: '&4inG,2_M3ip4qk',
    host: 'db.zahqoetdwonueuicufms.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();

    const sql = `
      -- 1. Tabla de Perfiles
      create table if not exists public.profiles (
        id uuid references auth.users on delete cascade primary key,
        email text not null,
        full_name text,
        role text default 'user' check (role in ('admin', 'user')),
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
      );

      alter table public.profiles enable row level security;

      create or replace function public.is_admin()
      returns boolean as $$
      begin
        return exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        );
      end;
      $$ language plpgsql security definer;

      drop policy if exists "Los usuarios pueden ver su propio perfil" on public.profiles;
      create policy "Los usuarios pueden ver su propio perfil"
        on public.profiles for select
        using (auth.uid() = id or public.is_admin() or auth.role() = 'service_role');

      drop policy if exists "Los administradores pueden modificar perfiles" on public.profiles;
      create policy "Los administradores pueden modificar perfiles"
        on public.profiles for all
        using (public.is_admin() or auth.role() = 'service_role');

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

      -- 2. Tabla de Fanzines
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

      alter table public.fanzines enable row level security;

      drop policy if exists "Cualquiera puede ver fanzines activos" on public.fanzines;
      create policy "Cualquiera puede ver fanzines activos"
        on public.fanzines for select
        using (is_active = true or public.is_admin() or auth.role() = 'service_role');

      drop policy if exists "Admin gestiona fanzines" on public.fanzines;
      create policy "Admin gestiona fanzines"
        on public.fanzines for all
        using (public.is_admin() or auth.role() = 'service_role');

      -- 3. Tabla de Accesos
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

      -- 4. Notificaciones de Pago
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

      -- 5. Vincular a Angelina como admin
      insert into public.profiles (id, email, full_name, role)
      select id, email, coalesce(raw_user_meta_data->>'full_name', 'Angelina'), 'admin'
      from auth.users
      where email ilike '%angelina%'
      on conflict (id) do update set role = 'admin';

      -- 6. PERMISOS COMPLETOS A TODAS LAS TABLAS
      grant usage on schema public to anon, authenticated, service_role;
      grant all on all tables in schema public to anon, authenticated, service_role;
      grant all on all sequences in schema public to anon, authenticated, service_role;
      grant all on all routines in schema public to anon, authenticated, service_role;

      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
      alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
    `;

    await client.query(sql);

    const { rows: profiles } = await client.query('SELECT * FROM public.profiles');
    await client.end();

    return NextResponse.json({
      success: true,
      message: '¡Base de datos y permisos configurados exitosamente en Supabase!',
      profiles,
    });
  } catch (error: any) {
    console.error('Error configurando DB:', error);
    try { await client.end(); } catch {}
    return NextResponse.json(
      { error: error.message || 'Error al ejecutar SQL' },
      { status: 500 }
    );
  }
}
