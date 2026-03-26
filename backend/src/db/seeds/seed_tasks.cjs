const crypto = require('crypto'); // Built-in node module for safe UUIDs

/**
 * SHIELDED SEED: Stress Testing Engine.
 * Adjust the TOTAL_TASKS variable to test board limits (Pagination & Dashboard).
 */
exports.seed = async function(knex) {
  //  CONFIGURATION 
  const TOTAL_TASKS = 500; // <--- CHANGE ONLY THIS NUMBER FOR STRESS TESTING!
  // 

  // 1. Clean existing data to ensure a fresh test environment
  await knex('tasks').del();
  
  const tasks = [];
  const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  
  console.log(`[!] Generating ${TOTAL_TASKS} tasks for stress testing...`);

  // 2. Get existing users to assign task ownership.
  const allUsers = await knex('users').select('id').limit(10);
  const userIds = allUsers.map(user => user.id);

  if (userIds.length === 0) {
    console.log('[⚠] No users found in users table yet. Please run user seed first.');
    return;
  }

  // 3. Dynamic task generator. Assigns tasks round-robin to users.
  for (let i = 1; i <= TOTAL_TASKS; i++) {
    const status = statuses[i % 3]; // Balanced distribution across columns
    const date = new Date();
    date.setDate(date.getDate() - (i % 15));

    const userId = userIds[i % userIds.length];

    tasks.push({
      id: crypto.randomUUID(), // SHIELDED: Always unique, no DB collisions
      title: `Task #${i}: ${i % 2 === 0 ? 'System Optimization' : 'UI Refinement'}`,
      description: `Stress test iteration ${i}. Validating Phase 3 stability and TanStack Query performance.`,
      status: status,
      createdAt: date,
      userId,
      // For COMPLETED tasks, add updatedAt to trigger Dashboard KPIs
      updatedAt: status === 'COMPLETED' ? new Date() : null
    });
  }

  // 3. Batch insert for high performance
  await knex('tasks').insert(tasks);
  
  console.log(`[+] Success! ${TOTAL_TASKS} tasks "planted" in PostgreSQL.`);
};