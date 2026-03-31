import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { userDAO } from '../daos/user.dao.ts';
import { Result } from '../utils/result.ts';
import type { IUser } from '../models/user.model.ts';

// Secret key from .env to sign the tokens
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET_SAFE = JWT_SECRET as string;

/**
 * AuthService - Handles the business logic for authentication and JWT generation.
 */
class AuthService {
    /**
     * Validates user credentials and generates a secure JWT Token.
     * @returns A Result object containing the user (without password) and the token.
     */
    async validateUser(email: string, password: string): Promise<Result<{ user: Omit<IUser, 'password'>, token: string }>> {
        const user = await userDAO.getByEmail(email);

        if (!user) {
            return Result.fail('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return Result.fail('Invalid credentials');
        }

        // Generate the Token (Payload contains ID, Email and Role)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET_SAFE,
            { expiresIn: '24h' } // Token expires in one day
        );

        // Security: Remove password before returning user data
        const { password: _, ...userWithoutPassword } = user;
        
        return Result.ok({
            user: userWithoutPassword,
            token: token
        });
    }

    /**
     * Registers a new user. Email must be unique.
     * New users always get the USER role — admins are seeded or promoted via admin panel.
     */
    async registerUser(
        email: string,
        password: string,
        name?: string
    ): Promise<Result<{ user: Omit<IUser, 'password'>; token: string }>> {
        const existing = await userDAO.getByEmail(email);
        if (existing) {
            return Result.fail('Email already in use');
        }

        const hashed = await bcrypt.hash(password, 10);
        const newUser: IUser = {
            id: randomUUID(),
            email,
            password: hashed,
            role: 'USER',
            ...(name ? { name } : {}),
            createdAt: new Date(),
        };

        await userDAO.create(newUser);

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET_SAFE,
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = newUser;
        return Result.ok({ user: userWithoutPassword, token });
    }
}

export const authService = new AuthService();