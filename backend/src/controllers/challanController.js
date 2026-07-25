import { query, getClient } from '../config/database.js';

/**
 * GET /api/challans
 */
export async function listChallans(req, res) {
  try {
    const { search, status } = req.query;
    let sql = 'SELECT * FROM challans WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (LOWER(challan_number) LIKE LOWER($${idx}) OR LOWER(customer_name) LIKE LOWER($${idx}))`;
      params.push(`%${search}%`);
      idx++;
    }
    if (status && status !== 'all') {
      sql += ` AND status = $${idx++}`;
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    res.json({ challans: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch challans.', details: err.message });
  }
}

/**
 * GET /api/challans/:id
 */
export async function getChallan(req, res) {
  try {
    const { rows } = await query('SELECT * FROM challans WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Challan not found.' });

    const items = await query('SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY created_at', [req.params.id]);

    res.json({ challan: rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch challan.', details: err.message });
  }
}

/**
 * POST /api/challans
 * Creates a challan with line items. If status is "Confirmed",
 * deducts stock and logs stock movements (transactional).
 */
export async function createChallan(req, res) {
  const client = await getClient();
  try {
    const { customer_id, items, notes, status } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: 'Customer is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required.' });
    }

    const challanStatus = ['Draft', 'Confirmed', 'Cancelled'].includes(status) ? status : 'Draft';
    const challanNumber = `CH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Validate stock for confirmed challans
    if (challanStatus === 'Confirmed') {
      for (const item of items) {
        const { rows } = await client.query('SELECT current_stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (rows.length === 0) {
          return res.status(400).json({ error: `Product not found: ${item.product_name}` });
        }
        if (rows[0].current_stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${item.product_name}. Available: ${rows[0].current_stock}, requested: ${item.quantity}` });
        }
      }
    }

    await client.query('BEGIN');

    // Fetch customer info
    const { rows: custRows } = await client.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
    if (custRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Customer not found.' });
    }
    const customer = custRows[0];

    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    // Insert challan header
    const { rows: challanRows } = await client.query(
      `INSERT INTO challans (challan_number, customer_id, customer_name, customer_mobile, customer_business, total_quantity, total_amount, status, notes, created_by, created_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [challanNumber, customer_id, customer.name, customer.mobile, customer.business_name,
       totalQuantity, totalAmount, challanStatus, notes || '', req.user.id, req.user.full_name]
    );
    const challan = challanRows[0];

    // Insert line items
    for (const item of items) {
      await client.query(
        `INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [challan.id, item.product_id, item.product_name, item.sku, item.unit_price, item.quantity, item.unit_price * item.quantity]
      );

      // If confirmed, deduct stock and log movement
      if (challanStatus === 'Confirmed') {
        await client.query(
          'UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.product_id]
        );
        await client.query(
          `INSERT INTO stock_movements (product_id, product_name, quantity, movement_type, reason, reference, created_by, created_by_name)
           VALUES ($1, $2, $3, 'OUT', $4, $5, $6, $7)`,
          [item.product_id, item.product_name, item.quantity, `Challan ${challanNumber}`, challanNumber, req.user.id, req.user.full_name]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Challan created.', challan });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create challan.', details: err.message });
  } finally {
    client.release();
  }
}

/**
 * PUT /api/challans/:id/status
 * Updates a challan's status. Confirming a draft deducts stock.
 */
export async function updateChallanStatus(req, res) {
  const client = await getClient();
  try {
    const { status } = req.body;
    if (!['Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Confirmed or Cancelled.' });
    }

    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM challans WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Challan not found.' });
    }

    const challan = rows[0];
    if (challan.status !== 'Draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Can only update Draft challans. Current status: ${challan.status}` });
    }

    await client.query('UPDATE challans SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);

    if (status === 'Confirmed') {
      const items = await client.query('SELECT * FROM challan_items WHERE challan_id = $1', [req.params.id]);
      for (const item of items.rows) {
        // Validate stock
        const prod = await client.query('SELECT current_stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prod.rows[0].current_stock < item.quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Insufficient stock for ${item.product_name}` });
        }
        await client.query('UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2', [item.quantity, item.product_id]);
        await client.query(
          `INSERT INTO stock_movements (product_id, product_name, quantity, movement_type, reason, reference, created_by, created_by_name)
           VALUES ($1, $2, $3, 'OUT', $4, $5, $6, $7)`,
          [item.product_id, item.product_name, item.quantity, `Challan ${challan.challan_number}`, challan.challan_number, req.user.id, req.user.full_name]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: `Challan ${status.toLowerCase()}.` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update challan.', details: err.message });
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/challans/:id
 */
export async function deleteChallan(req, res) {
  try {
    const { rowCount } = await query('DELETE FROM challans WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Challan not found.' });
    res.json({ message: 'Challan deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete challan.', details: err.message });
  }
}
