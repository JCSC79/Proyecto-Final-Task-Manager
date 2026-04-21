import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { userDAO } from '../daos/user.dao.ts';
import type { IUser } from '../models/user.model.ts';

/**
 * BACKEND UNIT TESTS: AuthService
 * Strictly typed using dynamic imports to handle environment variables.
 * Complies with "Zero Any" policy from Phase 1.
 */
describe('AuthService - Identity & Access Control', () => {
    // We import the type of the exported instance to avoid the "no exported member" error
    let authService: typeof import('./auth.service.ts').authService;

    const mockUser: IUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'USER',
        createdAt: new Date()
    };

    const originalGetByEmail = userDAO.getByEmail;
    type BcryptCompare = (data: string | Buffer, encrypted: string) => Promise<boolean>;

    // 1. SETUP: Injecting secrets and importing the service instance dynamically
    before(async () => {
        process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters';
        const module = await import('./auth.service.ts');
        authService = module.authService;
    });

    test('should validate user with correct credentials', async () => {
        userDAO.getByEmail = (async (_email: string): Promise<IUser | undefined> => {
            return mockUser;
        }) as unknown as typeof userDAO.getByEmail;

        const originalCompare = bcrypt.compare;
        (bcrypt as unknown as { compare: BcryptCompare }).compare = async () => true;

        const result = await authService.validateUser('test@example.com', 'password123');

        assert.strictEqual(result.isSuccess, true);
        assert.strictEqual(result.getValue().user.email, 'test@example.com');
        
        // SECURITY CHECK: Ensure password is NOT leaked in the response
        const userResponse = result.getValue().user as Partial<IUser>;
        assert.strictEqual(userResponse.password, undefined);

        (bcrypt as unknown as { compare: BcryptCompare }).compare = originalCompare;
    });

    test('should fail validation if email does not exist', async () => {
        userDAO.getByEmail = (async (_email: string): Promise<undefined> => {
            return undefined;
        }) as unknown as typeof userDAO.getByEmail;

        const result = await authService.validateUser('fake@example.com', 'any_password');

        assert.strictEqual(result.isFailure, true);
        assert.strictEqual(result.error, 'Invalid credentials');
    });

    test('should block registration if email is already taken', async () => {
        userDAO.getByEmail = (async (_email: string): Promise<IUser> => {
            return mockUser;
        }) as unknown as typeof userDAO.getByEmail;

        const result = await authService.registerUser('test@example.com', 'password123');

        assert.strictEqual(result.isFailure, true);
        assert.strictEqual(result.error, 'Email already in use');
    });

    test('should generate a valid JWT token on successful login', async () => {
        userDAO.getByEmail = (async (_email: string): Promise<IUser> => {
            return mockUser;
        }) as unknown as typeof userDAO.getByEmail;
        
        const originalCompare = bcrypt.compare;
        (bcrypt as unknown as { compare: BcryptCompare }).compare = async () => true;

        const result = await authService.validateUser('test@example.com', 'password123');

        assert.strictEqual(result.isSuccess, true);
        assert.ok(result.getValue().token);
        assert.strictEqual(typeof result.getValue().token, 'string');

        (bcrypt as unknown as { compare: BcryptCompare }).compare = originalCompare;
    });

    // Final cleanup to ensure DAO state is restored
    test('cleanup', () => {
        userDAO.getByEmail = originalGetByEmail;
    });
});