/**
 * Migration: make "projectId" nullable on tasks table.
 * 
 * The column was added directly to the database without a migration,
 * breaking task creation because the application never sets this field.
 * Making it nullable restores normal operation while preserving any
 * existing data that already has a projectId value.
 * 
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('tasks', (table) => {
    table.uuid('projectId').nullable().alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('tasks', (table) => {
    table.uuid('projectId').notNullable().alter();
  });
};
