import alumniMockData from '../data/alumniMockData.js';
import { globalRAGPipeline } from '../rag/ragPipeline.js';

export function getAlumniDatabase() {
  return alumniMockData || [];
}

/**
 * Perform semantic search to find alumni matching a student's skills/query via RAG.
 * 
 * @param {string} userQuery - Natural language query
 * @param {Array} customAlumniDb - Optional custom database of alumni from PostgreSQL
 * @returns {Promise<Object>} RAG structured alumni matches with explainable reasons
 */
export async function searchAlumniBySkills(userQuery, customAlumniDb = null) {
  const db = customAlumniDb || getAlumniDatabase();
  return await globalRAGPipeline.executeSearch(userQuery, db, 5);
}

/**
 * Fallback deterministic matching algorithm ensuring hackathon resilience.
 */
function fallbackSkillMatcher(query, db) {
  const queryLower = query.toLowerCase();
  
  // Extract keywords
  const knownKeywords = [
    "spring boot", "java", "react", "node.js", "python", "aws", "docker", "kubernetes", 
    "microservices", "machine learning", "ai", "data analyst", "devops", "c++", "android",
    "kotlin", "cybersecurity", "sql", "tableau", "solidworks", "embedded"
  ];
  const detectedSkills = knownKeywords.filter(kw => queryLower.includes(kw));

  if (queryLower.includes("spring") && !detectedSkills.includes("spring boot")) {
    detectedSkills.push("spring boot");
  }

  const matches = db.map(alum => {
    const alumSkills = alum.skills || [];
    const matchedSkills = alumSkills.filter(s => 
      queryLower.includes(s.toLowerCase()) || detectedSkills.some(ds => s.toLowerCase().includes(ds))
    );

    if (matchedSkills.length === 0) return null;

    return {
      alumniId: String(alum.id),
      name: alum.name,
      role: alum.role,
      company: alum.company,
      matchedSkills: matchedSkills,
      reason: `Matched based on overlapping skills in ${matchedSkills.join(', ')} and background as ${alum.role} at ${alum.company}.`
    };
  }).filter(Boolean);

  const fallbackResult = {
    query: query,
    extractedIntent: {
      studentSkills: detectedSkills.length > 0 ? detectedSkills : ["Software Engineering"],
      targetDomain: detectedSkills.includes("spring boot") || detectedSkills.includes("java") ? "Java Backend Engineering" : "Software Development"
    },
    matches: matches
  };

  return AlumniSearchResultSchema.parse(fallbackResult);
}
