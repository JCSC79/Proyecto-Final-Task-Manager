/**
 * UP: Defines the commands to create the database schema.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary(); // Unique identifier (UUID) as primary key
    table.string('title').notNullable(); // Task title, cannot be empty
    table.text('description'); // Optional long text for task details
    table.string('status').defaultTo('PENDING'); // Default status if not provided
    table.timestamp('createdAt').defaultTo(knex.fn.now()); // Auto-generated timestamp
  });
};

/**
 * DOWN: Defines the commands to undo the UP changes (Rollback).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tasks'); // Deletes the tasks table
};