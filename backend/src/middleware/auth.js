import { verifyToken } from '../config/jwt.js';
import { query } from '../config/database.js';

/**
 * Middleware that validates the JWT bearer token and attaches the user
 * profile to req.user. Returns 401 if the token is missing or invalid.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' });
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const { rows } = await query('SELECT id, full_name, email, role, phone FROM profiles WHERE id = $1', [decoded.userId]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication failed.', details: err.message });
  }
}

/**
 * Role-based access control middleware.
 * Usage: authorize('admin') or authorize('admin', 'sales')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}.` });
    }
    next();
  };
}
