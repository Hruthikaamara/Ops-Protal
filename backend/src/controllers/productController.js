import { query, getClient } from '../config/database.js';

/**
 * GET /api/products
 * List all products with optional search and stock-status filter.
 */
export async function listProducts(req, res) {
  try {
    const { search, filter } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (LOWER(name) LIKE LOWER($${idx}) OR LOWER(sku) LIKE LOWER($${idx}))`;
      params.push(`%${search}%`);
      idx++;
    }
    if (filter === 'low') {
      sql += ` AND current_stock <= min_stock_threshold AND current_stock > 0`;
    } else if (filter === 'out') {
      sql += ` AND current_stock = 0`;
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    res.json({ products: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products.', details: err.message });
  }
}

/**
 * GET /api/products/:id
 */
export async function getProduct(req, res) {
  try {
    const { rows } = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.', details: err.message });
  }
}

/**
 * POST /api/products
 */
export async function createProduct(req, res) {
  try {
    const { name, sku, category, unit_price, current_stock, min_stock_threshold, warehouse_location, description } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Name and SKU are required.' });
    }

    const { rows } = await query(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_threshold, warehouse_location, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, sku, category || 'General', unit_price || 0, current_stock || 0,
       min_stock_threshold || 10, warehouse_location || 'Main Warehouse', description || '', req.user.id]
    );

    // Log initial stock as a movement
    if ((current_stock || 0) > 0) {
      await query(
        `INSERT INTO stock_movements (product_id, product_name, quantity, movement_type, reason, created_by, created_by_name)
         VALUES ($1, $2, $3, 'IN', 'Initial stock', $4, $5)`,
        [rows[0].id, name, current_stock, req.user.id, req.user.full_name]
      );
    }

    res.status(201).json({ message: 'Product created.', product: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A product with this SKU already exists.' });
    }
    res.status(500).json({ error: 'Failed to create product.', details: err.message });
  }
}

/**
 * PUT /api/products/:id
 */
export async function updateProduct(req, res) {
  try {
    const fields = ['name', 'sku', 'category', 'unit_price', 'min_stock_threshold', 'warehouse_location', 'description'];
    const updates = [];
    const values = [];
    let idx = 1;

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(req.body[f]);
      }
    }
    updates.push(`updated_at = $${idx++}`);
    values.push(new Date().toISOString());
    values.push(req.params.id);

    const { rows } = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product updated.', product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.', details: err.message });
  }
}

/**
 * DELETE /api/products/:id
 */
export async function deleteProduct(req, res) {
  try {
    const { rowCount } = await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.', details: err.message });
  }
}

/**
 * POST /api/products/:id/adjust-stock
 * Adjusts stock (IN or OUT) and logs a stock movement.
 */
export async function adjustStock(req, res) {
  const client = await getClient();
  try {
    const { quantity, movement_type, reason } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }
    if (!['IN', 'OUT'].includes(movement_type)) {
      return res.status(400).json({ error: 'Movement type must be IN or OUT.' });
    }

    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = rows[0];
    const newStock = movement_type === 'IN'
      ? product.current_stock + quantity
      : product.current_stock - quantity;

    if (newStock < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient stock. Current: ${product.current_stock}, requested: ${quantity}` });
    }

    await client.query(
      'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, product.id]
    );

    await client.query(
      `INSERT INTO stock_movements (product_id, product_name, quantity, movement_type, reason, created_by, created_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [product.id, product.name, quantity, movement_type, reason || '', req.user.id, req.user.full_name]
    );

    await client.query('COMMIT');
    res.json({ message: 'Stock adjusted.', new_stock: newStock, product_name: product.name });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to adjust stock.', details: err.message });
  } finally {
    client.release();
  }
}
