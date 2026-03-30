import bcrypt from 'bcrypt';
import { userDAO } from '../daos/user.dao.ts';
import { Result } from '../utils/result.ts';
import type { IUser } from '../models/user.model.ts'; // Added import

/**
 * AuthService - Handles the business logic for authentication.
 * Uses the Result Pattern for consistent error handling.
 */
class AuthService {
    /**
     * Validates user credentials and prepares for token generation.
     */
    async validateUser(email: string, password: string): Promise<Result<Omit<IUser, 'password'>>> {
        const user = await userDAO.getByEmail(email);

        if (!user) {
            return Result.fail('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return Result.fail('Invalid credentials');
        }

        // Return user data (excluding password) for security
        const { password: _, ...userWithoutPassword } = user;
        return Result.ok(userWithoutPassword);
    }
}

export const authService = new AuthService();