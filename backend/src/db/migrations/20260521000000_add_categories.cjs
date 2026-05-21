/**
 * Migration: add_categories
 *
 * Step 1 — Create the 'categories' reference table.
 *   Categories are global (not project-scoped) and represent the nature of the work:
 *   Bug, Feature, or Improvement. They are seeded once and never created via the API.
 *
 * Step 2 — Add 'categoryId' FK column to 'tasks'.
 *   The column is nullable so existing tasks are unaffected.
 *   ON DELETE SET NULL ensures tasks are not lost if a category is ever removed.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1) categories table
    await knex.schema.createTable('categories', (table) => {
        table.uuid('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('color', 7).notNullable();   // 7-char hex, e.g. '#e74c3c'
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });

    // 2) categoryId FK on tasks
    await knex.schema.alterTable('tasks', (table) => {
        table
            .uuid('categoryId')
            .nullable()
            .references('id')
            .inTable('categories')
            .onDelete('SET NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Drop the FK column before dropping the referenced table
    await knex.schema.alterTable('tasks', (table) => {
        table.dropColumn('categoryId');
    });
    await knex.schema.dropTable('categories');
};
