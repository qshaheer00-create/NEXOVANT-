-- Nexovant retail USD pricing migration (run in Supabase SQL Editor)
-- Indicative US retail benchmark prices per kg. Confirm pricing before taking payment.
update public.products set price_per_kg = case id
  when 'sesame' then 11.00
  when 'cumin' then 23.13
  when 'mustard' then 11.00
  when 'flax' then 12.76
  when 'chickpeas' then 6.59
  when 'maize' then 4.99
  when 'birdseed' then 8.80
  when 'rice' then 4.40
  else price_per_kg
end, updated_at = now()
where id in ('sesame','cumin','mustard','flax','chickpeas','maize','birdseed','rice');

alter table public.orders alter column currency set default 'USD';
-- Existing historical orders are intentionally not rewritten.
