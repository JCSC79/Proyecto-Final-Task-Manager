/**
 * Phase 4: Expanding User identity.
 * Adds personal name, avatar URL for Gravatar, and Role-Based Access Control (RBAC).
 * @param { import("knex").Knex } knex
 */
exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.string('name').nullable();           // Full name for UI personalization
    table.string('avatar_url').nullable();     // URL for profile picture
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('name');
    table.dropColumn('avatar_url');
  });
};