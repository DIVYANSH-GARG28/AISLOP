import jwt from 'jsonwebtoken';

/**
 * Get JWT Secret safely from environment with fallback for dev/demo testing
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is missing');
    }
    return 'connected_hackathon_jwt_secret_fallback_key';
  }
  return secret;
}

/**
 * JWT Authentication Middleware
 * Expects header: Authorization: Bearer <token>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header missing',
      },
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid Authorization format. Expected Bearer <token>',
      },
    });
  }

  const token = parts[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}
