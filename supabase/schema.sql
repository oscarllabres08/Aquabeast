-- Aquabeast WRS (Supabase/Postgres) schema
-- Run this in Supabase SQL Editor.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.user_role as enum ('customer', 'seller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_category as enum ('water', 'other');
exception when duplicate_object then null; end $$;

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  display_name text,
  phone text,
  address text,
  store_name text,
  store_code text,
  business_hours text,
  store_address text,
  store_logo_url text,
  expo_push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(user_id) on delete cascade,
  category public.product_category not null default 'water',
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  is_available boolean not null default true,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill/upgrade safety: ensure column exists on older DBs
alter table public.products
  add column if not exists category public.product_category not null default 'water';

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index if not exists products_seller_id_idx on public.products(seller_id);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(user_id) on delete restrict,
  seller_id uuid not null references public.profiles(user_id) on delete restrict,
  customer_name text not null,
  delivery_address text not null,
  landmark text,
  contact_number text not null,
  latitude double precision,
  longitude double precision,
  notes text,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists landmark text;
alter table public.orders add column if not exists latitude double precision;
alter table public.orders add column if not exists longitude double precision;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_seller_id_idx on public.orders(seller_id);
create index if not exists orders_status_idx on public.orders(status);

-- Order items (snapshot unit_price)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- Create profile row automatically for new auth users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(user_id, role, display_name)
  values (new.id, 'customer', coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Notifications (in-app inbox for seller/customer)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(user_id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  kind text not null, -- e.g. 'new_order' | 'order_status'
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_id_idx on public.notifications(recipient_id, created_at desc);
create index if not exists notifications_order_id_idx on public.notifications(order_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own"
on public.notifications for select
using (auth.uid() = recipient_id);

drop policy if exists "notifications delete own" on public.notifications;
create policy "notifications delete own"
on public.notifications for delete
using (auth.uid() = recipient_id);

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own"
on public.notifications for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

-- Create notification when customer places an order (seller inbox)
create or replace function public.notify_seller_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_item record;
  item_summary text;
begin
  select oi.product_name, oi.quantity
    into first_item
  from public.order_items oi
  where oi.order_id = new.id
  order by oi.created_at asc
  limit 1;

  if first_item.product_name is null then
    item_summary := 'New order received.';
  else
    item_summary := first_item.product_name || ' • Qty ' || first_item.quantity::text;
  end if;

  insert into public.notifications(recipient_id, order_id, kind, title, body, data)
  values (
    new.seller_id,
    new.id,
    'new_order',
    'New order',
    coalesce(new.customer_name, 'Customer') || ' placed an order. ' || item_summary,
    jsonb_build_object(
      'orderId', new.id,
      'customerName', new.customer_name,
      'firstItem', coalesce(first_item.product_name, null),
      'qty', coalesce(first_item.quantity, null)
    )
  );

  return new;
end;
$$;

drop trigger if exists orders_notify_seller_new_order on public.orders;
create trigger orders_notify_seller_new_order
after insert on public.orders
for each row execute function public.notify_seller_new_order();

-- Create notification when seller updates order status (customer inbox)
create or replace function public.notify_customer_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications(recipient_id, order_id, kind, title, body, data)
    values (
      new.customer_id,
      new.id,
      'order_status',
      'Order update',
      'Your order is now ' || replace(new.status::text, '_', ' ') || '.',
      jsonb_build_object(
        'orderId', new.id,
        'status', new.status::text
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_notify_customer_status on public.orders;
create trigger orders_notify_customer_status
after update of status on public.orders
for each row execute function public.notify_customer_order_status();

-- E-wallet accounts (seller-managed)
create table if not exists public.ewallet_accounts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(user_id) on delete cascade,
  provider text not null,
  account_name text,
  account_number text,
  qr_image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists ewallet_accounts_set_updated_at on public.ewallet_accounts;
create trigger ewallet_accounts_set_updated_at
before update on public.ewallet_accounts
for each row execute function public.set_updated_at();

create index if not exists ewallet_accounts_seller_id_idx on public.ewallet_accounts(seller_id);

alter table public.ewallet_accounts enable row level security;

-- Helpers
create or replace function public.is_seller(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = uid and p.role = 'seller'
  );
$$;

-- profiles policies
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "profiles public read sellers" on public.profiles;
create policy "profiles public read sellers"
on public.profiles for select
using (role = 'seller');

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- products policies (seller-only)
drop policy if exists "products public read available" on public.products;
create policy "products public read available"
on public.products for select
using (is_available = true);

drop policy if exists "products seller read own" on public.products;
create policy "products seller read own"
on public.products for select
using (auth.uid() = seller_id);

drop policy if exists "products seller insert" on public.products;
create policy "products seller insert"
on public.products for insert
with check (auth.uid() = seller_id and public.is_seller(auth.uid()));

drop policy if exists "products seller update" on public.products;
create policy "products seller update"
on public.products for update
using (auth.uid() = seller_id and public.is_seller(auth.uid()))
with check (auth.uid() = seller_id and public.is_seller(auth.uid()));

drop policy if exists "products seller delete" on public.products;
create policy "products seller delete"
on public.products for delete
using (auth.uid() = seller_id and public.is_seller(auth.uid()));

-- orders policies
drop policy if exists "orders customer read own" on public.orders;
create policy "orders customer read own"
on public.orders for select
using (auth.uid() = customer_id);

drop policy if exists "orders seller read own" on public.orders;
create policy "orders seller read own"
on public.orders for select
using (auth.uid() = seller_id and public.is_seller(auth.uid()));

drop policy if exists "orders customer insert own" on public.orders;
create policy "orders customer insert own"
on public.orders for insert
with check (
  auth.uid() = customer_id
);

drop policy if exists "orders seller update status" on public.orders;
create policy "orders seller update status"
on public.orders for update
using (auth.uid() = seller_id and public.is_seller(auth.uid()))
with check (auth.uid() = seller_id and public.is_seller(auth.uid()));

-- order_items policies
drop policy if exists "order_items customer read via order" on public.order_items;
create policy "order_items customer read via order"
on public.order_items for select
using (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);

drop policy if exists "order_items seller read via order" on public.order_items;
create policy "order_items seller read via order"
on public.order_items for select
using (
  exists (select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid())
);

drop policy if exists "order_items customer insert via order" on public.order_items;
create policy "order_items customer insert via order"
on public.order_items for insert
with check (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);

-- ewallet_accounts policies (seller-only)
drop policy if exists "ewallet_accounts seller read own" on public.ewallet_accounts;
create policy "ewallet_accounts seller read own"
on public.ewallet_accounts for select
using (auth.uid() = seller_id and public.is_seller(auth.uid()));

drop policy if exists "ewallet_accounts seller insert" on public.ewallet_accounts;
create policy "ewallet_accounts seller insert"
on public.ewallet_accounts for insert
with check (auth.uid() = seller_id and public.is_seller(auth.uid()));

drop policy if exists "ewallet_accounts seller update" on public.ewallet_accounts;
create policy "ewallet_accounts seller update"
on public.ewallet_accounts for update
using (auth.uid() = seller_id and public.is_seller(auth.uid()))
with check (auth.uid() = seller_id and public.is_seller(auth.uid()));

drop policy if exists "ewallet_accounts seller delete" on public.ewallet_accounts;
create policy "ewallet_accounts seller delete"
on public.ewallet_accounts for delete
using (auth.uid() = seller_id and public.is_seller(auth.uid()));

-- Notes:
-- - To make someone a seller, set their profile role to 'seller' in SQL editor:
--   update public.profiles set role='seller' where user_id = '<uuid>';
-- - Realtime: enable Realtime on tables in Supabase Dashboard if needed (Database -> Replication).

