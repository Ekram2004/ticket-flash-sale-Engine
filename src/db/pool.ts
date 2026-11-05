import pg from 'pg';
import dotenv from 'dotenv';


dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('FATAL ERROR: DATABASE_URL environment variable is missing.');
    process.exit(1);
}

const { Pool } = pg;

export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

db.on('error', (err) => {
    console.error('Unexpected error on idle database client', err)
});
