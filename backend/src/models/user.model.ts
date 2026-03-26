/**
 * User roles for Role-Based Access Control (RBAC).
 * Using 'as const' ensures compatibility with our Node v24 strict mode.
 */
export const UserRole = {
    ADMIN: 'ADMIN',
    USER: 'USER'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * Main User Interface.
 * Update: Added name and avatar_url for professional profile management.
 */
export interface IUser {
    id: string;
    email: string;
    password?: string; 
    name: string | null;  // Full name for UI personalization
    avatar_url: string;  // URL for profile picture
    role: UserRole;
    createdAt: Date;
}