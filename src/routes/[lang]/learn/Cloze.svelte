<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { filterUndefineds } from '$lib/filterUndefineds';
	import ErrorComponent from '../../../components/Error.svelte';
	import Speak from '../../../components/Speak.svelte';
	import { KNOWLEDGE_TYPE_CLOZE, KNOWLEDGE_TYPE_READ } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { toWords, toWordsWithSeparators } from '../../../logic/toWords';
	import type { Language, SentenceWord } from '../../../logic/types';
	import { fetchClozeEvaluation } from '../api/cloze/client';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import { fetchInflections } from '../api/word/[id]/inflections/client';
	import { fetchMnemonic } from '../api/word/[id]/mnemonic/client';
	import { fetchWordsByPrefix } from '../api/word/prefix/[prefix]/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import Ama from './AMA.svelte';
	import ClozeDumb from './ClozeDumb.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word;
	export let sentenceWords: SentenceWord[];
	export let knowledge: DB.AggKnowledgeForUser[] | undefined = undefined;
	export let language: Language;
	export let sendKnowledge: SendKnowledge;
	export let source: DB.ExerciseSource;
	export let exercise: 'cloze' | 'cloze-inflection' = 'cloze';

	let evaluation: string | undefined = undefined;

	let error: any;
	let isLoadingSuggestions = false;
	let revealed: UnknownWordResponse[] = [];

	$: if (sentence.id) {
		revealed = [];
	}

	async function onUnknown(word: string) {
		const unknownWord = await lookupUnknownWord(word, sentence.id);

		revealed = dedupUnknown([...revealed, unknownWord]);
	}

	async function onRemoveUnknown(word: string) {
		revealed = revealed.filter((r) => r.word !== word);
	}

	export let onNext: () => Promise<any>;

	let englishWord: string | undefined = undefined;
	let englishSentence: string | undefined = undefined;
	let mnemonic: string | undefined = undefined;
	let showChars = 0;
	let suggestedWords: string[] = [];
	let answered: string | undefined;
	let answeredLemma: string | undefined;
	let isCorrectLemma: boolean | undefined;
	let isCorrectInflection: boolean | undefined;

	let inflections: string[] = [];

	async function clear() {
		showChars = 0;
		suggestedWords = [];
		answered = undefined;
		answeredLemma = undefined;
		isCorrectLemma = undefined;
		isCorrectInflection = undefined;
		englishWord = undefined;
		englishSentence = undefined;
		evaluation = undefined;
		mnemonic = undefined;
		inflections = [];
		error = undefined;

		[mnemonic, inflections] = await Promise.all([
			fetchMnemonic(word.id, false),
			fetchInflections(word.id)
		]);

		if (exercise == 'cloze-inflection') {
			suggestedWords = inflections;
			answeredLemma = word.word;
			isCorrectLemma = true;
		}
	}

	$: if (word.id || sentence.id) {
		let wordWas = word;

		const wordStrings = toWords(sentence.sentence, language);

		let wordString = word.word; // fallback

		const wordIndex = sentenceWords.findIndex(({ id }) => id === word.id);

		if (wordIndex >= 0 && sentenceWords.length == wordStrings.length) {
			wordString = wordStrings[wordIndex];
		} else {
			console.warn(
				`Word ${word.word} not found in sentence "${sentence.sentence}" (${sentence.id})`
			);
		}

		lookupUnknownWord(wordString, sentence.id)
			.then((translated) => {
				if (word.word == translated.word && word.id == wordWas.id) {
					englishWord = translated.english;
				}
			})
			.catch((e) => {
				console.error(e);
				error = e;
			});
	}

	$: if (sentence.id) {
		clear();
	}

	async function onHint() {
		if (showChars < 2) {
			showChars++;
		} else {
			onReveal();
		}
	}

	async function onReveal() {
		showChars = 100;
		isCorrectInflection = false;
		isCorrectLemma = exercise == 'cloze-inflection';
	}

	async function onTranslate() {
		englishSentence = await fetchTranslation(sentence.id);
	}

	let typeCount = 0;

	async function onType(prefix: string) {
		const timer = setTimeout(() => {
			isLoadingSuggestions = true;
		}, 100);

		typeCount++;

		try {
			let oldTypeCount = typeCount;

			const sw = prefix.length > 0 && showChars < 100 ? await fetchWordsByPrefix(prefix) : [];

			if (oldTypeCount == typeCount) {
				suggestedWords = sw;
			}
		} catch (e) {
			console.error(e);
			error = e;
		} finally {
			clearTimeout(timer);
			isLoadingSuggestions = false;
		}
	}

	async function onAnswer(answerGiven: string) {
		const conjugatedWord = toWords(sentence.sentence, language)[
			sentenceWords.findIndex((w) => w.id === word.id)
		];

		const isDictionaryForm = standardize(answerGiven) == word.word;
		const isRightInflection = standardize(answerGiven) == conjugatedWord;

		if (!answeredLemma && isDictionaryForm && !isRightInflection && inflections.length) {
			suggestedWords = inflections;

			answeredLemma = answerGiven;

			return;
		}

		onReveal();
		answered = standardize(answerGiven);

		isCorrectLemma = answeredLemma
			? answeredLemma == word.word
			: isDictionaryForm || isRightInflection;
		isCorrectInflection = isRightInflection || (!answeredLemma && isDictionaryForm);

		if (!((answeredLemma && isRightInflection) || (!answeredLemma && isCorrectLemma))) {
			const wordWas = word;
			const gotEvaluation = await fetchClozeEvaluation({
				cloze: toWordsWithSeparators(sentence.sentence, language).reduce(
					(cloze, word) =>
						cloze + (standardize(word) == standardize(conjugatedWord) ? '______' : word),
					''
				),
				clue: englishWord || '',
				userAnswer: answered,
				correctAnswer: conjugatedWord,
				isWrongInflection: !isCorrectInflection && isCorrectLemma
			});

			if (word.id == wordWas.id) {
				evaluation = gotEvaluation;
			}
		}
	}

	async function storeAndContinue() {
		if (isCorrectLemma == undefined) {
			throw new Error(`Invalid state, isCorrectLemma is undefined`);
		}

		sendKnowledge(
			filterUndefineds(
				sentenceWords.map((sentenceWord) => {
					const isClozeWord = sentenceWord.id == word.id;

					if (exercise == 'cloze-inflection' && isClozeWord) {
						return undefined;
					}

					return {
						word: sentenceWord,
						wordId: sentenceWord.id,
						sentenceId: sentence.id,
						isKnown: isClozeWord
							? isCorrectLemma!
							: !revealed.find(({ id }) => id === sentenceWord.id),
						studiedWordId: word.id,
						type: isClozeWord ? KNOWLEDGE_TYPE_CLOZE : KNOWLEDGE_TYPE_READ,
						userId: -1
					};
				})
			),
			(!isCorrectInflection && isCorrectLemma) || source == 'userExercise'
				? [
						{
							wordId: word.id,
							word: word.word,
							sentenceId: sentence.id,
							isKnown: !!isCorrectInflection,
							exercise:
								isCorrectInflection && source == 'userExercise'
									? exercise
									: isCorrectLemma
										? 'cloze-inflection'
										: 'cloze',
							level: word.level
						}
					]
				: undefined
		);

		await onNext();
	}
</script>

<ClozeDumb
	{sentence}
	{word}
	{sentenceWords}
	{evaluation}
	{exercise}
	{onHint}
	onNext={storeAndContinue}
	{onUnknown}
	{onRemoveUnknown}
	{onReveal}
	{onType}
	{onAnswer}
	{onTranslate}
	{isCorrectInflection}
	{isCorrectLemma}
	{englishWord}
	{englishSentence}
	{mnemonic}
	{showChars}
	{suggestedWords}
	{answered}
	{answeredLemma}
	{revealed}
	{knowledge}
	{language}
	{isLoadingSuggestions}
/>

{#if showChars >= word.word.length}
	<Speak url={`/${language.code}/api/sentences/${sentence.id}/tts.opus`} />
{/if}

<Ama
	ask={(question) =>
		fetchAskMeAnything({
			exercise: 'cloze',
			question,
			word: word.word,
			confusedWord: answered,
			sentence: sentence.sentence,
			revealed
		})}
	wordId={word.id}
	suggestions={[
		'Can I express this differently?',
		`How do you say 'banana' in ${language.name}?`,
		...(revealed.length
			? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
			: [])
	]}
/>

<ErrorComponent {error} onClear={() => (error = undefined)} />
