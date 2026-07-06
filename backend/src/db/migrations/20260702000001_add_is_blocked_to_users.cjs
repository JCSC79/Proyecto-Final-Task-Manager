/**
 * Migration: add_is_blocked_to_users
 *
 * Adds an is_blocked flag to the users table.
 * Blocked users are rejected at the auth middleware level on their next request.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('users', (table) => {
        table.boolean('is_blocked').notNullable().defaultTo(false);
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('is_blocked');
    });
};
