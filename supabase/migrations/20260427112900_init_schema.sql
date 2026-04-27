begin;

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  business_name text not null,
  phone text not null unique,
  type text not null,
  city text,
  neighborhood text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  receives_price_table boolean not null default true,
  receives_promotions boolean not null default true,
  send_monday boolean not null default false,
  send_tuesday boolean not null default false,
  send_wednesday boolean not null default false,
  send_thursday boolean not null default false,
  send_friday boolean not null default false,
  send_saturday boolean not null default false,
  send_sunday boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  supplier text not null default 'Cruzeiro do Sul',
  default_unit text not null default 'kg',
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_price_tables (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  supplier text not null default 'Cruzeiro do Sul',
  raw_text text not null,
  status text not null default 'draft' check (status in ('draft', 'parsed', 'sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_price_table_items (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.daily_price_tables(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(12,2) not null check (price >= 0),
  unit text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('table', 'promotion')),
  title text not null,
  message_preview text not null,
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  audience_type text not null default 'manual' check (audience_type in ('today', 'all_active', 'type', 'manual')),
  image_url text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'read', 'replied', 'failed')),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  unique(campaign_id, client_id)
);

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  phone text not null,
  body text not null,
  media_url text,
  provider text not null check (provider in ('mock', 'meta')),
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'simulated_sent', 'sent', 'delivered', 'read', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.inbound_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  phone text not null,
  body text not null,
  provider_message_id text,
  campaign_id uuid references public.campaigns(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'replied', 'archived', 'converted_to_order')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  client_id uuid references public.clients(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  status text not null default 'verificar_estoque' check (status in ('novo', 'verificar_estoque', 'confirmado', 'sem_disponibilidade', 'cancelado')),
  notes text,
  campaign_id uuid references public.campaigns(id) on delete set null,
  inbound_message_id uuid references public.inbound_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at before update on public.clients
for each row execute function public.handle_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
for each row execute function public.handle_updated_at();

drop trigger if exists set_daily_price_tables_updated_at on public.daily_price_tables;
create trigger set_daily_price_tables_updated_at before update on public.daily_price_tables
for each row execute function public.handle_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
for each row execute function public.handle_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at before update on public.settings
for each row execute function public.handle_updated_at();

create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_clients_type on public.clients(type);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_daily_price_tables_date on public.daily_price_tables(date desc);
create index if not exists idx_campaigns_created_at on public.campaigns(created_at desc);
create index if not exists idx_campaign_recipients_campaign_id on public.campaign_recipients(campaign_id);
create index if not exists idx_outbound_messages_campaign_id on public.outbound_messages(campaign_id);
create index if not exists idx_inbound_messages_campaign_id on public.inbound_messages(campaign_id);
create index if not exists idx_orders_date on public.orders(date desc);

alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.daily_price_tables enable row level security;
alter table public.daily_price_table_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.outbound_messages enable row level security;
alter table public.inbound_messages enable row level security;
alter table public.orders enable row level security;
alter table public.settings enable row level security;

drop policy if exists "authenticated full access clients" on public.clients;
create policy "authenticated full access clients" on public.clients
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access products" on public.products;
create policy "authenticated full access products" on public.products
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access daily_price_tables" on public.daily_price_tables;
create policy "authenticated full access daily_price_tables" on public.daily_price_tables
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access daily_price_table_items" on public.daily_price_table_items;
create policy "authenticated full access daily_price_table_items" on public.daily_price_table_items
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access campaigns" on public.campaigns;
create policy "authenticated full access campaigns" on public.campaigns
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access campaign_recipients" on public.campaign_recipients;
create policy "authenticated full access campaign_recipients" on public.campaign_recipients
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access outbound_messages" on public.outbound_messages;
create policy "authenticated full access outbound_messages" on public.outbound_messages
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access inbound_messages" on public.inbound_messages;
create policy "authenticated full access inbound_messages" on public.inbound_messages
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access orders" on public.orders;
create policy "authenticated full access orders" on public.orders
for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access settings" on public.settings;
create policy "authenticated full access settings" on public.settings
for all to authenticated using (true) with check (true);

commit;
