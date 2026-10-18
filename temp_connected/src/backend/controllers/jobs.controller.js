import { z } from 'zod';
import { prisma, checkDbConnection } from '../db/client.js';


// Validation Schemas
const jobCreateSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT']).default('FULL_TIME'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.array(z.string()).default([]),
  referralAvailable: z.boolean().default(true),
  applyUrl: z.string().url().optional().or(z.literal('')),
  postedById: z.string().min(1, 'Poster ID is required'),
});

async function getJobs(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { company, type, referralOnly, search } = req.query;
    const where = {};
    if (company) where.company = { contains: company, mode: 'insensitive' };
    if (type) where.type = type;
    if (referralOnly === 'true') where.referralAvailable = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        postedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { id } = req.params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        postedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: `Job with ID ${id} not found` },
      });
    }

    res.status(200).json({ success: true, data: job, source: 'database' });
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const data = req.body;

    const poster = await prisma.user.findUnique({
      where: { id: data.postedById },
    });
    if (!poster) {
      return res.status(404).json({
        success: false,
        error: { code: 'POSTER_NOT_FOUND', message: `User with ID ${data.postedById} not found` },
      });
    }

    const job = await prisma.job.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        type: data.type,
        description: data.description,
        requirements: data.requirements || [],
        referralAvailable: data.referralAvailable !== false,
        applyUrl: data.applyUrl,
        postedById: data.postedById,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Job posting / referral created successfully',
      data: job,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

export {
  getJobs,
  getJobById,
  createJob,
  jobCreateSchema,
};

