/**
 * Stub for migration that was applied to the database on 2026-05-07.
 * This file was accidentally deleted from the repository.
 * The migration added a 'projects' table and a 'projectId' FK column to 'tasks'.
 * 
 * Knex requires this file to exist to validate the migration history,
 * but it will NOT re-run it since it is already recorded in knex_migrations.
 * 
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  // Already applied — this is a recovery stub.
  // Original migration added projectId (uuid, NOT NULL) FK to tasks table.
};

exports.down = async function(knex) {
  // No-op stub for rollback safety.
};
