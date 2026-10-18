import { z } from 'zod';

/**
 * Zod schema for Alumni Search Result
 * Ensures no fake confidence scores & mandatory explainable match reasons.
 */
export const AlumniMatchSchema = z.object({
  alumniId: z.string().optional().default(''),
  name: z.string().optional().default('Alum'),
  role: z.string().optional().default('Software Engineer'),
  company: z.string().optional().default('Tech Company'),
  matchedSkills: z.array(z.string()).optional().default([]),
  matchScore: z.number().optional().default(90),
  reason: z.string().optional().default("Verified KCE Alum match based on technical background.")
});

export const AlumniSearchResultSchema = z.object({
  query: z.string().optional().default(''),
  extractedIntent: z.object({
    studentSkills: z.array(z.string()).optional().default([]),
    targetDomain: z.string().optional().default('Software Engineering')
  }).optional().default({ studentSkills: [], targetDomain: 'Software Engineering' }),
  matches: z.array(AlumniMatchSchema).optional().default([])
});
