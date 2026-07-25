import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateToken } from '../config/jwt.js';

/**
 * POST /api/auth/register
 * Creates a new user account (auth.users + profiles) and returns a JWT.
 */
export async function register(req, res) {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const validRoles = ['admin', 'sales', 'warehouse', 'accounts'];
    const userRole = validRoles.includes(role) ? role : 'sales';

    // Check if email already exists in profiles
    const existing = await query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert into a local users table (stores password hash for the Express backend)
    const userResult = await query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
      [email, passwordHash]
    );
    const userId = userResult.rows[0].id;

    // Create profile
    await query(
      `INSERT INTO profiles (id, full_name, email, role) VALUES ($1, $2, $3, $4)`,
      [userId, full_name, email, userRole]
    );

    const token = generateToken({ userId, email, role: userRole });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: userId, full_name, email, role: userRole },
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.', details: err.message });
  }
}

/**
 * POST /api/auth/login
 * Validates credentials and returns a JWT.
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows } = await query(
      `SELECT u.id, u.password_hash, p.full_name, p.email, p.role, p.phone
         FROM users u
         JOIN profiles p ON p.id = u.id
        WHERE u.email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.', details: err.message });
  }
}

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile.
 */
export async function getProfile(req, res) {
  res.json({ user: req.user });
}

/**
 * PUT /api/auth/profile
 * Updates the authenticated user's profile (name, phone, role).
 */
export async function updateProfile(req, res) {
  try {
    const { full_name, phone, role } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (full_name) { updates.push(`full_name = $${paramIndex++}`); values.push(full_name); }
    if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); values.push(phone); }
    if (role) {
      const validRoles = ['admin', 'sales', 'warehouse', 'accounts'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
      }
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(req.user.id);
    const { rows } = await query(
      `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, full_name, email, role, phone`
    );

    res.json({ message: 'Profile updated.', user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Update failed.', details: err.message });
  }
}
