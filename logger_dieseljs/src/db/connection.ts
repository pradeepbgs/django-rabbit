import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

export const db = drizzle(new Database(process.env.DB_FILE_NAME!));
    