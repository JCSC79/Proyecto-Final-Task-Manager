/**
 * REGULAR USER CREATION SCRIPT
 * Run: node create-user.cjs
 * 
 * This script creates a regular USER (non-admin) for testing purposes.
 * Email: user@test.com
 * Password: UserPassword123!
 * Role: USER
 */

const knex = require('knex');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = require('./knexfile.cjs');
const db = knex(config.development);

async function createRegularUser() {
  try {
    console.log('Creating regular USER...\n');

    const userEmail = 'user@test.com';
    const userPassword = 'UserPassword123!';
    const userRole = 'USER';

    // Check if user already exists
    const existingUser = await db('users').where({ email: userEmail }).first();
    if (existingUser) {
      console.log('User already exists!');
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create the regular user
    const regularUser = {
      id: crypto.randomUUID(),
      email: userEmail,
      password: hashedPassword,
      role: userRole,
      createdAt: new Date(),
    };

    await db('users').insert(regularUser);

    console.log('Regular USER created successfully!\n');
    console.log('Credentials:');
    console.log(`Email:    ${userEmail}`);
    console.log(`Password: ${userPassword}`);
    console.log(`Role:     ${userRole}\n`);
    console.log('Use this account to test privilege escalation protection.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
}

createRegularUser();
