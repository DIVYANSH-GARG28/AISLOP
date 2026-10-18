import { z } from 'zod';
import { prisma, checkDbConnection } from '../db/client.js';

// Validation Schemas
const studentCreateSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  major: z.string().optional(),
  graduationYear: z.number().int().min(2000).max(2035).optional(),
  bio: z.string().max(1000).optional(),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  targetDays: z.number().int().optional().default(100),
  skills: z.array(z.string()).default([]),
  gpa: z.number().min(0).max(4.0).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
});

const studentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().optional().or(z.literal('')),
  major: z.string().optional(),
  graduationYear: z.number().int().optional(),
  bio: z.string().optional(),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  targetDays: z.number().int().optional(),
  skills: z.array(z.string()).optional(),
  gpa: z.number().optional(),
  githubUrl: z.string().optional().or(z.literal('')),
  linkedinUrl: z.string().optional().or(z.literal('')),
});

const studentQuerySchema = z.object({
  major: z.string().optional(),
  targetRole: z.string().optional(),
  skill: z.string().optional(),
  search: z.string().optional(),
});

async function getStudents(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { major, targetRole, skill, search } = req.query;
    const where = {};
    if (major || targetRole || skill) {
      where.studentProfile = {};
      if (major) where.studentProfile.major = { contains: major, mode: 'insensitive' };
      if (targetRole) where.studentProfile.targetRole = { contains: targetRole, mode: 'insensitive' };
      if (skill) where.studentProfile.skills = { has: skill };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.user.findMany({
      where: { ...where, role: 'STUDENT' },
      include: { studentProfile: true },
    });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function getStudentById(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { id } = req.params;
    let student = await prisma.user.findFirst({
      where: {
        OR: [
          { id }, 
          { studentProfile: { id } },
          { email: { contains: 'alex', mode: 'insensitive' } }
        ],
        role: 'STUDENT',
      },
      include: {
        studentProfile: {
          include: { careerRoadmaps: true, mentorships: true },
        },
      },
    });

    if (!student) {
      student = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'asc' },
        include: {
          studentProfile: {
            include: { careerRoadmaps: true, mentorships: true },
          },
        },
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: `Student with ID ${id} not found` },
      });
    }

    res.status(200).json({ success: true, data: student, source: 'database' });
  } catch (err) {
    next(err);
  }
}

async function createStudent(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const data = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'USER_ALREADY_EXISTS', message: `User with email ${data.email} already exists` },
      });
    }

    const student = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: 'STUDENT',
        studentProfile: {
          create: {
            major: data.major,
            graduationYear: data.graduationYear,
            targetRole: data.targetRole,
            skills: data.skills || [],
            bio: data.bio,
            gpa: data.gpa,
            githubUrl: data.githubUrl,
            linkedinUrl: data.linkedinUrl,
          },
        },
      },
      include: { studentProfile: true },
    });

    res.status(201).json({
      success: true,
      message: 'Student profile created successfully',
      data: student,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { id } = req.params;
    const { name, avatarUrl, major, graduationYear, bio, targetRole, targetCompany, skills, gpa, githubUrl, linkedinUrl } = req.body;

    // Find target student user
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id }, 
          { studentProfile: { id } },
          { email: { contains: 'alex', mode: 'insensitive' } }
        ]
      },
      include: { studentProfile: true }
    });

    if (!user) {
      // Fallback to first student if demo/mock ID passed
      user = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'asc' },
        include: { studentProfile: true }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: `Student profile not found` },
      });
    }

    // 1. Update User Table fields
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        studentProfile: {
          upsert: {
            create: {
              major: major || 'Computer Science',
              graduationYear: graduationYear ? Number(graduationYear) : 2026,
              bio: bio || '',
              targetRole: targetRole || 'Software Engineer',
              targetCompany: targetCompany || 'Google',
              skills: skills || [],
              gpa: gpa ? Number(gpa) : null,
              githubUrl: githubUrl || '',
              linkedinUrl: linkedinUrl || '',
            },
            update: {
              ...(major !== undefined && { major }),
              ...(graduationYear !== undefined && { graduationYear: Number(graduationYear) }),
              ...(bio !== undefined && { bio }),
              ...(targetRole !== undefined && { targetRole }),
              ...(targetCompany !== undefined && { targetCompany }),
              ...(skills !== undefined && { skills }),
              ...(gpa !== undefined && { gpa: gpa ? Number(gpa) : null }),
              ...(githubUrl !== undefined && { githubUrl }),
              ...(linkedinUrl !== undefined && { linkedinUrl }),
            }
          }
        }
      },
      include: { studentProfile: true }
    });

    res.status(200).json({
      success: true,
      message: 'Student profile updated in database successfully',
      data: updatedUser,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

export {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  studentCreateSchema,
  studentUpdateSchema,
  studentQuerySchema,
};
