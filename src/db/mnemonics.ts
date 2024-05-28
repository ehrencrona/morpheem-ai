import { Language } from '../logic/types';
import { db } from './client';

export async function setMnemonic({
	wordId,
	userId,
	mnemonic,
	language
}: {
	wordId: number;
	userId: number;
	mnemonic: string;
	language: Language;
}): Promise<void> {
	await db
		.withSchema(language.schema)
		.insertInto('mnemonics')
		.values({ word_id: wordId, user_id: userId, mnemonic })
		.onConflict((oc) => oc.columns(['user_id', 'word_id']).doUpdateSet({ mnemonic }))
		.execute();
}

export async function getMnemonic({
	wordId,
	userId,
	language
}: {
	wordId: number;
	userId: number;
	language: Language;
}): Promise<string | undefined> {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('mnemonics')
			.select('mnemonic')
			.where('word_id', '=', wordId)
			.where('user_id', '=', userId)
			.executeTakeFirst()
	)?.mnemonic;
}
