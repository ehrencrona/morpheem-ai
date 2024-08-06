import { isSeparator, toWordsWithSeparators } from '../toWordStrings';
import type { Clause } from '../../db/types';

export interface Fragment {
	fragment: string;
	clauses: Clause[];
}

export function translationToFragments(englishSentence: string, clauses: Clause[]): Fragment[] {
	const englishWords = toWordsWithSeparators(englishSentence, { code: 'en' });

	const escape = (string: string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	const matchWord = (string: string) => new RegExp(`\\b${escape(string.toLowerCase())}\\b`);

	let fragments: Fragment[] = [];

	let atWord = 0;

	while (atWord < englishWords.length) {
		const wordString = englishWords[atWord];

		const regexp = matchWord(wordString);
		const fragmentClauses = clauses.filter((clause) => regexp.test(clause.english.toLowerCase()));

		if (!isSeparator(wordString) && fragmentClauses.length) {
			let current = {
				words: [wordString],
				clauses: fragmentClauses
			};
			let didFind = false;

			function foundFragment() {
				let lastWord = current.words.pop()!;

				if (isSeparator(lastWord)) {
					fragments.push({
						fragment: current.words.join(''),
						clauses: current.clauses
					});

					fragments.push({ fragment: lastWord, clauses: [] });
				} else {
					fragments.push({
						fragment: current.words.join('') + lastWord,
						clauses: current.clauses
					});
				}
			}

			for (
				let fragmentLength = 1;
				fragmentLength < englishWords.length - atWord;
				fragmentLength++
			) {
				const word = englishWords[atWord + fragmentLength];
				let fragmentString = current.words.join('') + word;

				const regexp = matchWord(fragmentString);
				const fragmentClauses = clauses.filter((clause) =>
					regexp.test(clause.english.toLowerCase())
				);

				if (fragmentClauses.length == 0) {
					foundFragment();

					atWord += fragmentLength;

					didFind = true;
					break;
				} else {
					current = {
						words: current.words.concat(word),
						clauses: fragmentClauses
					};
				}
			}

			if (!didFind) {
				foundFragment();

				atWord = englishWords.length;
			}
		} else {
			fragments.push({ fragment: wordString, clauses: [] });

			atWord++;
		}
	}

	for (let at = fragments.length - 1; at >= 1; at--) {
		if (fragments[at].clauses.length == 0 && fragments[at - 1].clauses.length == 0) {
			fragments[at - 1] = {
				fragment: fragments[at - 1].fragment + fragments[at].fragment,
				clauses: []
			};

			fragments.splice(at, 1);
		}
	}

	return fragments;
}
