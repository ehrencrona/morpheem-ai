import { generateMnemonic as generateMnemonicAi } from '../ai/generateMnemonic';
import { getMnemonic, setMnemonic } from '../db/mnemonics';
import { Language } from './types';

export async function generateMnemonic(
	word: { id: number; word: string },
	userId: number,
	language: Language,
	forceRegenerate: boolean = false
) {
	let mnemonic = forceRegenerate
		? undefined
		: await getMnemonic({ wordId: word.id, userId, language });

	if (!mnemonic) {
		mnemonic = await generateMnemonicAi(word.word, language);

		await setMnemonic({ wordId: word.id, userId, mnemonic, language });
	}

	return mnemonic;
}
