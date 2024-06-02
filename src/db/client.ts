import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from 'kysely-codegen';
import pg from 'pg';

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL as string;

const { Pool } = pg;

const pool = new Pool({
	connectionString: DATABASE_URL,
	ssl: !DATABASE_URL.includes('localhost')
});

export const adapter = new NodePostgresAdapter(pool, {
	user: 'auth_user',
	session: 'user_session'
});

export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool
	})
});
