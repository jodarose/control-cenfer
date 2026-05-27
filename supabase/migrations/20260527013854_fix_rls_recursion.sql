-- Fix: prevent infinite RLS recursion on profiles policies that consult profiles.
-- Solution: mark current_user_role() as security definer so it bypasses RLS,
-- and rewrite policies to use the function instead of subqueries.

drop policy if exists "profiles_select_self_or_admin" on profiles;
drop policy if exists "profiles_update_self_or_admin" on profiles;
drop policy if exists "profiles_insert_self" on profiles;

drop function if exists current_user_role();

create or replace function current_user_role()
returns role
language sql
stable
security definer
set search_path = public
as $$
  select rol from profiles where id = auth.uid();
$$;

create policy "profiles_select_self_or_admin"
  on profiles for select
  using (
    auth.uid() = id
    or current_user_role() = 'super_admin'
  );

create policy "profiles_insert_self"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self_or_admin"
  on profiles for update
  using (
    auth.uid() = id
    or current_user_role() = 'super_admin'
  );
