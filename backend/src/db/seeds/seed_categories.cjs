/**
 * Seed: seed_categories
 *
 * Inserts the three global task-type categories with fixed UUIDs so the seed is deterministic and can be re-run safely (onConflict + ignore).
 *
 * Fixed UUIDs allow other seeds or fixtures to reference these rows by ID without having to query first.
 */
const CATEGORIES = [
    { id: '00000000-0000-4000-8000-000000000001', name: 'Bug',         color: '#e74c3c' },
    { id: '00000000-0000-4000-8000-000000000002', name: 'Feature',     color: '#3498db' },
    { id: '00000000-0000-4000-8000-000000000003', name: 'Improvement', color: '#27ae60' },
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
    await knex('categories')
        .insert(CATEGORIES.map(c => ({ ...c, createdAt: new Date() })))
        .onConflict('id')
        .ignore();
};
