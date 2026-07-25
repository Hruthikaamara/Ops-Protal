/**
 * Centralized error handler — placed last in the middleware chain.
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error.';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Catch-all for unmatched routes (404).
 */
export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
