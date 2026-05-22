/**
 * Category model — global task type classification.
 *
 * Categories are NOT scoped to any project. They represent the universal nature of the work: Bug, Feature, or Improvement. 
 * This is the N:1 side of the relationship — one category can be assigned to many tasks.
 *
 * createdAt is optional because when a category is embedded inside a task
 * response (via LEFT JOIN) we do not select that column for performance.
 * It IS present when fetched from GET /api/categories directly.
 */
export interface ICategory {
    id: string;
    name: string;   // 'Bug' | 'Feature' | 'Improvement'
    color: string;  // 7-char hex — used for the badge background in the UI
    createdAt?: Date;
}
