import { CodedError } from '../CodedError';
import { WordType } from '../db/types';
import { Language, LanguageCode } from '../logic/types';
import { ask } from './ask';
import { lemmatizeSentences } from './lemmatize';

export type LemmaType = WordType | 'inflection' | 'wrong';

export async function classifyLemmas(
	lemmas: string[],
	{
		throwOnInvalid,
		language,
		retriesLeft = 1
	}: { throwOnInvalid: boolean; language: Language; retriesLeft?: number }
): Promise<
	{
		lemma: string;
		type: LemmaType | undefined;
	}[]
> {
	if (lemmas.length == 0) {
		return [];
	}

	const examples: Record<LanguageCode, string> = {
		pl: `maszyna: machine, cognate
		chopin: Chopin, name
		wierzyć: believe, other
		książka: book, other
		gdansk: Gdansk, name
		fabryki: factories, inflection
		botanik: botanist, cognate
		antywirusowy: antivirus, cognate
		mariusz: marius, name
		nie: no, other
		wstawać: get up, other
		się: oneself, particle
		chwila: moment, other
		to: this, particle
		z: with, other
		można: can, inflection
		tortu: cake, inflection
		armia: army, cognate
		mój: my, cognate
		spotkanie: meeting, other`,
		fr: `machine: machine, cognate
		napoléon: Napoleon, name
		croire: believe, other
		le: the, particle
		sont: are, inflection
		livre: book, other
		con: with, other
		europa: Europe, name
		botanique: botanical, cognate
		louis: Louis, name
		instant: moment, other
		armée: army, cognate
		`,
		es: `máquina: machine, cognate
		chopin: Chopin, name
		mi: my, cognate
		de: of, particle
		creer: believe, other
		lo: the, particle
		cansado: tired, other
		trabajo: work, other
		debido: due, other
		madrid: Madrid, name
		irse: to go, inflection
		con: with, other
		baile: danza, cognate
		venta: vendita, cognate
		`,
		ko: `치즈: cheese, cognate
		서연의: Seoyeon's, inflection
		서연: Seoyeon, name
		같다: to be the same, other
		를: object, particle
		마: imperative, particle
		들: plural, particle
		민준아: Minjoon, inflection
		초콜릿: chocolate, cognate
		보고서: report, other
		한다: does, particle
		버스: bus, cognate
		`,
		nl: `machine: machine, cognate
		piet: piet, name
		boek: book, other
		rome: Rome, name
		't: the, particle
		de: the, particle
		armee: army, cognate
		`,
		ru: `машина: machine, cognate
		книга: book, other
		саша: Sasha, name
		в: in, particle
		`
	};

	const cognateTo = 'English';

	const response = await ask({
		messages: [
			{
				role: 'system',
				content:
					// `I want to find which  words have ${cognateTo} cognates. ` +
					`For each entered ${language.name} word, print it and the most similar sounding ${cognateTo} translation.` +
					`Then, classify the word:\n` +
					` - if the word is an inflection different from the dictionary form, print "inflection".\n` +
					` - if the word is a name, print "name".\n` +
					` - if the word cannot be translated to English because it is a purely grammatical feature, print "particle".\n` +
					` - if it is not a correct word, print "wrong".\n` +
					` - otherwise, if the ${language.name} word would look instantly familiar to an ${cognateTo} speaker, print "cognate". ` +
					`Otherwise, print "other". Do not print anything more. E.g. \n${examples[language.code]}`
			},
			{ role: 'user', content: lemmas.join('\n') }
		],
		model: 'gpt-4o',
		temperature: 0.5,
		logResponse: true
	});

	const lines = response!.split('\n').map((word) => word.trim());

	let result: { lemma: string; type: LemmaType | undefined }[] = [];

	for (const line of lines) {
		if (line.includes(':')) {
			const [word, rest] = line.split(':');
			let [translation, type] = rest.split(', ');
			translation = translation.replaceAll(' ', '');

			// it sometimes decides not to translate the word after all
			if (type == undefined) {
				type = translation;
				translation = '';
			}

			if (!lemmas.includes(word)) {
				if (!word.startsWith('Here')) {
					console.warn(`Non-requested word: ${word}. Requested words: ${lemmas.join(', ')}`);
				}

				continue;
			}

			if (!['cognate', 'inflection', 'particle', 'wrong', 'other', 'name'].includes(type)) {
				console.warn(`Unexpected type: ${type} on line ${line}`);
				continue;
			}

			if (type == 'cognate' && !isPlausibleCognate(word, translation, language)) {
				console.warn(`${word} is not a plausible cognate: ${translation}`);

				type = 'other';
			}

			if (word.length == 1 && language.code != 'ko' && type == 'cognate') {
				console.warn(`${word} is a single letter and probably misinterpreted as a cognate`);

				type = 'other';
			}

			result.push({ lemma: word, type: type == 'other' ? undefined : (type as LemmaType) });
		}
	}

	const inflected = result.filter(({ type }) => type == 'inflection').map(({ lemma }) => lemma);

	if (inflected) {
		const lemmas = await lemmatizeSentences(inflected, { language });

		inflected.forEach((inflection, i) => {
			if (inflection == lemmas[i][0]) {
				console.warn(`${inflection} classified as inflection, but it is actually a lemma.`);

				result.find(({ lemma }) => lemma == inflection)!.type = undefined;
			}
		});
	}

	const invalid = result.filter(({ type }) => type && ['inflection', 'wrong'].includes(type));

	if (invalid.length && throwOnInvalid) {
		throw new CodedError(
			`Invalid lemmas: ${invalid.map(({ lemma, type }) => `${lemma} (${type})`).join(', ')}`,
			'notALemma'
		);
	}

	if (result.length < lemmas.length) {
		const missing = lemmas.filter((lemma) => !result.some((r) => r.lemma == lemma));

		if (retriesLeft > 0) {
			result = result.concat(
				await classifyLemmas(missing, { throwOnInvalid, language, retriesLeft: retriesLeft - 1 })
			);
		} else {
			throw new Error(
				`Not enough words returned (${result.length} vs ${lemmas.length}). Got ${response}. Missing words: ${missing.join(
					', '
				)}`
			);
		}
	}

	return result;
}

function isPlausibleCognate(word: string, translation: string, language: Language) {
	if (!language.isLatin) {
		// no idea how to check for non-Latin cognates
		return true;
	}

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
				content: `List those of the following Korean words that are derived from (or same as in) English. One word per line. Print nothing else.`
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
