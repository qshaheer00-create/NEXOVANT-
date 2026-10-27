-- Run once in Supabase Dashboard > SQL Editor.
-- Enables an optional sale price per kilogram. A NULL sale price means no discount.
alter table public.products add column if not exists sale_price_per_kg numeric(12,2) null;
alter table public.products drop constraint if exists products_sale_price_per_kg_check;
alter table public.products add constraint products_sale_price_per_kg_check check (sale_price_per_kg is null or sale_price_per_kg >= 0);
alter table public.products add column if not exists updated_at timestamptz not null default now();
