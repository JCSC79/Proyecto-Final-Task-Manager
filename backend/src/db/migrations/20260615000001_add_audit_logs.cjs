/**
 * Migration: add_audit_logs
 *
 * Creates the audit_logs table for tracking task change history.
 * Each row represents one discrete change event.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('audit_logs', (table) => {
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
        table.string('action', 50).notNullable();      // 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_DELETED'
        table.jsonb('oldValue').nullable();             // snapshot before the change
        table.jsonb('newValue').nullable();             // snapshot after the change
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('audit_logs');
};
