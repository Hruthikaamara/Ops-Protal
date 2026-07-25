/**
 * Seed script — populates demo data for the Express backend.
 * Run with: npm run seed
 *
 * Creates demo users (with hashed passwords), customers, and products
 * so the API has data to serve on first run.
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { query } from './config/database.js';

dotenv.config();

const demoUsers = [
  { email: 'admin@opsportal.demo',     password: 'demo1234', full_name: 'Admin User',      role: 'admin' },
  { email: 'sales@opsportal.demo',     password: 'demo1234', full_name: 'Sales Person',     role: 'sales' },
  { email: 'warehouse@opsportal.demo',password: 'demo1234', full_name: 'Warehouse Mgr',    role: 'warehouse' },
  { email: 'accounts@opsportal.demo', password: 'demo1234', full_name: 'Accounts Officer', role: 'accounts' },
];

const demoProducts = [
  { name: 'Premium Steel Pipe 2inch', sku: 'PSP-2IN-001', category: 'Pipes & Fittings', unit_price: 450, current_stock: 250, min_stock_threshold: 50, warehouse_location: 'Warehouse A - Rack 1', description: 'High-grade steel pipe, 2 inch diameter' },
  { name: 'GI Elbow 90 Degree', sku: 'GIE-90-002', category: 'Pipes & Fittings', unit_price: 85, current_stock: 12, min_stock_threshold: 30, warehouse_location: 'Warehouse A - Rack 2', description: 'Galvanized iron elbow, 90 degree' },
  { name: 'PVC Ball Valve 1inch', sku: 'PBV-1IN-003', category: 'Valves', unit_price: 220, current_stock: 8, min_stock_threshold: 25, warehouse_location: 'Warehouse B - Rack 1', description: 'PVC ball valve 1 inch' },
  { name: 'Industrial Nut Bolt Set M12', sku: 'NBS-M12-004', category: 'Fasteners', unit_price: 35, current_stock: 1500, min_stock_threshold: 200, warehouse_location: 'Warehouse B - Rack 3', description: 'M12 nut bolt set, galvanized' },
  { name: 'Copper Wire 2.5mm', sku: 'CW-2.5-005', category: 'Electrical', unit_price: 1200, current_stock: 45, min_stock_threshold: 20, warehouse_location: 'Warehouse C - Rack 1', description: 'Copper wire, 2.5mm, 100m roll' },
  { name: 'MS Angle 40x40x5', sku: 'MSA-40-006', category: 'Steel Sections', unit_price: 3200, current_stock: 5, min_stock_threshold: 15, warehouse_location: 'Warehouse A - Rack 5', description: 'Mild steel angle 40x40x5mm' },
  { name: 'Hydraulic Hose 1/2inch', sku: 'HH-HLF-007', category: 'Hydraulics', unit_price: 890, current_stock: 3, min_stock_threshold: 10, warehouse_location: 'Warehouse C - Rack 2', description: 'Hydraulic hose, 1/2 inch, 10m' },
  { name: 'Safety Helmet ISI', sku: 'SH-ISI-008', category: 'Safety Equipment', unit_price: 350, current_stock: 80, min_stock_threshold: 30, warehouse_location: 'Warehouse D - Rack 1', description: 'ISI certified safety helmet' },
  { name: 'Digital Vernier Caliper', sku: 'DVC-001-009', category: 'Tools & Instruments', unit_price: 2500, current_stock: 18, min_stock_threshold: 5, warehouse_location: 'Warehouse D - Rack 2', description: 'Digital vernier caliper, 0-150mm' },
  { name: 'Welding Rod 3.15mm', sku: 'WR-3.15-010', category: 'Welding', unit_price: 650, current_stock: 200, min_stock_threshold: 50, warehouse_location: 'Warehouse A - Rack 4', description: 'Welding electrode 3.15mm, 5kg pack' },
];

const demoCustomers = [
  { name: 'Rajesh Kumar', mobile: '9876543210', email: 'rajesh@metalworks.in', business_name: 'MetalWorks Industries', gst_number: '27AABCU9603R1ZM', customer_type: 'Wholesale', address: '45 Industrial Estate, Pune - 411019', status: 'Active', follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], notes: 'Large volume buyer, prefers monthly billing' },
  { name: 'Priya Sharma', mobile: '9765432109', email: 'priya@buildmart.com', business_name: 'BuildMart Solutions', gst_number: '29AAFFT2591R1Z5', customer_type: 'Distributor', address: 'Plot 12, MIDC, Nashik - 422010', status: 'Active', follow_up_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], notes: 'Interested in expanding product range' },
  { name: 'Amit Patel', mobile: '9654321098', email: 'amit@techfab.in', business_name: 'TechFab Engineering', gst_number: '', customer_type: 'Retail', address: '78 Gandhi Nagar, Ahmedabad - 380001', status: 'Lead', follow_up_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], notes: 'First time inquiry, needs pricing catalog' },
  { name: 'Sunita Verma', mobile: '9543210987', email: 'sunita@constructpro.com', business_name: 'ConstructPro Ltd', gst_number: '09AAACI3727H1ZG', customer_type: 'Wholesale', address: '23 Sector 18, Noida - 201301', status: 'Active', follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], notes: 'Regular order every 2 weeks' },
  { name: 'Vikram Singh', mobile: '9432109876', email: 'vikram@heavytools.in', business_name: 'HeavyTools Depot', gst_number: '07AADCH6402R1ZE', customer_type: 'Distributor', address: 'Shop 5, Kirti Nagar, Delhi - 110015', status: 'Inactive', follow_up_date: null, notes: 'Account on hold due to pending payment' },
  { name: 'Deepak Mehta', mobile: '9321098765', email: 'deepak@safetyzone.com', business_name: 'SafetyZone Suppliers', gst_number: '24AABCS5915E1Z1', customer_type: 'Wholesale', address: '67 Udhna, Surat - 394210', status: 'Lead', follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], notes: 'Interested in bulk safety equipment' },
];

async function seed() {
  console.log('Seeding demo data...\n');

  // Create users
  for (const u of demoUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    const { rows } = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2 RETURNING id',
      [u.email, hash]
    );
    const userId = rows[0].id;
    await query(
      `INSERT INTO profiles (id, full_name, email, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET full_name = $2, email = $3, role = $4`,
      [userId, u.full_name, u.email, u.role]
    );
    console.log(`  User: ${u.email} (${u.role})`);
  }

  // Get admin user id for created_by
  const { rows: adminRows } = await query("SELECT id FROM profiles WHERE email = 'admin@opsportal.demo'");
  const adminId = adminRows[0]?.id;

  // Create products
  for (const p of demoProducts) {
    await query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_threshold, warehouse_location, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (sku) DO NOTHING`,
      [p.name, p.sku, p.category, p.unit_price, p.current_stock, p.min_stock_threshold, p.warehouse_location, p.description, adminId]
    );
  }
  console.log(`  Products: ${demoProducts.length} created`);

  // Create customers
  for (const c of demoCustomers) {
    await query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING`,
      [c.name, c.mobile, c.email, c.business_name, c.gst_number, c.customer_type, c.address, c.status, c.follow_up_date, c.notes, adminId]
    );
  }
  console.log(`  Customers: ${demoCustomers.length} created`);

  console.log('\nSeed complete! Demo accounts:');
  demoUsers.forEach(u => console.log(`  ${u.email} / ${u.password} (${u.role})`));
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
