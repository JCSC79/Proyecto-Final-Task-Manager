/**
 * User Model - Defines the identity structure within the system.
 * Aligned with the database schema for strict type safety.
 */

export const UserRole = {
    ADMIN: 'ADMIN',
    USER: 'USER'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface IUser {
    id: string;          // UUID v4 identifier
    email: string;       // Unique user credential
    password: string;    // Hashed with bcrypt
    role: UserRole;      // Access control: ADMIN or USER
    name?: string;       // Optional display name
    avatar_url?: string; // Optional profile image link
    createdAt: Date;     // Registration timestamp
}