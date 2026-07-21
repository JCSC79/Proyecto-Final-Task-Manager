/**
 * Migration: add_due_date_to_tasks
 *
 * Adds a nullable 'dueDate' column to the tasks table.
 * Nullable so that existing rows keep working without a default.
 * Stored as a DATE (day-level precision — no time component needed for due dates).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('tasks', (table) => {
        table.date('dueDate').nullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('tasks', (table) => {
        table.dropColumn('dueDate');
    });
};
