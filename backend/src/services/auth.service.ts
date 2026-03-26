import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; 
import { userDAO } from '../daos/user.dao.ts';
import { UserRole } from '../models/user.model.ts';
import type { IUser } from '../models/user.model.ts';
import { Result } from '../utils/result.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-2026';
const SALT_ROUNDS = 10;

/**
 * Service handling Authentication logic: Registration and Login.
 * Implements role-based profile updates and strict security.
 */
export class AuthService {
    
    /**
     * Registers a new user with password hashing and automatic avatar.
     * SHIELD: Every new user is forced to UserRole.USER.
     */
    async register(email: string, password: string, name?: string): Promise<Result<IUser>> {
        const existingUser = await userDAO.getByEmail(email);
        if (existingUser) {
            return Result.fail<IUser>("Email already registered");
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');

        const newUser: IUser = {
            id: crypto.randomUUID(),
            email,
            password: hashedPassword,
            name: name ?? null,
            avatar_url: `https://www.gravatar.com/avatar/${emailHash}?d=identicon`,
            role: UserRole.USER, // FIXED: Force standard user on registration
            createdAt: new Date()
        };

        const createdUser = await userDAO.create(newUser);
        const { password: _, ...userWithoutPassword } = createdUser;
        return Result.ok(userWithoutPassword as IUser);
    }

    async login(email: string, password: string): Promise<Result<{ token: string, user: Partial<IUser> }>> {
        const user = await userDAO.getByEmail(email);
        if (!user || !user.password) {
            return Result.fail<{ token: string, user: Partial<IUser> }>("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return Result.fail<{ token: string, user: Partial<IUser> }>("Invalid credentials");
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name, avatar: user.avatar_url },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        const userProfile: Partial<IUser> = {
            email: user.email,
            name: user.name ?? null,
            avatar_url: user.avatar_url ?? null,
            role: user.role
        };

        return Result.ok({ token, user: userProfile });
    }

    /**
     * Updates user profile information.
     * FIXED: Added 'role' parameter to match the controller call.
     */
    async updateProfile(userId: string, name: string, role?: string): Promise<Result<IUser>> {
        try {
            // Prepare update object dynamically
            const updateData: any = { name };
            
            // Only update role if it's explicitly passed (validated by controller)
            if (role) {
                updateData.role = role;
            }

            const updatedUser = await userDAO.update(userId, updateData);
            
            if (!updatedUser) {
                return Result.fail<IUser>("User not found");
            }

            // Security: Remove password before returning user data
            const { password, ...userWithoutPassword } = updatedUser;
            return Result.ok(userWithoutPassword as IUser);
        } catch (error) {
            console.error("Update Profile Error:", error);
            return Result.fail<IUser>("Error updating profile information");
        }
    }
}

export const authService = new AuthService();