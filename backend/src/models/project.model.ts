/**
 * Project Model - Defines the workspace structure.
 *
 * userId is the original creator column kept for backward compatibility.
 * Step 2 adds the related tables but does not rename the column yet —
 * that rename happens in the next dedicated migration.
 */
export interface IProject {
    id: string;
    name: string;
    userId: string;     // Creator of the project (original owner)
    createdAt: Date;
}

/**
 * Project settings — 1:1 with projects.
 * The projectId field is both PK and FK in the database.
 */
export interface IProjectSettings {
    projectId: string;
    description: string | null;
    color: string;       // 7-char hex, e.g. '#4c90f0'
    isPublic: boolean;
    createdAt: Date;
}

/**
 * Project member — row from the N:M junction table project_members.
 */
export interface IProjectMember {
    userId: string;
    projectId: string;
    role: 'OWNER' | 'MEMBER';
    joinedAt: Date;
}

/**
 * Enriched project view returned by the API.
 * Combines the project row with its settings and the requesting
 * user's membership role (null means the user is not a member yet).
 */
export interface IProjectWithDetails extends IProject {
    settings: IProjectSettings;
    memberRole: 'OWNER' | 'MEMBER' | null;
    memberCount: number;
    ownerName: string | null;
}