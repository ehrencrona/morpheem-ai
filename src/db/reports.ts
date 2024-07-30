import { Language } from '../logic/types';
import { db } from './client';

export async function storeReport({
	email,
	sentenceId,
	userId,
	report,
	exercise,
	language
}: {
	email: string;
	sentenceId: number;
	userId: number;
	report?: string;
	exercise?: any;
	language: Language;
}) {
	await db
		.withSchema(language.schema)
		.insertInto('reports')
		.values({
			email,
			sentence_id: sentenceId,
			user_id: userId,
			report,
			exercise: JSON.stringify(exercise)
		})
		.execute();
}
