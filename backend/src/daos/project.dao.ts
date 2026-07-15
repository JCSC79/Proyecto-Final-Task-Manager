import knex from 'knex';
import { createRequire } from 'node:module';
import type { IProject, IProjectMember, IProjectSettings, IProjectWithDetails } from '../models/project.model.ts';

type MemberRole = 'OWNER' | 'MEMBER' | null;

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
            // JOIN to get the owner's display name
            .leftJoin('project_members as pm_owner', function () {
                this.on('pm_owner.projectId', '=', 'p.id').andOnVal('pm_owner.role', '=', 'OWNER');
            })
            .leftJoin('users as owner_u', 'owner_u.id', 'pm_owner.userId')
            // Only show private projects if the requesting user is already a member
            .where(function () {
                this.where('ps.isPublic', true).orWhereNotNull('pm.role');
            })
            .select(
                'p.id',
                'p.name',
                'p.userId',
                'p.createdAt',
                'ps.description',
                'ps.color',
                'ps.isPublic',
                'pm.role as memberRole',
                db.raw('COALESCE(owner_u.name, owner_u.email) as "ownerName"')
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
            memberRole: (row.memberRole as MemberRole) ?? null,
            memberCount: countMap.get(row.id as string) ?? 0,
            ownerName: (row.ownerName as string | null) ?? null,
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
            ownerName: null, // creator — already known by the caller
        };
    }

    /**
     * Deletes a project only if the requesting user is the OWNER.
     * The CASCADE constraints in the DB handle removing tasks, tags, settings, and memberships automatically.
     */
    /** Returns the role of a user in a project, or null if they are not a member. */
    async getMemberRole(projectId: string, userId: string): Promise<MemberRole> {
        const row = await db<IProjectMember>('project_members')
            .where({ projectId, userId })
            .select('role')
            .first();
        return (row?.role as 'OWNER' | 'MEMBER') ?? null;
    }

    async delete(projectId: string, requestingUserId: string): Promise<boolean> {
        const membership = await db<IProjectMember>('project_members')
            .where({ projectId, userId: requestingUserId, role: 'OWNER' })
            .first();

        if (!membership) {
            return false;
        }

        const deleted = await db<IProject>('projects').where({ id: projectId }).del();
        return deleted > 0;
    }

    // Adds the requesting user as MEMBER of a project.
    // Returns 'private' if the project is not public (must be invited by the owner instead).
    async join(projectId: string, userId: string): Promise<'joined' | 'already_member' | 'private'> {
        const settings = await db<IProjectSettings>('project_settings').where({ projectId }).first();
        if (settings && !settings.isPublic) {
            return 'private';
        }

        const existing = await db<IProjectMember>('project_members')
            .where({ projectId, userId })
            .first();

        if (existing) {
            return 'already_member';
        }

        await db<IProjectMember>('project_members').insert({
            userId,
            projectId,
            role: 'MEMBER',
            joinedAt: new Date(),
        });
        return 'joined';
    }

    // Owner directly invites a user to a private or public project by email.
    async addMember(
        projectId: string,
        email: string,
        requestingUserId: string
    ): Promise<'added' | 'not_owner' | 'user_not_found' | 'already_member'> {
        const ownership = await db<IProjectMember>('project_members')
            .where({ projectId, userId: requestingUserId, role: 'OWNER' })
            .first();
        if (!ownership) {
            return 'not_owner';
        }

        const user = await db('users').where({ email }).first() as { id: string } | undefined;
        if (!user) {
            return 'user_not_found';
        }

        const existing = await db<IProjectMember>('project_members')
            .where({ projectId, userId: user.id })
            .first();
        if (existing) { 
            return 'already_member';
        }

        await db<IProjectMember>('project_members').insert({
            userId: user.id,
            projectId,
            role: 'MEMBER',
            joinedAt: new Date(),
        });
        return 'added';
    }

    // Owner removes a member (non-owner) from a project.
    async removeMember(
        projectId: string,
        targetUserId: string,
        requestingUserId: string
    ): Promise<'removed' | 'not_owner' | 'not_member' | 'cannot_remove_owner'> {
        const ownership = await db<IProjectMember>('project_members')
            .where({ projectId, userId: requestingUserId, role: 'OWNER' })
            .first();
        if (!ownership) {
            return 'not_owner';
        }

        if (targetUserId === requestingUserId) {
            return 'cannot_remove_owner';
        }

        const membership = await db<IProjectMember>('project_members')
            .where({ projectId, userId: targetUserId })
            .first();
        if (!membership) {
            return 'not_member';
        }

        await db<IProjectMember>('project_members')
            .where({ projectId, userId: targetUserId })
            .del();
        return 'removed';
    }

    // Updates project settings (isPublic, color, description). Only the OWNER can do this.
    async updateSettings(
        projectId: string,
        requestingUserId: string,
        updates: { isPublic?: boolean; color?: string; description?: string | null }
    ): Promise<boolean> {
        const ownership = await db<IProjectMember>('project_members')
            .where({ projectId, userId: requestingUserId, role: 'OWNER' })
            .first();
        if (!ownership) {
            return false;
        }

        await db<IProjectSettings>('project_settings').where({ projectId }).update(updates);
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
    // Only accessible if the project is public or the requesting user is already a member.
    async getMembers(projectId: string, requestingUserId: string): Promise<{ userId: string; name: string | null; email: string; role: string; joinedAt: Date }[] | null> {
        const access = await db('project_settings as ps')
            .leftJoin('project_members as pm', function () {
                this.on('pm.projectId', '=', 'ps.projectId').andOn(
                    'pm.userId', '=', db.raw('?', [requestingUserId])
                );
            })
            .where('ps.projectId', projectId)
            .select('ps.isPublic', 'pm.role as memberRole')
            .first();

        // Project not found or user has no visibility (private + not a member)
        if (!access || (!access.isPublic && !access.memberRole)) {
            return null;
        }

        return db('project_members as pm')
            .join('users as u', 'u.id', 'pm.userId')
            .where('pm.projectId', projectId)
            .select('pm.userId', 'u.name', 'u.email', 'pm.role', 'pm.joinedAt');
    }

    /**
     * Returns email + name + lang for every member of a project.
     * Used internally by the notification system — no visibility check needed
     * because this is called after a task action has already been authorised.
     */
    /** Returns the project name for a given ID, or null if not found. */
    async getNameById(projectId: string): Promise<string | null> {
        const row = await db<IProject>('projects').where({ id: projectId }).select('name').first();
        return row ? row.name : null;
    }

    /** Returns the OWNER of a project with their email and preferred lang. */
    async getOwner(projectId: string): Promise<{ email: string; lang: 'en' | 'es'; name: string | null } | null> {
        const row = await db('project_members as pm')
            .join('users as u', 'u.id', 'pm.userId')
            .where({ 'pm.projectId': projectId, 'pm.role': 'OWNER' })
            .select('u.email', 'u.lang', 'u.name')
            .first();
        return row ? { email: row.email, lang: row.lang ?? 'en', name: row.name ?? null } : null;
    }

    async getMembersForNotification(projectId: string): Promise<{ email: string; name: string; lang: 'en' | 'es' }[]> {
        const rows = await db('project_members as pm')
            .join('users as u', 'u.id', 'pm.userId')
            .where('pm.projectId', projectId)
            .select('u.email', 'u.name', 'u.lang');

        return rows.map(r => ({
            email: r.email as string,
            name:  (r.name as string | null) ?? (r.email as string),
            lang:  (r.lang as 'en' | 'es') ?? 'en',
        }));
    }

    /**
     * Returns the task count and member count for a project.
     * Used by the delete confirmation dialog to warn the owner.
     */
    async getSummary(projectId: string): Promise<{ taskCount: number; memberCount: number }> {
        const [taskRow, memberRow] = await Promise.all([
            db('tasks').where({ projectId }).count('id as taskCount').first(),
            db('project_members').where({ projectId }).count('userId as memberCount').first(),
        ]);
        return {
            taskCount: Number(taskRow?.taskCount ?? 0),
            memberCount: Number(memberRow?.memberCount ?? 0),
        };
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
            memberRole: (updated.memberRole as MemberRole) ?? null,
            memberCount: Number(countRow?.memberCount ?? 0),
            ownerName: null,
        };
    }
}

export const projectDAO = new ProjectDAO();