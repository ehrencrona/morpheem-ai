import { db } from './client';

export async function setMnemonic({
	wordId,
	userId,
	mnemonic
}: {
	wordId: number;
	userId: number;
	mnemonic: string;
}): Promise<void> {
	await db
		.insertInto('mnemonics')
		.values({ word_id: wordId, user_id: userId, mnemonic })
		.onConflict((oc) => oc.columns(['user_id', 'word_id']).doUpdateSet({ mnemonic }))
		.execute();
}

export async function getMnemonic({
	wordId,
	userId
}: {
	wordId: number;
	userId: number;
}): Promise<string | undefined> {
	return (
		await db
			.selectFrom('mnemonics')
			.select('mnemonic')
			.where('word_id', '=', wordId)
			.where('user_id', '=', userId)
			.executeTakeFirst()
	)?.mnemonic;
}
