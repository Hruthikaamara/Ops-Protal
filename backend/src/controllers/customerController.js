import { query } from '../config/database.js';

/**
 * GET /api/customers
 * List all customers with optional search and status/type filters.
 */
export async function listCustomers(req, res) {
  try {
    const { search, status, type } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (LOWER(name) LIKE LOWER($${idx}) OR mobile LIKE $${idx} OR LOWER(business_name) LIKE LOWER($${idx}))`;
      params.push(`%${search}%`);
      idx++;
    }
    if (status && status !== 'all') {
      sql += ` AND status = $${idx++}`;
      params.push(status);
    }
    if (type && type !== 'all') {
      sql += ` AND customer_type = $${idx++}`;
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    res.json({ customers: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers.', details: err.message });
  }
}

/**
 * GET /api/customers/:id
 */
export async function getCustomer(req, res) {
  try {
    const { rows } = await query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found.' });

    const [notes, challans] = await Promise.all([
      query('SELECT * FROM customer_notes WHERE customer_id = $1 ORDER BY created_at DESC', [req.params.id]),
      query('SELECT * FROM challans WHERE customer_id = $1 ORDER BY created_at DESC', [req.params.id]),
    ]);

    res.json({ customer: rows[0], notes: notes.rows, challans: challans.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer.', details: err.message });
  }
}

/**
 * POST /api/customers
 */
export async function createCustomer(req, res) {
  try {
    const {
      name, mobile, email, business_name, gst_number,
      customer_type, address, status, follow_up_date, notes,
    } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile are required.' });
    }

    const { rows } = await query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, mobile, email || '', business_name || '', gst_number || '',
       customer_type || 'Retail', address || '', status || 'Lead',
       follow_up_date || null, notes || '', req.user.id]
    );

    res.status(201).json({ message: 'Customer created.', customer: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer.', details: err.message });
  }
}

/**
 * PUT /api/customers/:id
 */
export async function updateCustomer(req, res) {
  try {
    const fields = ['name', 'mobile', 'email', 'business_name', 'gst_number', 'customer_type', 'address', 'status', 'follow_up_date', 'notes'];
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
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found.' });
    res.json({ message: 'Customer updated.', customer: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer.', details: err.message });
  }
}

/**
 * DELETE /api/customers/:id
 */
export async function deleteCustomer(req, res) {
  try {
    const { rowCount } = await query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Customer not found.' });
    res.json({ message: 'Customer deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer.', details: err.message });
  }
}

/**
 * POST /api/customers/:id/notes
 */
export async function addNote(req, res) {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const { rows } = await query(
      `INSERT INTO customer_notes (customer_id, note, created_by, created_by_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, note.trim(), req.user.id, req.user.full_name]
    );

    res.status(201).json({ message: 'Note added.', note: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note.', details: err.message });
  }
}

/**
 * DELETE /api/customers/:id/notes/:noteId
 */
export async function deleteNote(req, res) {
  try {
    await query('DELETE FROM customer_notes WHERE id = $1 AND customer_id = $2', [req.params.noteId, req.params.id]);
    res.json({ message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note.', details: err.message });
  }
}
