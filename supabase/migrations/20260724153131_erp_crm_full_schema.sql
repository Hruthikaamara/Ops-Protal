/*
# Mini ERP + CRM Full Schema
Creates all tables: profiles, customers, customer_notes, products, stock_movements, challans, challan_items.
RLS enabled with anon+authenticated access (internal multi-role app, no per-user isolation).
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'sales' CHECK (role IN ('admin','sales','warehouse','accounts')),
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  email text DEFAULT '',
  business_name text DEFAULT '',
  gst_number text DEFAULT '',
  customer_type text NOT NULL DEFAULT 'Retail' CHECK (customer_type IN ('Retail','Wholesale','Distributor')),
  address text DEFAULT '',
  status text NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead','Active','Inactive')),
  follow_up_date date,
  notes text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_select" ON customers;
CREATE POLICY "customers_select" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "customers_insert" ON customers;
CREATE POLICY "customers_insert" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "customers_update" ON customers;
CREATE POLICY "customers_update" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "customers_delete" ON customers;
CREATE POLICY "customers_delete" ON customers FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_by_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_notes_select" ON customer_notes;
CREATE POLICY "customer_notes_select" ON customer_notes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "customer_notes_insert" ON customer_notes;
CREATE POLICY "customer_notes_insert" ON customer_notes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "customer_notes_update" ON customer_notes;
CREATE POLICY "customer_notes_update" ON customer_notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "customer_notes_delete" ON customer_notes;
CREATE POLICY "customer_notes_delete" ON customer_notes FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  category text DEFAULT 'General',
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  current_stock integer NOT NULL DEFAULT 0,
  min_stock_threshold integer NOT NULL DEFAULT 10,
  warehouse_location text DEFAULT 'Main Warehouse',
  description text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL DEFAULT '',
  quantity integer NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('IN','OUT')),
  reason text DEFAULT '',
  reference text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_by_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_movements_select" ON stock_movements;
CREATE POLICY "stock_movements_select" ON stock_movements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "stock_movements_insert" ON stock_movements;
CREATE POLICY "stock_movements_insert" ON stock_movements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "stock_movements_update" ON stock_movements;
CREATE POLICY "stock_movements_update" ON stock_movements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "stock_movements_delete" ON stock_movements;
CREATE POLICY "stock_movements_delete" ON stock_movements FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL DEFAULT '',
  customer_mobile text DEFAULT '',
  customer_business text DEFAULT '',
  total_quantity integer NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Confirmed','Cancelled')),
  notes text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_by_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE challans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "challans_select" ON challans;
CREATE POLICY "challans_select" ON challans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "challans_insert" ON challans;
CREATE POLICY "challans_insert" ON challans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "challans_update" ON challans;
CREATE POLICY "challans_update" ON challans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "challans_delete" ON challans;
CREATE POLICY "challans_delete" ON challans FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS challan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id uuid NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  sku text NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE challan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "challan_items_select" ON challan_items;
CREATE POLICY "challan_items_select" ON challan_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "challan_items_insert" ON challan_items;
CREATE POLICY "challan_items_insert" ON challan_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "challan_items_update" ON challan_items;
CREATE POLICY "challan_items_update" ON challan_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "challan_items_delete" ON challan_items;
CREATE POLICY "challan_items_delete" ON challan_items FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_challans_status ON challans(status);
CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON challan_items(challan_id);
