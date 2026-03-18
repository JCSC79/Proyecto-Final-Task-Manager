/**
 * UP: Adds the updatedAt column to the tasks table.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('tasks', (table) => {
    table.timestamp('updatedAt'); // Nullable, as it only fills on update
  });
};

/**
 * DOWN: Removes the updatedAt column (Rollback).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('tasks', (table) => {
    table.dropColumn('updatedAt');
  });
};