-- Bougsk backend — multiple admin accounts, with one super-admin.
-- Exactly one admin (flagged is_super_admin) may add or remove other
-- admins; every admin, super or not, may change only their own password
-- (handled entirely by Supabase Auth's own updateUser call — no schema
-- change needed for that part). Adding/removing an admin still requires
-- creating/deleting a real auth.users row, which needs the service role
-- key — that stays in a new Edge Function (manage-admins), never done
-- directly from the client, matching every other privileged write in
-- this backend.

alter table admins
  add column is_super_admin boolean not null default false,
  add column created_at timestamptz not null default now();

comment on column admins.is_super_admin is
  'Exactly one row should be true. Only this admin may add or remove other admins.';

-- ---------------------------------------------------------------------
-- Helper, mirroring is_admin() (migration 0002) exactly.
-- ---------------------------------------------------------------------
create function is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where id = auth.uid() and is_super_admin = true);
$$;

-- ---------------------------------------------------------------------
-- RLS — additive alongside "admin can read own row" (migration 0002):
-- Postgres OR's permissive SELECT policies together, so this only ever
-- adds visibility for the super-admin, never removes the existing
-- self-read for everyone else. Still no INSERT/UPDATE/DELETE policy for
-- anyone — every write goes through manage-admins with the service role,
-- same as the rest of this backend's privileged-write pattern.
-- ---------------------------------------------------------------------
create policy "super admin can read all admins"
  on admins for select
  to authenticated
  using (is_super_admin());
