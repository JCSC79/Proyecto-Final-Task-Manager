const crypto = require('crypto');

/**
 * UPDATED SEED: Stress Testing Engine with User Assignment.
 * Ensures all tasks have a valid owner to comply with NOT NULL constraints.
 */
exports.seed = async function(knex) {
  const TOTAL_TASKS = 500;

  // 1. Fetch available users to assign tasks
  const users = await knex('users').select('id');
  
  if (users.length === 0) {
    throw new Error('[-] No users found. Please run seed_users.cjs first.');
  }

  // 2. Clean existing tasks
  await knex('tasks').del();
  
  const tasks = [];
  const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  
  console.log(`[!] Generating ${TOTAL_TASKS} tasks for stress testing...`);

  // 3. Dynamic task generator with owner assignment
  for (let i = 1; i <= TOTAL_TASKS; i++) {
    const status = statuses[i % 3];
    const date = new Date();
    date.setDate(date.getDate() - (i % 15)); 

    // Assign tasks to users in a round-robin fashion
    const owner = users[i % users.length];

    tasks.push({
      id: crypto.randomUUID(),
      title: `Task #${i}: Stress Test Data`,
      description: `Iteration ${i}. Validating clean architecture and foreign key constraints.`,
      status: status,
      userId: owner.id, // <--- THE FIX: Assigning a real owner
      createdAt: date,
      updatedAt: status === 'COMPLETED' ? new Date() : null
    });
  }

  // 4. Perform batch insert
  await knex('tasks').insert(tasks);
  
  console.log(`[+] Success! ${TOTAL_TASKS} tasks correctly assigned and planted.`);
};