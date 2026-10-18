import { z } from 'zod';
import { prisma, checkDbConnection } from '../db/client.js';
import { searchAlumniBySkills } from '../../ai/services/alumniSearchService.js';

// Validation Schemas
const alumniCreateSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Current role is required'),
  graduationYear: z.number().int().min(1980).max(2025).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).default(0),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string()).default([]),
  isMentor: z.boolean().default(false),
  mentorBio: z.string().optional(),
  maxMentees: z.number().int().min(1).max(20).default(3),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
});

const alumniQuerySchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  skill: z.string().optional(),
  isMentor: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

async function getAlumni(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { company, role, skill, isMentor, search } = req.query;
    const where = {};
    if (company || role || skill || isMentor !== undefined) {
      where.alumniProfile = {};
      if (company) where.alumniProfile.company = { contains: company, mode: 'insensitive' };
      if (role) where.alumniProfile.role = { contains: role, mode: 'insensitive' };
      if (skill) where.alumniProfile.skills = { has: skill };
      if (isMentor !== undefined) where.alumniProfile.isMentor = isMentor === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { alumniProfile: { company: { contains: search, mode: 'insensitive' } } },
        { alumniProfile: { role: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const alumni = await prisma.user.findMany({
      where: { ...where, role: 'ALUMNI' },
      include: { alumniProfile: true },
    });

    const formattedData = alumni.map(item => {
      const prof = item.alumniProfile || {};
      return {
        id: item.id,
        username: item.email ? item.email.split('@')[0] : item.id,
        name: item.name,
        avatar: item.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
        avatarUrl: item.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
        title: prof.role || 'Software Engineer',
        role: prof.role || 'Software Engineer',
        company: prof.company || 'Tech Enterprise',
        graduationYear: prof.graduationYear || 2021,
        yearsOfExperience: prof.yearsOfExperience || 3,
        experienceYears: prof.yearsOfExperience || 3,
        university: 'KCE',
        degree: prof.degree || prof.major || 'B.E. Computer Science',
        major: prof.major || 'Computer Science',
        domain: prof.major || prof.degree || 'Engineering',
        location: prof.location || 'India',
        matchScore: prof.matchScore || 85,
        impactScore: prof.impactScore || 850,
        menteesGuided: prof.menteesGuided || 10,
        badgeTier: prof.badgeTier || 'Verified Alum ✨',
        matchReason: prof.matchReason || prof.bio || 'Verified KCE Alum Mentor',
        skills: prof.skills || [],
        bio: prof.bio || '',
        availability: prof.availability || 'Available for Mentorship',
        linkedInUrl: prof.linkedinUrl || '',
        linkedin: prof.linkedinUrl || '',
        willingToMentor: prof.isMentor !== false,
        isMentor: prof.isMentor !== false
      };
    });

    res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function getAlumniById(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { id } = req.params;
    let alum = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { alumniProfile: { id } }],
        role: 'ALUMNI',
      },
      include: {
        alumniProfile: {
          include: { mentorships: true },
        },
        postedJobs: true,
      },
    });

    if (!alum) {
      alum = await prisma.user.findFirst({
        where: { role: 'ALUMNI' },
        include: {
          alumniProfile: {
            include: { mentorships: true },
          },
          postedJobs: true,
        },
      });
    }

    if (!alum) {
      return res.status(404).json({
        success: false,
        error: { code: 'ALUMNI_NOT_FOUND', message: `Alumni with ID ${id} not found` },
      });
    }

    res.status(200).json({ success: true, data: alum, source: 'database' });
  } catch (err) {
    next(err);
  }
}

async function createAlumni(req, res, next) {
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

    const alum = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: 'ALUMNI',
        alumniProfile: {
          create: {
            company: data.company,
            role: data.role,
            graduationYear: data.graduationYear,
            yearsOfExperience: data.yearsOfExperience || 0,
            bio: data.bio,
            skills: data.skills || [],
            isMentor: data.isMentor || false,
            mentorBio: data.mentorBio,
            maxMentees: data.maxMentees || 3,
            linkedinUrl: data.linkedinUrl,
          },
        },
      },
      include: { alumniProfile: true },
    });

    res.status(201).json({
      success: true,
      message: 'Alumni profile created successfully',
      data: alum,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function updateAlumni(req, res, next) {
  try {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently unavailable' },
      });
    }

    const { id } = req.params;
    const { name, avatarUrl, company, role, graduationYear, yearsOfExperience, bio, skills, isMentor, mentorBio, maxMentees, linkedinUrl } = req.body;

    let user = await prisma.user.findFirst({
      where: { OR: [{ id }, { alumniProfile: { id } }] },
      include: { alumniProfile: true }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: 'ALUMNI' },
        include: { alumniProfile: true }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'ALUMNI_NOT_FOUND', message: `Alumni profile not found` },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        alumniProfile: {
          upsert: {
            create: {
              company: company || 'Tech Enterprise',
              role: role || 'Senior Engineer',
              graduationYear: graduationYear ? Number(graduationYear) : 2020,
              yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : 5,
              bio: bio || '',
              skills: skills || [],
              isMentor: isMentor !== undefined ? Boolean(isMentor) : true,
              mentorBio: mentorBio || '',
              maxMentees: maxMentees ? Number(maxMentees) : 3,
              linkedinUrl: linkedinUrl || '',
            },
            update: {
              ...(company !== undefined && { company }),
              ...(role !== undefined && { role }),
              ...(graduationYear !== undefined && { graduationYear: Number(graduationYear) }),
              ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
              ...(bio !== undefined && { bio }),
              ...(skills !== undefined && { skills }),
              ...(isMentor !== undefined && { isMentor: Boolean(isMentor) }),
              ...(mentorBio !== undefined && { mentorBio }),
              ...(maxMentees !== undefined && { maxMentees: Number(maxMentees) }),
              ...(linkedinUrl !== undefined && { linkedinUrl }),
            }
          }
        }
      },
      include: { alumniProfile: true }
    });

    res.status(200).json({
      success: true,
      message: 'Alumni profile updated in database successfully',
      data: updatedUser,
      source: 'database',
    });
  } catch (err) {
    next(err);
  }
}

async function searchAlumniRAG(req, res, next) {
  try {
    const query = req.query.query || req.query.search || 'Software Engineering';
    
    const alumni = await prisma.user.findMany({
      where: { role: 'ALUMNI' },
      include: { alumniProfile: true },
    });

    const formattedDb = alumni.map(item => ({
      id: item.id,
      name: item.name,
      role: item.alumniProfile?.role || 'Senior Engineer',
      company: item.alumniProfile?.company || 'Tech Leader',
      skills: item.alumniProfile?.skills || [],
      bio: item.alumniProfile?.bio || '',
      availability: item.alumniProfile?.availability || 'Available for Mentorship',
    }));

    const ragResult = await searchAlumniBySkills(query, formattedDb);

    return res.status(200).json({
      success: true,
      data: ragResult,
      source: 'rag_vector_engine'
    });
  } catch (err) {
    next(err);
  }
}

export {
  getAlumni,
  getAlumniById,
  createAlumni,
  updateAlumni,
  searchAlumniRAG,
  alumniCreateSchema,
  alumniQuerySchema,
};
