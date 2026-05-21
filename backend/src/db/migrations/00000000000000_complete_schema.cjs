/**
 * Migration: complete_schema
 *
 * Single source of truth for the entire database schema.
 * Replaces the previous chain of 6 incremental migrations.
 *
 * Table creation order respects FK dependencies:
 *   1. users          — no foreign keys
 *   2. categories     — no foreign keys (global reference data, seeded once)
 *   3. projects       — FK -> users
 *   4. project_settings — FK -> projects (1:1, PK = FK)
 *   5. project_members  — FK -> users, projects (N:M pivot)
 *   6. tags           — FK -> projects (1:N)
 *   7. tasks          — FK -> users, projects, categories
 *   8. task_tags      — FK -> tasks, tags (N:M pivot)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {

    // 1) users
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.string('role').defaultTo('USER');        // 'USER' | 'ADMIN'
        table.string('name').nullable();
        table.string('avatar_url').nullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });

    // 2) categories — global reference table, never created via the API
    await knex.schema.createTable('categories', (table) => {
        table.uuid('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('color', 7).notNullable();        // 7-char hex, e.g. '#e74c3c'
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });

    // 3) projects
    await knex.schema.createTable('projects', (table) => {
        table.uuid('id').primary();
        table.string('name').notNullable();
        table.uuid('userId')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });

    // 4) project_settings — 1:1 with projects (PK is also the FK)
    await knex.schema.createTable('project_settings', (table) => {
        table.uuid('projectId').primary();
        table.foreign('projectId')
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table.text('description').nullable();
        table.string('color', 7).notNullable().defaultTo('#4c90f0');
        table.boolean('isPublic').notNullable().defaultTo(true);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });

    // 5) project_members — N:M pivot (users <-> projects)
    await knex.schema.createTable('project_members', (table) => {
        table.uuid('userId')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.uuid('projectId')
            .notNullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table.string('role', 20).notNullable().defaultTo('MEMBER');  // 'OWNER' | 'MEMBER'
        table.timestamp('joinedAt').defaultTo(knex.fn.now());
        table.primary(['userId', 'projectId']);
    });

    // 6) tags — 1:N (projects -> tags)
    await knex.schema.createTable('tags', (table) => {
        table.uuid('id').primary();
        table.string('name', 50).notNullable();
        table.string('color', 7).notNullable().defaultTo('#8a9ba8');
        table.uuid('projectId')
            .notNullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
    });

    // 7) tasks
    await knex.schema.createTable('tasks', (table) => {
        table.uuid('id').primary();
        table.string('title').notNullable();
        table.text('description').nullable();
        table.string('status').defaultTo('PENDING');   // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
        table.uuid('userId')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.uuid('projectId')
            .nullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table.uuid('categoryId')
            .nullable()
            .references('id')
            .inTable('categories')
            .onDelete('SET NULL');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').nullable();
    });

    // 8) task_tags — N:M pivot (tasks <-> tags)
    await knex.schema.createTable('task_tags', (table) => {
        table.uuid('taskId')
            .notNullable()
            .references('id')
            .inTable('tasks')
            .onDelete('CASCADE');
        table.uuid('tagId')
            .notNullable()
            .references('id')
            .inTable('tags')
            .onDelete('CASCADE');
        table.primary(['taskId', 'tagId']);
    });
};

/**
 * Drop all tables in reverse FK dependency order.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('task_tags');
    await knex.schema.dropTableIfExists('tasks');
    await knex.schema.dropTableIfExists('tags');
    await knex.schema.dropTableIfExists('project_members');
    await knex.schema.dropTableIfExists('project_settings');
    await knex.schema.dropTableIfExists('projects');
    await knex.schema.dropTableIfExists('categories');
    await knex.schema.dropTableIfExists('users');
};
