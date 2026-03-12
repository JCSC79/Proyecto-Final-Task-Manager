import knex from 'knex';
// Import the Knex configuration for development environment
import config from './knexfile.cjs';

const db = knex(config.development);

async function showTasks() {
  try {
    const tasks = await db('tasks').select('*');
    console.log("--- TASKS IN POSTGRESQL ---");
    console.table(tasks); // this will display the tasks in a table format in the console
    console.log("---------------------------");
  } catch (error) {
    console.error("Error connecting to DB:", error);
  } finally {
    await db.destroy();
  }
}

showTasks();