const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function(knex) {
  const saltRounds = 10;
  // Hashing default passwords for secure initial access
  const adminPassword = await bcrypt.hash('AdminPassword123!', saltRounds);
  const userPassword = await bcrypt.hash('UserPassword123!', saltRounds);

  // Clean existing users to prevent primary key collisions
  await knex('users').del();

  await knex('users').insert([
    {
      id: crypto.randomUUID(),
      email: 'admin@test.com',
      password: adminPassword,
      role: 'ADMIN',
      name: 'Super Admin',
      createdAt: new Date()
    },
    {
      id: crypto.randomUUID(),
      email: 'user@test.com',
      password: userPassword,
      role: 'USER',
      name: 'Regular User',
      createdAt: new Date()
    }
  ]);
  
  console.log('[+] Admin and Regular users seeded successfully');
};