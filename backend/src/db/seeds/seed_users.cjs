const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function(knex) {
  const saltRounds = 10;
  // Hashing default passwords for secure initial access
  const adminPassword = await bcrypt.hash('AdminPassword123!', saltRounds);
  const userPassword = await bcrypt.hash('123456J', saltRounds);

  // Clean existing users to prevent primary key collisions
  await knex('users').del();

  // Initial set with default Admin and Regular User 
  const users = [
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
  ];

  // Automating the creation of 15 additional users for stress testing 
  for (let i = 1; i <= 15; i++) {
    users.push({
      id: crypto.randomUUID(),
      email: `user${i}@test.com`,
      password: userPassword,
      role: 'USER',
      name: `Test User ${i}`,
      createdAt: new Date()
    });
  }

  await knex('users').insert(users);
  
  console.log(`[+] Admin and ${users.length - 1} users seeded successfully`);
};