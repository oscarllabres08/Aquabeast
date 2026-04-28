# Aquabeast WRS

Water Refilling Station system:
- **Seller app**: Expo Go **SDK 55** (bottom tabs, realtime orders, product CRUD, push notifications-ready)
- **Customer website**: Mobile-first web (bottom navigation: Home / Order / Profile → My Orders)
- **Backend**: Supabase (Postgres + Auth + Realtime)

## 1) Supabase setup

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql` (Supabase Dashboard → SQL Editor).
3. Enable Realtime for tables (Dashboard → Database → Replication):
   - `public.orders`
   - `public.order_items`
   - `public.products`
   - `public.ewallet_accounts`

### Storage bucket (for logos + QR images)

Create a public bucket named **`wrs-assets`** in Supabase Storage (Dashboard → Storage).

- Used by seller app for:
  - Store logo uploads
  - E-wallet QR uploads

### Make your account a seller

After you register (creates a `profiles` row), set your role:

```sql
update public.profiles set role = 'seller' where user_id = '<YOUR_AUTH_UID>';
```

## 2) Customer website (mobile-first)

1. Copy env file:
   - `customer-web/.env.local.example` → `customer-web/.env.local`
2. Fill:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run:

```bash
cd customer-web
npm run dev
```

## 3) Seller app (Expo SDK 55)

You will add:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Run:

```bash
cd seller-app
npm run start
```

