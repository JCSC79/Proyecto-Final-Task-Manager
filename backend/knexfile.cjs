/**
 * Knex configuration for Task Manager Backend.
 * Uses PostgreSQL for persistent storage.
 * * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      // If the DB_HOST variable exists (which we send through Docker), use it.
      // else, default to localhost for local development.
      host: process.env.DB_HOST || '127.0.0.1',
      port: 5432,
      user: process.env.DB_USER || 'postgres',
      password: (() => {
        if (!process.env.DB_PASSWORD) {
          throw new Error('DB_PASSWORD environment variable is required but not set.');
        }
        return process.env.DB_PASSWORD;
      })(),
      database: process.env.DB_NAME || 'tasks_db'
    },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  }
};