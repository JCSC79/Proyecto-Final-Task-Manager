/**
 * Migration: create_comments
 *
 * Creates the comments table for task-level discussion threads.
 * Each comment belongs to one task and one user.
 * Deleting a task or user cascades to remove their comments.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('comments', (table) => {
        table.uuid('id').primary();
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
        table.text('body').notNullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('comments');
};
