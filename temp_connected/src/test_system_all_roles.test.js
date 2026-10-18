// Automated System Test Suite for ConnectEd Platform
// Tests all 3 user roles (Student, Alumni, Admin), APIs, and Mentorship Impact Score calculations

import { authApi, userApi, alumniApi, roadmapApi } from './frontend/services/api.js';

async function runSystemRoleTests() {
  console.log('===========================================================');
  console.log('🧪 CONNECTED PLATFORM AUTOMATED SYSTEM TEST SUITE');
  console.log('===========================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedTests++;
    }
  }

  // --- TEST 1: STUDENT ROLE AUTHENTICATION & DASHBOARD STATE ---
  console.log('1️⃣ Testing STUDENT Role Authentication & Profile Data...');
  try {
    const studentAuth = await authApi.login({ demoKey: 'alex' });
    assert(studentAuth.success === true, 'Student quick demo login succeeds');
    assert(studentAuth.user.role === 'student', 'User role is identified as STUDENT');
    assert(studentAuth.user.targetDays === 100, 'Student profile has 100-Day Target Horizon');
    assert(studentAuth.user.daysCompleted === 36, 'Student profile tracks 36 Days Completed');

    await userApi.updateCareerGoal('AI / ML Engineer');
    const studentUser = await userApi.getCurrentUser();
    assert(studentUser.targetCompany === 'Google DeepMind', 'Target company is Google DeepMind');
    assert(studentUser.readiness === 64, 'Readiness score is 64%');
  } catch (e) {
    console.error('  ❌ Error in Student Test:', e.message);
    failedTests++;
  }

  // --- TEST 2: ALUMNI ROLE & MENTORSHIP IMPACT SCORE INCREMENT ---
  console.log('\n2️⃣ Testing ALUMNI Role & Mentorship Impact Score Logic...');
  try {
    const alumniAuth = await authApi.login({ demoKey: 'priya' });
    assert(alumniAuth.success === true, 'Alumni quick demo login succeeds');
    assert(alumniAuth.user.role === 'alumni', 'User role is identified as ALUMNI');
    assert(alumniAuth.user.impactScore === 985, 'Alumni has 985 Mentorship Impact Score');

    // Test Impact Score Incrementing
    const beforeAlumni = await alumniApi.getAlumni('impactScore');
    const initialTopScore = beforeAlumni[0].impactScore;

    // Increment Marcus Vance's score by +100
    const marcusId = 'alum_2';
    const updatedMarcus = await alumniApi.incrementImpactScore(marcusId, 100);
    assert(updatedMarcus.impactScore > 1000, `Marcus Vance score increased from 930 to ${updatedMarcus.impactScore}`);

    // Re-query sorted list
    const afterAlumni = await alumniApi.getAlumni('impactScore');
    assert(afterAlumni[0].id === 'alum_2', 'Marcus Vance re-ranked to #1 spot on Impact Leaderboard');
  } catch (e) {
    console.error('  ❌ Error in Alumni Test:', e.message);
    failedTests++;
  }

  // --- TEST 3: ADMIN ROLE AUTHENTICATION & PRIVILEGES ---
  console.log('\n3️⃣ Testing ADMIN Role Authentication & Governance Data...');
  try {
    const adminAuth = await authApi.login({ demoKey: 'admin' });
    assert(adminAuth.success === true, 'Admin quick demo login succeeds');
    assert(adminAuth.user.role === 'admin', 'User role is identified as ADMIN');
    assert(adminAuth.user.name === 'Dr. Sarah Chen', 'Admin user is Dr. Sarah Chen');
    assert(adminAuth.user.targetRole === 'Platform Administrator', 'Admin has Platform Administrator target role');
  } catch (e) {
    console.error('  ❌ Error in Admin Test:', e.message);
    failedTests++;
  }

  // --- TEST 4: CAREER GOAL SWITCHING & ROADMAP DATA ---
  console.log('\n4️⃣ Testing Career Goal Switching & Dynamic Benchmarking...');
  try {
    // Switch to Software Engineer @ Stripe
    const updatedGoal = await userApi.updateCareerGoal('Software Engineer');
    assert(updatedGoal.targetCompany === 'Stripe', 'Target company updated to Stripe');
    assert(updatedGoal.targetRole === 'Senior Software Engineer', 'Target role updated to Senior Software Engineer');

    // Reset back to AI / ML Engineer
    await userApi.updateCareerGoal('AI / ML Engineer');
  } catch (e) {
    console.error('  ❌ Error in Goal Switch Test:', e.message);
    failedTests++;
  }

  // --- SUMMARY ---
  console.log('\n===========================================================');
  console.log(`📊 SYSTEM TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===========================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSystemRoleTests();
