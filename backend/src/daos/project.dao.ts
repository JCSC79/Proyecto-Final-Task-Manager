import knex from 'knex';
import { createRequire } from 'module';
import type { IProject, IProjectMember, IProjectSettings, IProjectWithDetails } from '../models/project.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/**
 * ProjectDAO - Handles all database interactions for projects, settings and members.
 *
 * Visibility model (Odoo-inspired):
 *   - All projects are visible to all authenticated users (organisation-wide).
 *   - The creator is automatically the OWNER member.
 *   - Any user can join a project as MEMBER.
 *   - Only the OWNER can delete a project.
 */
class ProjectDAO {
    /**
     * Returns all projects enriched with their settings and the requesting
     * user's membership role.  Non-members get memberRole = null.
     */
    async getAll(requestingUserId: string): Promise<IProjectWithDetails[]> {
        // Fetch every project joined with its settings and an optional member row for the requesting user.  
        // LEFT JOIN on project_members so projects the user hasn't joined still appear (memberRole will be null).
        const rows = await db('projects as p')
            .leftJoin('project_settings as ps', 'ps.projectId', 'p.id')
            .leftJoin('project_members as pm', function () {
                this.on('pm.projectId', '=', 'p.id').andOn(
                    'pm.userId',
                    '=',
                    db.raw('?', [requestingUserId])
                );
            })
            .select(
                'p.id',
                'p.name',
                'p.userId',
                'p.createdAt',
                'ps.description',
                'ps.color',
                'ps.isPublic',
                'pm.role as memberRole'
            );

        // Count members per project in a single extra query to avoid N + 1
        const counts = await db('project_members')
            .select('projectId')
            .count('userId as memberCount')
            .groupBy('projectId');

        const countMap = new Map(
            counts.map((c) => [c.projectId as string, Number(c.memberCount)])
        );

        return rows.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            userId: row.userId as string,
            createdAt: row.createdAt as Date,
            settings: {
                projectId: row.id as string,
                description: row.description as string | null,
                color: (row.color as string) ?? '#4c90f0',
                isPublic: row.isPublic as boolean,
                createdAt: row.createdAt as Date,
            },
            memberRole: (row.memberRole as 'OWNER' | 'MEMBER' | null) ?? null,
            memberCount: countMap.get(row.id as string) ?? 0,
        }));
    }

    /**
     * Creates a new project and atomically:
     *   1. Inserts a row in project_settings with the provided color (or default).
     *   2. Adds the creator as OWNER in project_members.
     * Uses a transaction so all three inserts succeed or fail together.
     */
    async create(
        project: IProject,
        settings: Pick<IProjectSettings, 'color' | 'description' | 'isPublic'>
    ): Promise<IProjectWithDetails> {
        await db.transaction(async (trx) => {
            await trx<IProject>('projects').insert(project);

            const projectSettings: IProjectSettings = {
                projectId: project.id,
                description: settings.description ?? null,
                color: settings.color ?? '#4c90f0',
                isPublic: settings.isPublic ?? true,
                createdAt: new Date(),
            };
            await trx<IProjectSettings>('project_settings').insert(projectSettings);

            const ownerMember: IProjectMember = {
                userId: project.userId,
                projectId: project.id,
                role: 'OWNER',
                joinedAt: new Date(),
            };
            await trx<IProjectMember>('project_members').insert(ownerMember);
        });

        return {
            ...project,
            settings: {
                projectId: project.id,
                description: settings.description ?? null,
                color: settings.color ?? '#4c90f0',
                isPublic: settings.isPublic ?? true,
                createdAt: project.createdAt,
            },
            memberRole: 'OWNER',
            memberCount: 1,
        };
    }

    /**
     * Deletes a project only if the requesting user is the OWNER.
     * The CASCADE constraints in the DB handle removing tasks, tags, settings, and memberships automatically.
     */
    async delete(projectId: string, requestingUserId: string): Promise<boolean> {
        // Verify ownership before deleting
        const membership = await db<IProjectMember>('project_members')
            .where({ projectId, userId: requestingUserId, role: 'OWNER' })
            .first();

        if (!membership) {
            return false;
        }

        const deleted = await db<IProject>('projects').where({ id: projectId }).del();
        return deleted > 0;
    }

     // Adds a user as MEMBER of a project. Returns false if the user is already a member (idempotent-safe).

    async join(projectId: string, userId: string): Promise<boolean> {
        const existing = await db<IProjectMember>('project_members')
            .where({ projectId, userId })
            .first();

        if (existing) {
            return false; // already a member
        }

        await db<IProjectMember>('project_members').insert({
            userId,
            projectId,
            role: 'MEMBER',
            joinedAt: new Date(),
        });
        return true;
    }

    // Removes a MEMBER from a project. OWNERs cannot leave — they must delete the project instead.
    async leave(projectId: string, userId: string): Promise<'left' | 'not_member' | 'owner_cannot_leave'> {
        const membership = await db<IProjectMember>('project_members')
            .where({ projectId, userId })
            .first();

        if (!membership) {
            return 'not_member';
        }

        if (membership.role === 'OWNER') {
            return 'owner_cannot_leave';
        }

        await db<IProjectMember>('project_members')
            .where({ projectId, userId })
            .del();

        return 'left';
    }

    // Returns all members of a project with their roles.

    async getMembers(projectId: string): Promise<{ userId: string; role: string; joinedAt: Date }[]> {
        return db('project_members as pm')
            .join('users as u', 'u.id', 'pm.userId')
            .where('pm.projectId', projectId)
            .select('pm.userId', 'u.name', 'u.email', 'pm.role', 'pm.joinedAt');
    }

    // Renames a project. Only the OWNER can rename. Returns null if not found or not owner.
    async rename(projectId: string, name: string, userId: string): Promise<IProjectWithDetails | null> {
        const membership = await db<IProjectMember>('project_members')
            .where({ projectId, userId, role: 'OWNER' })
            .first();

        if (!membership) {
            return null;
        }

        await db<IProject>('projects').where({ id: projectId }).update({ name });

        const updated = await db('projects as p')
            .leftJoin('project_settings as ps', 'ps.projectId', 'p.id')
            .leftJoin('project_members as pm', function () {
                this.on('pm.projectId', '=', 'p.id').andOn(
                    'pm.userId',
                    '=',
                    db.raw('?', [userId])
                );
            })
            .where('p.id', projectId)
            .select(
                'p.id', 'p.name', 'p.userId', 'p.createdAt',
                'ps.description', 'ps.color', 'ps.isPublic',
                'pm.role as memberRole'
            )
            .first();

        const countRow = await db('project_members')
            .where('projectId', projectId)
            .count('userId as memberCount')
            .first();

        return {
            id: updated.id as string,
            name: updated.name as string,
            userId: updated.userId as string,
            createdAt: updated.createdAt as Date,
            settings: {
                projectId: updated.id as string,
                description: updated.description as string | null,
                color: (updated.color as string) ?? '#4c90f0',
                isPublic: updated.isPublic as boolean,
                createdAt: updated.createdAt as Date,
            },
            memberRole: (updated.memberRole as 'OWNER' | 'MEMBER' | null) ?? null,
            memberCount: Number(countRow?.memberCount ?? 0),
        };
    }
}

export const projectDAO = new ProjectDAO();