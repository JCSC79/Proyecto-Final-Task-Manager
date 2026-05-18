/*
 * Tag Model — scoped labels for tasks within a project.
 * Tags follow a 1:N relationship with projects (a tag belongs to exactly one project) and a N:M relationship with tasks via the task_tags junction table.
 * Colour is stored as a 7-char hex string so the UI can render the chip with the correct background without any extra lookups.
 */

export interface ITag {
    id: string;
    name: string;
    color: string; // 7-char hex'
    projectId: string; // FK -> projects.id (ON DELETE CASCADE)
    createdAt: Date;
}

/*
 * Enriched tag returned by GET /api/projects/:id/tags.
 * Includes how many tasks currently carry this tag so the UI can show a usage badge and warn before deletion.
 */
export interface ITagWithTaskCount extends ITag {
    taskCount: number;
}
