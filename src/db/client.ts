import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from 'kysely-codegen';
import pg from 'pg';

const DATABASE_URL = 'postgres://andreasehrencrona@localhost/morpheem';

const { Pool } = pg;

export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: DATABASE_URL
		})
	})
});
