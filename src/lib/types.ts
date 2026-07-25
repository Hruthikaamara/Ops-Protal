export type Role = 'admin' | 'sales' | 'warehouse' | 'accounts';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  phone: string;
  avatar_url: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  note: string;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_threshold: number;
  warehouse_location: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  reference: string;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  customer_business: string;
  total_quantity: number;
  total_amount: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  notes: string;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ChallanItem {
  id: string;
  challan_id: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export type Page =
  | 'dashboard'
  | 'customers'
  | 'customer-detail'
  | 'customer-add'
  | 'customer-edit'
  | 'inventory'
  | 'product-add'
  | 'product-edit'
  | 'stock-movements'
  | 'challans'
  | 'challan-add'
  | 'challan-detail'
  | 'accounts'
  | 'reports'
  | 'settings';
