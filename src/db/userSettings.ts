import { Language } from '../logic/types';
import { db } from './client';

export function getUserSettings(userId: number, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('user_settings')
		.selectAll()
		.where('user_id', '=', userId)
		.executeTakeFirst();
}

export function updateUserSettings(
	{ unit }: { unit: number | null | undefined },
	userId: number,
	language: Language
) {
	return db
		.withSchema(language.schema)
		.insertInto('user_settings')
		.values({ user_id: userId, unit })
		.onConflict((oc) =>
			oc.column('user_id').doUpdateSet({
				unit
			})
		)
		.execute();
}
