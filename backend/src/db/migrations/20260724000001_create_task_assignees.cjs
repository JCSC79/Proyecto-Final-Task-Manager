/**
 * Migration: create_task_assignees
 *
 * Creates the task_assignees table, an N:M pivot between tasks and users
 * Mirrors the existing task_tags pivot pattern: composite primary key, no surrogate id, CASCADE on delete for both sides so removing a task or a user cleans up automatically.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('task_assignees', (table) => {
        table.uuid('taskId')
            .notNullable()
            .references('id')
            .inTable('tasks')
            .onDelete('CASCADE');
        table.uuid('userId')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.primary(['taskId', 'userId']);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('task_assignees');
};
