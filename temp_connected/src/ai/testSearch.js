import { searchAlumniBySkills } from './services/alumniSearchService.js';

async function runTestSuite() {
  const testQueries = [
    "I am a Spring Boot student find me alumni similar to my skill",
    "I am learning React and Next.js, show me frontend mentors",
    "Looking for alumni working in AI and PyTorch at Microsoft or similar companies"
  ];

  console.log("==================================================");
  console.log("ConnectEd AI Engine - Multi-Query Test Suite");
  console.log("==================================================\n");

  for (const query of testQueries) {
    console.log(`🔍 QUERY: "${query}"`);
    const result = await searchAlumniBySkills(query);
    
    console.log(`   Detected Skills: ${result.extractedIntent.studentSkills.join(", ")}`);
    console.log(`   Target Domain:   ${result.extractedIntent.targetDomain}`);
    console.log(`   Matches Found:   ${result.matches.length}`);
    
    result.matches.forEach((match, idx) => {
      console.log(`     #${idx + 1}: ${match.name} (${match.role} @ ${match.company})`);
      console.log(`        Matched Skills: ${match.matchedSkills.join(", ")}`);
      console.log(`        Reason:         ${match.reason}`);
    });
    console.log("--------------------------------------------------\n");
  }

  console.log("==================================================");
  console.log("✅ All Queries Executed Successfully & Validated with Zod!");
  console.log("==================================================");
}

runTestSuite();
