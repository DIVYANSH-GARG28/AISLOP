/**
 * ConnectEd RAG Pipeline Executor
 * 
 * Performs 3-step Retrieval-Augmented Generation:
 * 1. RETRIEVE: Vector Store K-NN retrieval for Top-K relevant candidates (< 5ms)
 * 2. AUGMENT: Constructs concise RAG context prompt with Top-K items only
 * 3. GENERATE: Invokes LLM (Gemini / Ollama / Local Fallback) for explainable matches
 */

import { VectorStore } from './vectorStore.js';
import { generateStructuredJson } from '../utils/llmClient.js';
import { AlumniSearchResultSchema } from '../schemas/alumniSearchSchema.js';

export class RAGPipeline {
  constructor(vectorStore = null) {
    this.vectorStore = vectorStore || new VectorStore();
  }

  /**
   * Initializes or updates the vector index with the latest alumni database.
   */
  initializeIndex(alumniList) {
    if (Array.isArray(alumniList) && alumniList.length > 0) {
      this.vectorStore.indexDocuments(alumniList);
    }
  }

  /**
   * Executes RAG semantic alumni search.
   * 
   * @param {string} userQuery - Student's natural language query or profile description
   * @param {Array} alumniDb - Complete alumni list from PostgreSQL or mock data
   * @param {number} topK - Number of candidates to retrieve for LLM augmentation (default: 5)
   */
  async executeSearch(userQuery, alumniDb = [], topK = 5) {
    const startTime = Date.now();

    // Ensure Vector Index is populated
    if (!this.vectorStore.isIndexed || this.vectorStore.documents.length === 0) {
      this.initializeIndex(alumniDb);
    }

    // Step 1: RETRIEVE Top-K Vector Candidates via Cosine Similarity
    const retrievedResults = this.vectorStore.search(userQuery, topK);
    const retrievalTimeMs = Date.now() - startTime;

    if (retrievedResults.length === 0) {
      return {
        query: userQuery,
        extractedIntent: { studentSkills: [], targetDomain: "General" },
        matches: [],
        meta: { retrievalTimeMs, totalCandidatesEvaluated: alumniDb.length }
      };
    }

    const topKCandidates = retrievedResults.map(r => r.document);

    // Step 2: AUGMENT Context Prompt with ONLY Top-K Candidates (90% Token Reduction)
    const ragPrompt = `
You are the AI Semantic Alumni RAG Matcher for ConnectEd.
Student Query / Goal: "${userQuery}".

Retrieved Top-${retrievedResults.length} Candidate Alumni (filtered via Vector Cosine Similarity Search):
${JSON.stringify(topKCandidates.map(c => ({
  id: c.id,
  name: c.name,
  role: c.role || c.title,
  company: c.company,
  skills: c.skills,
  bio: c.bio,
  availability: c.availability
})), null, 2)}

INSTRUCTIONS:
1. Analyze the student query and candidate profiles.
2. Select the best matching alumni from the retrieved list.
3. For each selected candidate, provide a clear, human-understandable reason explaining WHY they match.
4. Calculate realistic match scores (60-98).

Return ONLY valid JSON matching this schema:
{
  "query": "${userQuery}",
  "extractedIntent": {
    "studentSkills": ["skill1", "skill2"],
    "targetDomain": "Domain Name"
  },
  "matches": [
    {
      "alumniId": "alum-id",
      "name": "Name",
      "role": "Role",
      "company": "Company",
      "matchedSkills": ["skill"],
      "matchScore": 92,
      "matchPercentage": "92%",
      "reason": "Human explanation"
    }
  ]
}
`;

    // Step 3: GENERATE Explainable Match Reasonings via LLM
    try {
      const llmResult = await generateStructuredJson(ragPrompt, AlumniSearchResultSchema);
      if (llmResult && llmResult.matches && llmResult.matches.length > 0) {
        return {
          ...llmResult,
          meta: {
            retrievalTimeMs,
            totalCandidatesEvaluated: alumniDb.length,
            retrievedCandidateCount: topKCandidates.length,
            ragEnabled: true
          }
        };
      }
    } catch (err) {
      console.warn("RAG LLM generation fallback triggered:", err.message);
    }

    // Step 4: Fallback RAG Engine (High-speed vector score formatting when offline)
    const fallbackMatches = retrievedResults.map(r => {
      const doc = r.document;
      return {
        alumniId: String(doc.id),
        name: doc.name,
        role: doc.role || doc.title,
        company: doc.company,
        matchedSkills: r.matchedTerms.length > 0 ? r.matchedTerms : (doc.skills ? doc.skills.slice(0, 3) : ['Engineering']),
        matchScore: r.matchScore,
        matchPercentage: `${r.matchScore}%`,
        reason: doc.matchReason || `Expertise in ${(r.matchedTerms.length > 0 ? r.matchedTerms : (doc.skills || [])).slice(0, 3).join(', ')} as ${doc.role || doc.title} at ${doc.company} aligns with your query.`
      };
    });

    return {
      query: userQuery,
      extractedIntent: {
        studentSkills: retrievedResults[0]?.matchedTerms || ["Engineering"],
        targetDomain: topKCandidates[0]?.role || "Software Engineering"
      },
      matches: fallbackMatches,
      meta: {
        retrievalTimeMs,
        totalCandidatesEvaluated: alumniDb.length,
        retrievedCandidateCount: topKCandidates.length,
        ragEnabled: true,
        fallbackMode: true
      }
    };
  }
}

export const globalRAGPipeline = new RAGPipeline();
