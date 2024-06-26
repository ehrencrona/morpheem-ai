<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { dedupUnknown } from '$lib/dedupUnknown';
	import { filterUndefineds } from '$lib/filterUndefineds';
	import Speak from '../../../components/Speak.svelte';
	import Tutorial from '../../../components/Tutorial.svelte';
	import { KNOWLEDGE_TYPE_CLOZE } from '../../../db/knowledgeTypes';
	import * as DB from '../../../db/types';
	import { PhraseEvaluation } from '../../../ai/evaluatePhraseCloze';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { toWordsWithSeparators } from '../../../logic/toWords';
	import type { Language, SentenceWord } from '../../../logic/types';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import { fetchTranslation } from '../api/sentences/[sentence]/english/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { fetchPhraseClozeEvaluation } from '../../../routes/[lang]/api/phrase-cloze/client';
	import Ama from './AMA.svelte';
	import PhraseClozeDumb from './PhraseClozeDumb.svelte';

	export let sentence: DB.Sentence;
	export let sentenceWords: SentenceWord[];
	export let phrase: string;
	export let hint: string;
	export let language: Language;
	export let sendKnowledge: SendKnowledge;

	export let onBrokenExercise: () => void;

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence, language);
	$: phraseBoundary = findPhraseIndex(wordsWithSeparators);

	function isPhraseAtIndex(index: number) {
		let phraseAtIndex = '';

		for (let i = index; i < index + phrase.length; i++) {
			phraseAtIndex += wordsWithSeparators[i];

			if (phrase == phraseAtIndex) {
				return { from: index, to: i };
			}

			if (!phrase.startsWith(phraseAtIndex)) {
				break;
			}
		}

		return undefined;
	}

	function findPhraseIndex(wordsWithSeparators: string[]) {
		for (let i = 0; i < wordsWithSeparators.length; i++) {
			const result = isPhraseAtIndex(i);

			if (result) {
				return result;
			}
		}

		console.error(`Phrase not found: ${phrase} in ${wordsWithSeparators.join(' ')}`);

		onBrokenExercise();

		return { from: 0, to: 0 };
	}

	let isFetchingEvaluation = false;
	let unknown: UnknownWordResponse[] = [];

	$: if (sentence.id) {
		unknown = [];
	}

	async function onUnknown(word: string) {
		const unknownWord = await lookupUnknownWord(word, sentence.id);

		unknown = dedupUnknown([...unknown, unknownWord]);
	}

	async function onRemoveUnknown(word: string) {
		unknown = unknown.filter((r) => r.word !== word);
	}

	export let onNext: () => Promise<any>;

	let sentenceTranslation: Translation | undefined = undefined;
	let evaluation: PhraseEvaluation | undefined = undefined;

	let inflections: string[] = [];

	$: if (sentence.id) {
		clear();
	}

	async function clear() {
		sentenceTranslation = undefined;
		evaluation = undefined;
		inflections = [];
	}

	async function onReveal() {
		evaluation = {
			answered: '',
			outcome: 'wrong'
		};
	}

	async function onTranslate() {
		sentenceTranslation = await fetchTranslation(sentence.id);
	}

	async function onAnswer(answered: string) {
		answered = standardize(answered);

		evaluation = {
			answered,
			outcome: answered == standardize(phrase) ? 'correct' : 'wrong'
		};

		console.log(
			`Answered "${answered}". Correct phrase: "${phrase}". outcome: ${evaluation.outcome}`
		);

		if (evaluation.outcome != 'correct') {
			const phraseWas = phrase;
			isFetchingEvaluation = true;

			const gotEvaluation: PhraseEvaluation = await fetchPhraseClozeEvaluation({
				cloze: toWordsWithSeparators(sentence.sentence, language).reduce(
					(cloze, word, i) =>
						cloze + (i >= phraseBoundary.from && i <= phraseBoundary.to ? '___' : word),
					''
				),
				answered,
				correctAnswer: phrase,
				clue: hint
			}).finally(() => (isFetchingEvaluation = false));

			if (phrase === phraseWas) {
				console.log(
					`Got evaluation for "${answered}": Outcome: ${gotEvaluation.outcome}${gotEvaluation.correctedAlternate ? `; Alternate: ${gotEvaluation.correctedAlternate.word}` : ''}`
				);

				evaluation = gotEvaluation;
			}
		}
	}

	async function storeAndContinue() {
		if (!evaluation) {
			throw new Error(`Invalid state, evaluation is undefined`);
		}

		const { outcome } = evaluation;

		const isCorrect = outcome == 'correct' || outcome == 'alternate' || outcome == 'typo';

		sendKnowledge(
			filterUndefineds(
				sentenceWords.map((sentenceWord: DB.Word) => {
					// not the best check but it doesn't matter all that much.
					if (phrase.includes(sentenceWord.word)) {
						return undefined;
					}

					return {
						word: sentenceWord,
						wordId: sentenceWord.id,
						sentenceId: sentence.id,
						isKnown: !unknown.find(({ id }) => id === sentenceWord.id),
						type: KNOWLEDGE_TYPE_CLOZE,
						userId: -1
					};
				})
			),
			TODO
		);

		await onNext();
	}
</script>

<PhraseClozeDumb
	{sentence}
	{phrase}
	{hint}
	{phraseBoundary}
	{evaluation}
	onNext={storeAndContinue}
	{onUnknown}
	{onRemoveUnknown}
	{onReveal}
	{onAnswer}
	{onTranslate}
	{isFetchingEvaluation}
	{sentenceTranslation}
	{unknown}
	{language}
/>

<Tutorial
	paragraphs={[
		`You got part of this sentence wrong earlier.`,
		`See if you can get it right this time.`,
		`There can be multiple correct answers.`
	]}
	id="phrase-cloze"
/>

{#if evaluation}
	<Speak url={`/${language.code}/api/sentences/${sentence.id}/tts.opus`} />
{/if}

<Ama
	wordId={/* TODO */
	4712}
	ask={(question) =>
		fetchAskMeAnything({
			exercise: 'cloze',
			question,
			confusedWord: evaluation?.answered,
			sentence: sentence.sentence,
			unknown
		})}
	suggestions={[
		'Can I express this differently?',
		`How do you say 'banana' in ${language.name}?`,
		...(unknown.length
			? ['Etymology?', 'Other meanings?', 'Similar-sounding words?', 'Synonyms?', 'Examples?']
			: [])
	]}
/>
