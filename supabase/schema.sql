-- Nexovant Exporters database schema. Run in Supabase Dashboard > SQL Editor.
-- Initial seed values are legacy examples. Run usd-retail-prices.sql after applying this schema to set indicative US retail prices in USD.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text not null default '',
  category text not null default 'General',
  price_per_kg numeric(12,2) not null check (price_per_kg >= 0),
  sale_price_per_kg numeric(12,2) null check (sale_price_per_kg is null or sale_price_per_kg >= 0),
  image_url text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  phone text not null default '',
  country text not null default '',
  address text not null default '',
  city text not null default '',
  postal_code text not null default '',
  notes text not null default '',
  items jsonb not null,
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(), product text not null, quantity numeric(12,2) not null,
  destination text not null, incoterm text not null, packaging text not null default '', timeline text not null default '',
  company text not null, contact_name text not null, email text not null, phone text not null default '',
  country text not null default '', notes text not null default '', status text not null default 'new', created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(), name text not null, email text not null,
  company text not null default '', country text not null default '', enquiry_type text not null default '',
  message text not null, status text not null default 'new', created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.quote_requests enable row level security;
alter table public.contact_messages enable row level security;
-- No public table policies are created. API functions use the server-only service role key.

insert into public.products (id,slug,name,description,category,price_per_kg,image_url,stock_quantity,is_active) values
('sesame','sesame-seeds','Sesame Seeds','Retail sesame seeds. Confirm current grade and availability.','Oil Seeds',780,'https://images.unsplash.com/photo-1599909533730-f9d7f5f6f4f2?auto=format&fit=crop&w=1200&q=85',0,true),
('cumin','cumin-seeds','Cumin Seeds','Retail cumin seeds. Confirm current grade and availability.','Spices',1450,'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85',0,true),
('mustard','mustard-seeds','Mustard Seeds','Retail mustard seeds. Confirm current grade and availability.','Oil Seeds',420,'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=1200&q=85',0,true),
('flax','flax-seeds','Flax Seeds','Retail flax seeds. Confirm current grade and availability.','Oil Seeds',950,'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=1200&q=85',0,true),
('chickpeas','chickpeas','Chickpeas','Retail chickpeas. Confirm current grade and availability.','Pulses',390,'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=1200&q=85',0,true),
('maize','yellow-maize','Yellow Maize','Retail yellow maize. Confirm current grade and availability.','Grains',180,'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=85',0,true),
('birdseed','bird-seed-mix','Bird Seed Mix','Retail bird seed mix. Confirm current composition and availability.','Bird Seeds',520,'https://images.unsplash.com/photo-1501706362039-c6e13d7e0b5b?auto=format&fit=crop&w=1200&q=85',0,true),
('rice','long-grain-rice','Long Grain Rice','Retail long grain rice. Confirm current grade and availability.','Grains',320,'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=85',0,true)
on conflict (id) do update set slug=excluded.slug,name=excluded.name,description=excluded.description,category=excluded.category,image_url=excluded.image_url,is_active=true;
-- The seed statement intentionally does not overwrite price_per_kg on repeat runs. Set approved prices manually.
