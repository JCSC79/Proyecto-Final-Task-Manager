/**
 * Migration: add_priority_to_tasks
 *
 * Adds a nullable 'priority' column to the tasks table.
 * Nullable so that existing rows keep working without a default.
 * Valid values: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('tasks', (table) => {
        table.string('priority', 10).nullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('tasks', (table) => {
        table.dropColumn('priority');
    });
};
