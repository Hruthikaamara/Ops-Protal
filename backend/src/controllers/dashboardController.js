import { query } from '../config/database.js';

/**
 * GET /api/dashboard
 * Returns aggregated KPIs for the role-based dashboard.
 */
export async function getDashboardStats(req, res) {
  try {
    const [
      customers, products, challans, lowStock, recentChallans, recentMovements, followUps,
    ] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as active FROM customers', ['Active']),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE current_stock <= min_stock_threshold) as low_stock, SUM(current_stock * unit_price) as stock_value FROM products'),
      query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Confirmed') as confirmed, COALESCE(SUM(total_amount) FILTER (WHERE status = 'Confirmed'), 0) as revenue FROM challans"),
      query('SELECT id, name, sku, current_stock, min_stock_threshold, warehouse_location FROM products WHERE current_stock <= min_stock_threshold ORDER BY current_stock ASC LIMIT 5'),
      query('SELECT * FROM challans ORDER BY created_at DESC LIMIT 5'),
      query('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 8'),
      query("SELECT id, name, business_name, mobile, follow_up_date, status FROM customers WHERE follow_up_date IS NOT NULL AND follow_up_date <= CURRENT_DATE + INTERVAL '7 days' ORDER BY follow_up_date ASC LIMIT 6"),
    ]);

    res.json({
      stats: {
        customers: customers.rows[0],
        products: products.rows[0],
        challans: challans.rows[0],
      },
      lowStock: lowStock.rows,
      recentChallans: recentChallans.rows,
      recentMovements: recentMovements.rows,
      followUps: followUps.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data.', details: err.message });
  }
}

/**
 * GET /api/reports/overview
 * Returns analytics data for the Reports screen.
 */
export async function getReportsOverview(req, res) {
  try {
    const [
      revenue, orderStatus, customerTypes, stockHealth, topProducts, monthlyRevenue,
    ] = await Promise.all([
      query("SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(*) as order_count FROM challans WHERE status = 'Confirmed'"),
      query("SELECT status, COUNT(*) as count FROM challans GROUP BY status"),
      query("SELECT customer_type, COUNT(*) as count FROM customers GROUP BY customer_type"),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE current_stock > min_stock_threshold) as healthy,
          COUNT(*) FILTER (WHERE current_stock <= min_stock_threshold AND current_stock > 0) as low,
          COUNT(*) FILTER (WHERE current_stock = 0) as out_of_stock,
          COUNT(*) as total
        FROM products
      `),
      query(`
        SELECT m.product_name, SUM(m.quantity) as total_qty, SUM(m.quantity * p.unit_price) as revenue
          FROM stock_movements m
          JOIN products p ON p.id = m.product_id
         WHERE m.movement_type = 'OUT'
         GROUP BY m.product_name
         ORDER BY revenue DESC
         LIMIT 5
      `),
      query(`
        SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') as month,
               COALESCE(SUM(total_amount), 0) as revenue,
               COUNT(*) as order_count
          FROM challans
         WHERE status = 'Confirmed'
           AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
         GROUP BY date_trunc('month', created_at)
         ORDER BY date_trunc('month', created_at)
      `),
    ]);

    res.json({
      totalRevenue: revenue.rows[0].total_revenue,
      orderCount: revenue.rows[0].order_count,
      orderStatus: orderStatus.rows,
      customerTypes: customerTypes.rows,
      stockHealth: stockHealth.rows[0],
      topProducts: topProducts.rows,
      monthlyRevenue: monthlyRevenue.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.', details: err.message });
  }
}

/**
 * GET /api/accounts/overview
 * Returns financial summary for the Accounts dashboard.
 */
export async function getAccountsOverview(req, res) {
  try {
    const [
      summary, topCustomers, recentTransactions, monthlyRevenue,
    ] = await Promise.all([
      query(`
        SELECT
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'Confirmed'), 0) as total_revenue,
          COUNT(*) FILTER (WHERE status = 'Confirmed') as confirmed_count,
          COUNT(*) FILTER (WHERE status = 'Draft') as draft_count,
          COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled_count,
          COALESCE(SUM(total_quantity) FILTER (WHERE status = 'Confirmed'), 0) as total_units,
          COALESCE(AVG(total_amount) FILTER (WHERE status = 'Confirmed'), 0) as avg_order_value
        FROM challans
      `),
      query(`
        SELECT customer_name, SUM(total_amount) as revenue
          FROM challans
         WHERE status = 'Confirmed'
         GROUP BY customer_name
         ORDER BY revenue DESC
         LIMIT 5
      `),
      query('SELECT * FROM challans ORDER BY created_at DESC LIMIT 8'),
      query(`
        SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') as month,
               COALESCE(SUM(total_amount), 0) as revenue
          FROM challans
         WHERE status = 'Confirmed'
           AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
         GROUP BY date_trunc('month', created_at)
         ORDER BY date_trunc('month', created_at)
      `),
    ]);

    res.json({
      summary: summary.rows[0],
      topCustomers: topCustomers.rows,
      recentTransactions: recentTransactions.rows,
      monthlyRevenue: monthlyRevenue.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts data.', details: err.message });
  }
}
