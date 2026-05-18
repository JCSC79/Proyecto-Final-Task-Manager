import knex from 'knex';
import { createRequire } from 'module';
import type { ITag, ITagWithTaskCount } from '../models/tag.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/*
 * TagDAO — database interactions for the tags and task_tags tables.
 * Access rules:
 *   READ: any authenticated user (tags are project-scoped, not user-scoped)
 *   CREATE: any project member (OWNER or MEMBER)
 *   DELETE: OWNER only (enforced in the controller via project_members check)
 *   ASSIGN / UNASSIGN — any project member who also owns the task
 */
class TagDAO {
    /*
     * Returns all tags for a project, each enriched with how many tasks
     * currently use that tag.  A single JOIN + GROUP BY avoids N + 1 queries.
     */
    async getAllByProject(projectId: string): Promise<ITagWithTaskCount[]> {
        const rows = await db('tags as t')
            .leftJoin('task_tags as tt', 'tt.tagId', 't.id')
            .where('t.projectId', projectId)
            .groupBy('t.id')
            .select(
                't.id',
                't.name',
                't.color',
                't.projectId',
                't.createdAt',
                db.raw('COUNT(tt."tagId") as "taskCount"')
            );

        return rows.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            color: row.color as string,
            projectId: row.projectId as string,
            createdAt: row.createdAt as Date,
            taskCount: Number(row.taskCount),
        }));
    }

    /*
     * Finds a single tag by ID within a project.
     * Used for ownership checks before deletion.
     */
    async getById(tagId: string, projectId: string): Promise<ITag | undefined> {
        return await db<ITag>('tags').where({ id: tagId, projectId }).first();
    }

    /*
     * Creates a new tag scoped to a project.
     * Name uniqueness within the project is enforced by the caller (controller).
     */
    async create(tag: ITag): Promise<ITag> {
        await db<ITag>('tags').insert(tag);
        return tag;
    }

    /*
     * Deletes a tag and automatically removes it from all tasks
     * (the task_tags rows are removed by the ON DELETE CASCADE constraint).
     */
    async delete(tagId: string, projectId: string): Promise<boolean> {
        const deleted = await db<ITag>('tags')
            .where({ id: tagId, projectId })
            .del();
        return deleted > 0;
    }

    /*
     * Assigns a tag to a task.
     * Returns false if the tag is already assigned (idempotent-safe).
     * Does NOT verify that the tag and task belong to the same project —
     * that cross-check is done in the controller.
     */
    async assignToTask(taskId: string, tagId: string): Promise<boolean> {
        const existing = await db('task_tags').where({ taskId, tagId }).first();
        
        if (existing) {
            return false;
        }
        await db('task_tags').insert({ taskId, tagId });
        return true;
    }

    /*
     * Removes a tag assignment from a task.
     */
    async unassignFromTask(taskId: string, tagId: string): Promise<boolean> {
        const deleted = await db('task_tags').where({ taskId, tagId }).del();
        return deleted > 0;
    }

    /*
     * Returns all tags assigned to a specific task.
     * Used when returning enriched task data.
     */
    async getByTask(taskId: string): Promise<ITag[]> {
        return await db('tags as t')
            .join('task_tags as tt', 'tt.tagId', 't.id')
            .where('tt.taskId', taskId)
            .select('t.*');
    }
}

export const tagDAO = new TagDAO();
