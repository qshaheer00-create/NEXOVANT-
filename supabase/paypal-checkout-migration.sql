-- Run once in Supabase Dashboard > SQL Editor before deploying PayPal checkout.
-- Adds ownership and PayPal transaction references to the existing orders table.
alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists payment_provider text,
  add column if not exists payment_status text;

create unique index if not exists orders_paypal_order_id_uidx
  on public.orders(paypal_order_id) where paypal_order_id is not null;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','confirmed','processing','shipped','completed','cancelled'));

-- PayPal payment completion sets status='confirmed'; no new status value is required.
