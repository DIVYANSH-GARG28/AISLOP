import { z } from 'zod';
import { prisma, checkDbConnection } from '../db/client.js';


// Validation Schema
const mentorshipRequestSchema = z.object({
  mentorId: z.string().min(1, 'Mentor ID is required'),
  menteeId: z.string().min(1, 'Mentee/Student ID is required'),
  message: z.string().min(10, 'Please provide a message explaining your mentorship goals (min 10 chars)'),
  goals: z.array(z.string()).default([]),
});

async function getMentors(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { skill, company } = req.query;
    const where = {
      role: 'ALUMNI',
      alumniProfile: { isMentor: true },
    };
    if (company) where.alumniProfile.company = { contains: company, mode: 'insensitive' };
    if (skill) where.alumniProfile.skills = { has: skill };

    const mentors = await prisma.user.findMany({
      where,
      include: {
        alumniProfile: {
          include: {
            mentorships: {
              where: { status: 'ACCEPTED' },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: mentors.length,
      data: mentors,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function requestMentorship(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { mentorId, menteeId, message, goals } = req.body;

    // Verify mentor profile exists (checking AlumniProfile.id or User.id)
    let mentorProfile = await prisma.alumniProfile.findUnique({
      where: { id: mentorId },
    });
    if (!mentorProfile) {
      mentorProfile = await prisma.alumniProfile.findUnique({
        where: { userId: mentorId },
      });
    }

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        error: { code: 'MENTOR_NOT_FOUND', message: `Mentor profile with ID ${mentorId} not found` },
      });
    }

    // Verify mentee profile exists (checking StudentProfile.id or User.id)
    let menteeProfile = await prisma.studentProfile.findUnique({
      where: { id: menteeId },
    });
    if (!menteeProfile) {
      menteeProfile = await prisma.studentProfile.findUnique({
        where: { userId: menteeId },
      });
    }

    if (!menteeProfile) {
      return res.status(404).json({
        success: false,
        error: { code: 'MENTEE_NOT_FOUND', message: `Mentee profile with ID ${menteeId} not found` },
      });
    }

    const request = await prisma.mentorship.create({
      data: {
        mentorId: mentorProfile.id,
        menteeId: menteeProfile.id,
        message,
        goals: goals || [],
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Mentorship request submitted successfully',
      data: request,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function getMentorshipRequests(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { userId, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (userId) {
      where.OR = [
        { mentor: { userId } },
        { mentee: { userId } },
        { mentorId: userId },
        { menteeId: userId },
      ];
    }

    const requests = await prisma.mentorship.findMany({
      where,
      include: {
        mentor: { include: { user: true } },
        mentee: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

export {
  getMentors,
  requestMentorship,
  getMentorshipRequests,
  mentorshipRequestSchema,
};

