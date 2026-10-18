import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { getJwtSecret } from '../middleware/auth.js';

// Zod Validation Schemas
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['STUDENT', 'ALUMNI', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be STUDENT, ALUMNI, or ADMIN' }),
  }).default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Helper to generate JWT token for user
 */
function generateToken(user) {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    secret,
    { expiresIn: '24h' }
  );
}

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role, major, graduationYear, targetRole, targetCompany } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'A user with this email address already exists',
        },
      });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and initial profile
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: role || 'STUDENT',
        ...((!role || role === 'STUDENT') && {
          studentProfile: {
            create: {
              major: major || '',
              graduationYear: Number(graduationYear) || (new Date().getFullYear() + 4),
              targetRole: targetRole || '',
              targetCompany: targetCompany || '',
            },
          },
        }),
        ...(role === 'ALUMNI' && {
          alumniProfile: {
            create: {
              major: major || '',
              graduationYear: Number(graduationYear) || 2020,
              currentRole: targetRole || '',
              company: targetCompany || '',
            },
          },
        }),
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Check generic invalid credentials (never reveal if email vs password was wrong)
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: true,
        alumniProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}
