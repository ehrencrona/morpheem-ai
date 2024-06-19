import { Language } from '../logic/types';
import { ask } from './ask';

export async function findCognates(words: string[], language: Language): Promise<string[]> {
	if (language.code == 'ko') {
		return findKoreanCognates(words);
	}

	// single-letter words are translated as a letter and thus always cognate
	words = words.filter((word) => word.length > 1);

	const examples = {
		pl: `maszyna: m a c h i n e, cognate
		chopin: C h o p i n, name
		wierzyć: b e l i e v e, no
		książka: b o o k, no
		gdansk: G d a n s k, name
		botanik: b o t a n i s t, cognate
		antywirusowy: a n t i v i r u s, cognate
		mariusz: m a r i u s, name
		chwila: m o m e n t, no
		armia: a r m y, cognate
		mój: m y, cognate
		spotkanie: m e e t i n g, no`,
		fr: `machine: m a c h i n e, cognate
		napoléon: N a p o l e o n, name
		croire: b e l i e v e, no
		livre: b o o k, no
		paris: P a r i s, name
		botanique: b o t a n i c a l, cognate
		louis: L o u i s, name
		instant: m o m e n t, no
		armée: a r m y, cognate
		`,
		es: `máquina: m a c c h i n a, cognate
		chopin: C h o p i n, name
		mi: m i o, cognate
		de: d i, cognate
		creer: c r e d e r e, cognate
		trabajo: l a v o r o, no
		madrid: M a d r i d, name
		baile: d a n z a, cognate
		venta: v e n d i t a, cognate
		`
	};

	const cognateTo = 'English';

	const response = await ask({
		messages: [
			{
				role: 'system',
				content:
					`I want to find which ${language.name} words have ${cognateTo} cognates. ` +
					`For each entered word, print it and the most similar sounding ${cognateTo} translation with spaces between each letter. ` +
					`Then, if the ${language.name} word would look instantly familiar to an ${cognateTo} speaker, print "cognate". ` +
					`If not, print "no". For names print "name". Do not print anything more. E.g. \n${examples[language.code]}`
			},
			{ role: 'user', content: words.join('\n') }
		],
		model: 'gpt-4o',
		temperature: 0,
		logResponse: true
	});

	const lines = response!.split('\n').map((word) => word.trim());

	let cognates: string[] = [];
	let wordsReturned: string[] = [];

	for (const line of lines) {
		if (line.includes(':')) {
			const [word, rest] = line.split(':');
			let [translation, type] = rest.split(', ');
			translation = translation.replaceAll(' ', '');

			if (!words.includes(word)) {
				if (!word.startsWith('Here')) {
					console.warn(`Non-requested word: ${word}. Requested words: ${words.join(', ')}`);
				}

				continue;
			}

			if (!['cognate', 'no', 'name'].includes(type)) {
				console.warn(`Unexpected type: ${type} on line ${line}`);
				continue;
			}

			if (type == 'cognate' && isPlausibleCognate(word, translation)) {
				cognates.push(word);
			}

			if (type == 'name') {
				cognates.push(word);
			}

			wordsReturned.push(word);
		}
	}

	if (wordsReturned.length < words.length - 2) {
		console.warn(
			`Not enough words returned (${wordsReturned.length} vs ${words.length}). Got ${response}. Requested words: ${words.join(', ')}`
		);
	}

	return cognates;
}

function isPlausibleCognate(word: string, translation: string) {
	const wordLetters = word.split('');
	const translationLetters = translation.split('');

	let commonLetters = 0;

	for (const letter of wordLetters) {
		if (translationLetters.includes(letter)) {
			commonLetters++;
		}
	}

	const isPlausible = commonLetters >= Math.floor(Math.min(word.length, translation.length) / 2);

	if (!isPlausible) {
		console.log(`Not a plausible cognate: ${word} - ${translation}`);
	}

	return isPlausible;
}

async function findKoreanCognates(words: string[]) {
	const response = await ask({
		messages: [
			{
				role: 'system',
				content: `List those of the following Korean words that are derived from English. One word per line. Print nothing else.`
			},
			{ role: 'user', content: words.join('\n') }
		],
		model: 'gpt-4o',
		temperature: 0,
		logResponse: true
	});

	const lines = response!.split('\n').map((word) => word.trim());

	return lines;
}
