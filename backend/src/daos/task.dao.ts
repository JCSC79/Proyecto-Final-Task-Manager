import knex from 'knex';
import { createRequire } from 'node:module';
import type { ITask, TaskStatus, TaskPriority } from '../models/task.model.ts';
import type { ICategory } from '../models/category.model.ts';
import type { ITag } from '../models/tag.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/**
 * Raw row shape returned by task queries that include the LEFT JOIN with categories.
 * The joined category columns are aliased to avoid collisions with task columns.
 */
interface RawTaskRow {
    id: string;
    title: string;
    description: string;
    status: string;
    userId: string;
    projectId: string | null;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    categoryName: string | null;
    categoryColor: string | null;
    priority: string | null;
    dueDate: Date | null;
    projectName: string | null;
    creatorName: string | null;
}

/**
 * Maps a raw DB row (task + LEFT JOIN categories) to a typed ITask.
 * Optional fields are only assigned when their DB column is non-null, which satisfies exactOptionalPropertyTypes without explicit undefined.
 */
function mapTaskRow(row: RawTaskRow): ITask {
    const task: ITask = {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status as TaskStatus,
        userId: row.userId,
        createdAt: row.createdAt,
    };
    if (row.projectId != null) {
        task.projectId = row.projectId;
    }
    if (row.categoryId != null && row.categoryName != null && row.categoryColor != null) {
        task.categoryId = row.categoryId;
        // Build the embedded category object. createdAt is not needed here
        // (it is only included when fetching from GET /api/categories directly).
        const cat: ICategory = { id: row.categoryId, name: row.categoryName, color: row.categoryColor };
        task.category = cat;
    }
    if (row.updatedAt != null) {
        task.updatedAt = row.updatedAt;
    }
    if (row.priority != null) {
        task.priority = row.priority as TaskPriority;
    }
    if (row.dueDate != null) {
        // pg parses DATE columns into a JS Date using LOCAL date components
        // (new Date(year, month, day)), NOT UTC. Using toISOString() here would
        // convert to UTC and roll the date back by one day in any timezone with
        // a positive UTC offset (e.g. UTC+1/+2) — always read it back with the
        // matching LOCAL getters instead of toISOString() to avoid that shift.
        const d = row.dueDate;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        task.dueDate = `${yyyy}-${mm}-${dd}`;
    }
    if (row.projectName != null) {
        task.projectName = row.projectName;
    }
    if (row.creatorName != null) {
        task.creatorName = row.creatorName;
    }
    return task;
}

/**
 * Columns selected in every task read query.
 * Table-qualified names prevent ambiguity after the LEFT JOIN with categories.
 */
const TASK_SELECT = [
    'tasks.id',
    'tasks.title',
    'tasks.description',
    'tasks.status',
    'tasks.userId',
    'tasks.projectId',
    'tasks.categoryId',
    'tasks.createdAt',
    'tasks.updatedAt',
    'tasks.priority',
    'tasks.dueDate',
    'categories.name as categoryName',
    'categories.color as categoryColor',
    'projects.name as projectName',
    'task_creators.name as creatorName',
];

/**
 * TaskDAO - Data Access Object for tasks.
 * Visibility model (Odoo-inspired):
 *   A user can READ a task if:
 *     a) they created it (tasks.userId = me), OR
 *     b) the task belongs to a project they are a member of
 *        (tasks.projectId IN project_members WHERE userId = me)
 *
 *   WRITE operations (update, delete) remain restricted to the creator
 *   to avoid accidental data loss by non-owning project members.
 */
class TaskDAO {

    /**
     * Shared base query: tasks LEFT JOIN categories on categoryId. All read methods use this to get the embedded category object for free.
     */
    private baseQuery() {
        return db('tasks')
            .leftJoin('categories', 'categories.id', 'tasks.categoryId')
            .leftJoin('projects', 'projects.id', 'tasks.projectId')
            .leftJoin('users as task_creators', 'task_creators.id', 'tasks.userId')
            .select(TASK_SELECT);
    }

    /**
     * Fetches all tags for the given task IDs in a single query and merges  them into the task objects. Avoids N+1 queries.
     */
    private async enrichWithTags(tasks: ITask[]): Promise<ITask[]> {
        if (tasks.length === 0) {
            return tasks;
        }
        const taskIds = tasks.map(t => t.id);

        interface TagRow {
            taskId: string;
            id: string;
            name: string;
            color: string;
            projectId: string;
            createdAt: Date;
        }

        const tagRows = await db('tags as tg')
            .join('task_tags as tt', 'tt.tagId', 'tg.id')
            .whereIn('tt.taskId', taskIds)
            .select<TagRow[]>('tt.taskId', 'tg.id', 'tg.name', 'tg.color', 'tg.projectId', 'tg.createdAt');

        const tagsByTaskId = new Map<string, ITag[]>();
        for (const row of tagRows) {
            const list = tagsByTaskId.get(row.taskId) ?? [];
            list.push({ id: row.id, name: row.name, color: row.color, projectId: row.projectId, createdAt: row.createdAt });
            tagsByTaskId.set(row.taskId, list);
        }
        
        for (const task of tasks) {
            const tags = tagsByTaskId.get(task.id);
            if (tags && tags.length > 0) {
                task.tags = tags;
            }
        }
        return tasks;
    }

    /**
     * Returns all tasks visible to the user:
     *   - tasks the user created (any project or no project), PLUS
     *   - tasks in projects the user is a member of (created by others).
     */
    async getAll(userId: string): Promise<ITask[]> {
        const rows = await this.baseQuery()
            .where('tasks.userId', userId)
            .orWhere(function () {
                // Include tasks from projects where the user is a member
                this.whereNotNull('tasks.projectId').whereIn(
                    'tasks.projectId',
                    db('project_members').select('projectId').where({ userId })
                );
            });
        const tasks = (rows as RawTaskRow[]).map(mapTaskRow);
        return this.enrichWithTags(tasks);
    }

    /*
     * SPECIAL: Allows ADMIN role to see the entire global task board.
     */
    async adminGetAll(): Promise<ITask[]> {
        const rows = await this.baseQuery();
        const tasks = (rows as RawTaskRow[]).map(mapTaskRow);
        return this.enrichWithTags(tasks);
    }

    /**
     * Finds a task by ID using the same visibility rule as getAll: the user must be either the creator OR a member of the task's project.
     */
    async getById(id: string, userId: string): Promise<ITask | undefined> {
        const row = await this.baseQuery()
            .where('tasks.id', id)
            .andWhere(function () {
                this.where('tasks.userId', userId)
                    .orWhere(function () {
                        this.whereNotNull('tasks.projectId').whereIn(
                            'tasks.projectId',
                            db('project_members').select('projectId').where({ userId })
                        );
                    });
            })
            .first();
        if (!row) {
            return undefined;
        }
        const task = mapTaskRow(row as RawTaskRow);
        const enriched = await this.enrichWithTags([task]);
        return enriched[0];
    }

    /**
     * Inserts a new task. Only the DB columns are listed explicitly to exclude the virtual `category` field that lives only in read responses.
     */
    async create(task: ITask): Promise<ITask> {
        await db('tasks').insert({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            userId: task.userId,
            ...(task.projectId === undefined ? {} : { projectId: task.projectId }),
            ...(task.categoryId === undefined ? {} : { categoryId: task.categoryId }),
            ...(task.priority === undefined ? {} : { priority: task.priority }),
            ...(task.dueDate === undefined ? {} : { dueDate: task.dueDate }),
            createdAt: task.createdAt,
        });
        return task;
    }

    /**
     * Updates a task only if the ownership (userId) matches.
     * Uses a Record cast so TypeScript does not complain about the virtual `category` field that Knex would never find in the DB schema.
     */
    async update(id: string, userId: string, updates: Partial<ITask>): Promise<ITask | undefined> {
        const updatedRows = await db('tasks')
            .where({ id, userId })
            .update(updates as Record<string, unknown>);

        if (updatedRows === 0) {
            return undefined;
        }
        return await this.getById(id, userId);
    }

    /**
     * Updates only the status of a task.
     *
     * Permission model (broader than update):
     *   - the task creator can always change status, OR
     *   - any member of the project the task belongs to can change status.
     *
     * This implements the behaviour: members can move cards on the board even if they didn't create them.
     */
    async updateStatus(id: string, userId: string, status: TaskStatus): Promise<ITask | undefined> {
        // First verify the user has visibility over this task (same rule as getById).
        // This prevents a random authenticated user from changing status of task in projects they don't belong to.
        const visible = await this.baseQuery()
            .where('tasks.id', id)
            .andWhere(function () {
                this.where('tasks.userId', userId)
                    .orWhere(function () {
                        this.whereNotNull('tasks.projectId').whereIn(
                            'tasks.projectId',
                            db('project_members').select('projectId').where({ userId })
                        );
                    });
            })
            .first();

        if (!visible) {
            return undefined;
        }

        await db('tasks')
            .where({ id })
            .update({ status, updatedAt: new Date() });

        return await this.getById(id, userId);
    }

    /**
     * Deletes a record strictly filtered by ID and Owner.
     */
    async delete(id: string, userId: string): Promise<boolean> {
        const deletedRows = await db<ITask>('tasks')
            .where({ id, userId })
            .del();
            
        return deletedRows > 0;
    }

    /**
     * Bulk delete limited to the user's own tasks.
     */
    async deleteAll(userId: string): Promise<void> {
        await db('tasks').where({ userId }).del();
    }

    /**
     * Bulk delete filtered by status for a specific user.
     */
    async deleteByStatus(userId: string, status: string): Promise<number> {
        return await db('tasks').where({ userId, status }).del();
    }
}

export const taskDAO = new TaskDAO();