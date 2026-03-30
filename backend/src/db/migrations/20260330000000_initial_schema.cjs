/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  // 1. Users Table: Required as the authority for task ownership
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('role').defaultTo('USER'); // RBAC: ADMIN or USER
    table.string('name').nullable();
    table.string('avatar_url').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  // 2. Tasks Table: Shielded with mandatory User relationship
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.string('status').defaultTo('PENDING');
    
    // Mandatory Foreign Key with Cascade Delete to prevent "ghost" tasks
    table.uuid('userId')
      .notNullable() 
      .references('id')
      .inTable('users')
      .onDelete('CASCADE'); 
      
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tasks').dropTableIfExists('users');
};