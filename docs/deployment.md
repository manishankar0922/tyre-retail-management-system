# Deployment Guide

The TyreRetail Pro ERP is designed to be deployed on **Vercel** with a **Supabase** backend.

## 1. Supabase Setup
1. Create a new Supabase project.
2. Navigate to the SQL Editor.
3. You will need to create the required tables: `users`, `products`, `invoices`, `invoice_items`, `customers`, and `inventory_logs`.
4. Ensure you execute the hardening SQL:
```sql
ALTER TABLE public.products ADD CONSTRAINT products_stock_qty_check CHECK (stock_qty >= 0);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_no_key UNIQUE (invoice_no);
```

## 2. Environment Variables
In your Vercel project settings, add the following variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key.

*Note: No service role keys are exposed to the client. All operations rely on Row Level Security (RLS) if configured, or application-level proxy checks.*

## 3. Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Select the Next.js framework preset.
3. Deploy.

The Edge Middleware (`src/proxy.ts`) will automatically protect all `/owner` and `/accountant` routes in the production build.
