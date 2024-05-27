import { generateMnemonic as generateMnemonicAi } from '../ai/generateMnemonic';
import { getMnemonic, setMnemonic } from '../db/mnemonics';

export async function generateMnemonic(
	word: { id: number; word: string },
	userId: number,
	languagesSpoken: string,
	forceRegenerate: boolean = false
) {
	let mnemonic = forceRegenerate ? undefined : await getMnemonic({ wordId: word.id, userId });

	if (!mnemonic) {
		mnemonic = await generateMnemonicAi(word.word, languagesSpoken);

		await setMnemonic({ wordId: word.id, userId, mnemonic });
	}

	return mnemonic;
}
