-- Run in Supabase Dashboard > SQL Editor after reviewing.
-- Public registration may create retail or B2B profiles only; users cannot set themselves as admin.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  company text not null default '',
  phone text not null default '',
  account_type text not null default 'retail' check (account_type in ('retail','b2b','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can insert own retail or b2b profile" on public.profiles;
create policy "Users can insert own retail or b2b profile" on public.profiles for insert to authenticated with check (auth.uid() = id and account_type in ('retail','b2b'));
drop policy if exists "Users can update own non-admin profile" on public.profiles;
create policy "Users can update own non-admin profile" on public.profiles for update to authenticated using (auth.uid() = id and account_type in ('retail','b2b')) with check (auth.uid() = id and account_type in ('retail','b2b'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, company, phone, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'company',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    case when new.raw_user_meta_data->>'account_type' = 'b2b' then 'b2b' else 'retail' end
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute procedure public.handle_new_user();
