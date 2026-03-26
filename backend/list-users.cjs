const knex = require('knex');
const config = require('./knexfile.cjs');
const db = knex(config.development);

async function listUsers() {
  try {
    const users = await db('users').select('id', 'email', 'role', 'createdAt');
    
    console.log('\nUsers in Database:\n');
    console.log('┌────────────────────┬────────────────┬──────────────────────────────────────┐');
    console.log('│ Email              │ Role           │ ID                                   │');
    console.log('├────────────────────┼────────────────┼──────────────────────────────────────┤');
    
    users.forEach(user => {
      console.log(`│ ${user.email.padEnd(18)} │ ${user.role.padEnd(14)} │ ${user.id} │`);
    });
    
    console.log('└────────────────────┴────────────────┴──────────────────────────────────────┘\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listUsers();
