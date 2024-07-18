import { Language } from '../logic/types';
import { db } from './client';

export function getUnits(language: Language) {
	return db.withSchema(language.code).selectFrom('units').orderBy('id').selectAll().execute();
}
