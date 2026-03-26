/**
 * ADMIN USER CREATION SCRIPT
 * Run: node create-admin.cjs
 * 
 * This script creates an ADMIN user in the database for testing purposes.
 * Email: admin@test.com
 * Password: AdminPassword123!
 * Role: ADMIN
 */

const knex = require('knex');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = require('./knexfile.cjs');
const db = knex(config.development);

async function createAdminUser() {
  try {
    console.log('Creating ADMIN user...\n');

    const adminEmail = 'admin@test.com';
    const adminPassword = 'AdminPassword123!';
    const adminRole = 'ADMIN';

    // Check if admin already exists
    const existingAdmin = await db('users').where({ email: adminEmail }).first();
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the admin user
    const adminUser = {
      id: crypto.randomUUID(),
      email: adminEmail,
      password: hashedPassword,
      role: adminRole,
      createdAt: new Date(),
    };

    await db('users').insert(adminUser);

    console.log('ADMIN user created successfully!\n');
    console.log('Credentials:');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role:     ${adminRole}\n`);
    console.log('You can now login with these credentials and access the Admin Panel.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
