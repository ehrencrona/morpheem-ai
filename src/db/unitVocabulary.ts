import { Language } from '../logic/types';
import { db } from './client';

export function getUnitVocabulary(unit: number, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('unit_vocabulary')
		.select(['word_id'])
		.where('unit', '=', unit)
		.execute();
}
