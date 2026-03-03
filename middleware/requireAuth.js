const jwt = require('jsonwebtoken');

/**
 * requireAuth(req, res, next)
 * middleware to require a valid JWT and set req.userId
 *
 * process:
 *  1. JWT middleware extracts req.userId.
 *  2. Delete user from the database.
 *  (Cascade deletion removes their entries if enabled.)
 *
 * Responses:
 *  - 200 OK -> { success: true }
 *  - 404 Not Found -> { message: "user not found" }
 *  - 401 Unauthorized -> missing authorization header or invalid authorization format
 *  - 500 Internal Server Error -> delete failure
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'missing authorization header' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'invalid authorization format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'invalid token payload' });
    }

    req.userId = userId;
    next();

  } catch (err) {
      console.error('JWT verify error:', err);
      return res.status(401).json({ message: 'invalid or expired token' });
    }
}

module.exports = requireAuth;
