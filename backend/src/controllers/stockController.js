import { query } from '../config/database.js';

/**
 * GET /api/stock-movements
 * Returns the full audit log of stock changes with optional type filter.
 */
export async function listMovements(req, res) {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM stock_movements';
    const params = [];

    if (type && type !== 'all') {
      sql += ' WHERE movement_type = $1';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    res.json({ movements: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock movements.', details: err.message });
  }
}
