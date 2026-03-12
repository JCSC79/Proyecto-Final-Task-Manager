/**
 * SEED: Fill the tasks table with initial data
 * @param { import("knex").Knex } knex
 */
exports.seed = async function(knex) {
  // 1. Deletes ALL existing entries to start clean
  await knex('tasks').del();
  
  // 2. Inserts seed entries with valid UUIDs
  await knex('tasks').insert([
    { 
      id: '550e8400-e29b-41d4-a716-446655440000', 
      title: 'Setup Database', 
      description: 'Configure PostgreSQL with Docker', 
      status: 'COMPLETED' 
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440001', 
      title: 'Create Migrations', 
      description: 'Define the tasks table schema', 
      status: 'COMPLETED' 
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440002', 
      title: 'Verify Security', 
      description: 'Check SQL Injection prevention (OWASP)', 
      status: 'IN_PROGRESS' 
    }
  ]);
};