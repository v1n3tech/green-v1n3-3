-- Seed an admin-editable platform default delivery fee.
-- Delivery is always offered via logistics; when a seller has not set a
-- per-listing delivery fee, this platform default is charged instead.

-- 1. Seed / update the default delivery fee (NGN). Idempotent.
insert into public.platform_config (key, value, description, updated_at)
values (
  'default_delivery_fee_ngn',
  '1500'::jsonb,
  'Fallback delivery fee (NGN) charged when a marketplace listing has no seller-set delivery fee.',
  now()
)
on conflict (key) do update
set description = excluded.description,
    updated_at = now();

-- 2. Allow admins to edit platform_config (table already has select-all).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'platform_config'
      and policyname = 'platform_config_write_admin'
  ) then
    create policy platform_config_write_admin
      on public.platform_config
      for all
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end $$;
