-- Associates a marketplace product with the terminals where it can be collected.
-- A product can be available at multiple terminals; a terminal can hold many products.
create table if not exists public.product_terminals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products (id) on delete cascade,
  terminal_id uuid not null references public.marketplace_terminals (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, terminal_id)
);

create index if not exists product_terminals_product_idx on public.product_terminals (product_id);
create index if not exists product_terminals_terminal_idx on public.product_terminals (terminal_id);

alter table public.product_terminals enable row level security;

-- Anyone authenticated can read which terminals stock a product (buyers need this at checkout).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'product_terminals' and policyname = 'product_terminals_select_all'
  ) then
    create policy product_terminals_select_all
      on public.product_terminals for select
      using (true);
  end if;
end $$;

-- The product's seller, or any approver (gcm/admin), can manage its terminal associations.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'product_terminals' and policyname = 'product_terminals_write_owner'
  ) then
    create policy product_terminals_write_owner
      on public.product_terminals for all
      using (
        exists (
          select 1 from public.marketplace_products p
          where p.id = product_terminals.product_id and p.seller_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('gcm', 'admin')
        )
      )
      with check (
        exists (
          select 1 from public.marketplace_products p
          where p.id = product_terminals.product_id and p.seller_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('gcm', 'admin')
        )
      );
  end if;
end $$;
