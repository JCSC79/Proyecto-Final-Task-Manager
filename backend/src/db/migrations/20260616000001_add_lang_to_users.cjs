/**
 * Migration: add_lang_to_users
 *
 * Adds a `lang` column to the users table so each user can receive
 * email notifications in their preferred language ('en' or 'es').
 * Defaults to 'en' for existing users.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('users', (table) => {
        table.string('lang', 2).notNullable().defaultTo('en');  // 'en' | 'es'
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('lang');
    });
};
