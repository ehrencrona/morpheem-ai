import { ask } from './ask';

export async function findCognates(words: string[], temperature = 0): Promise<string[]> {
	// single-letter words are translates as a letter and thus always cognate
	words = words.filter((word) => word.length > 1);

	const response = await ask({
		messages: [
			{
				role: 'system',
				content: `I want to find which Polish words have English cognates. For each entered word, print the most similar sounding English translation with spaces between each letter. Then, if the Polish word would look instantly familiar to an English speaker, print "cognate". If not, print "no". For names print "name". Do not print anything more. E.g. 
maszyna: m a c h i n e, cognate
chopin: C h o p i n, name
wierzyć: b e l i e v e, no
książka: b o o k, no
gdansk: G d a n s k, name
botanik: b o t a n i s t, cognate
antywirusowy: a n t i v i r u s, cognate
chwila: m o m e n t, no
armia: a r m y, cognate
mój: m y, cognate
spotkanie: m e e t i n g, no`
			},
			{ role: 'user', content: words.join('\n') }
		],
		model: 'llama3-70b-8192',
		temperature
	});

	console.log({ response });

	const lines = response!.split('\n').map((word) => word.trim());

	let cognates: string[] = [];
	let wordsReturned: string[] = [];

	for (const line of lines) {
		if (line.includes(':')) {
			const [word, rest] = line.split(':');
			const [translation, type] = rest.split(', ');

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

			if (type == 'cognate' || type == 'name') {
				cognates.push(word);
			}

			wordsReturned.push(word);
		}
	}

	if (wordsReturned.length < words.length - 2) {
		console.warn(
			`Not enough words returned. Got ${response}. Requested words: ${words.join(', ')}`
		);
	}

	return cognates;
}
