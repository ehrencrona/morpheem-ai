<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { slide } from 'svelte/transition';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import { KNOWLEDGE_TYPE_WRITE } from '../../../db/knowledgeTypes';
	import type { ExerciseKnowledge, Language } from '../../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { fetchProvidedWordsInAnswer } from '../api/write/ama/provided/client';
	import { sendWrittenSentence } from '../api/write/client';
	import { fetchWritingFeedback } from '../api/write/feedback/client';
	import AMA from './AMA.svelte';
	import WordCard from './WordCard.svelte';
	import Error from '../../../components/Error.svelte';
	import type { WritingFeedbackResponse } from '../api/write/feedback/+server';
	import type { TranslationFeedbackResponse } from '../api/write/translate/+server';
	import { fetchTranslationFeedback } from '../api/write/translate/client';

	export let word: { id: number; word: string; level: number };
	export let onNext: () => Promise<any>;
	export let fetchEnglishSentence: () => Promise<string>;
	export let sendKnowledge: SendKnowledge;
	export let sentenceId: number;
	export let language: Language;

	export let exercise: 'write' | 'translate' = 'write';

	/** The sentence to translate if translate, otherwise the writing idea. */
	export let englishSentence: string | undefined;

	let feedback: TranslationFeedbackResponse | WritingFeedbackResponse | undefined;
	let sentence: string;

	let error: any;

	let showChars: number = 0;
	let unknownWords: UnknownWordResponse[] = [];

	let lookedUpWord: UnknownWordResponse | undefined;

	$: isRevealed = showChars > 2 || showChars > word.word.length - 1;

	function clear() {
		sentence = '';
		feedback = undefined;
		unknownWords = [];
		showChars = 0;
		lookedUpWord = undefined;

		if (exercise == 'write') {
			lookupUnknownWord(word.word, undefined)
				.then((word) => (lookedUpWord = word))
				.catch((e) => (error = e));
		}

		if (exercise === 'translate' && !englishSentence) {
			getEnglishSentence().catch((e) => (error = e));
		}
	}

	$: if (word || sentenceId) {
		clear();
	}

	const onSubmit = async () => {
		sentence = sentence.trim();

		if (!sentence) return;

		feedback =
			exercise == 'write'
				? await fetchWritingFeedback({ word: word.word, sentence })
				: await fetchTranslationFeedback({
						sentenceId,
						entered: sentence
					});

		unknownWords = dedup([...unknownWords, ...feedback!.unknownWords]);
	};

	const clickedContinue = async () => {
		if (!feedback) {
			error = 'Invalid state';
			return;
		}

		const studiedWordId = word.id;

		let addExercises: ExerciseKnowledge[] = [];

		let newSentenceId: number | undefined = undefined;

		if (exercise == 'write') {
			const sentence = await sendWrittenSentence({
				wordId: studiedWordId,
				sentence: feedback!.corrected
			});

			newSentenceId = sentence.id;
		}

		if (!feedback.isCorrect || exercise == 'translate') {
			addExercises = [
				{
					wordId: studiedWordId,
					sentenceId: newSentenceId || sentenceId,
					exercise: 'translate',
					word: word.word,
					isKnown: feedback.isCorrect,
					// just set a fixed value?
					level: word.level
				}
			];
		}

		const unknownWordIds = unknownWords.map(({ id }) => id);

		const knowledge = feedback.words.map((word) => ({
			word,
			wordId: word.id,
			isKnown: !unknownWordIds.includes(word.id),
			studiedWordId,
			sentenceId: undefined,
			type: KNOWLEDGE_TYPE_WRITE,
			userId: -1
		}));

		sendKnowledge(knowledge, addExercises);

		return onNext();
	};

	const onHint = async () => {
		showChars++;

		if ((showChars > 2 || showChars > word.word.length - 1) && lookedUpWord) {
			unknownWords = [...unknownWords, lookedUpWord];
			showChars = 99;
		}
	};

	const getEnglishSentence = async () => {
		englishSentence = await fetchEnglishSentence();
	};

	function dedup(words: UnknownWordResponse[]) {
		return words.filter((word, index) => words.findIndex((w) => w.id == word.id) == index);
	}

	const askMeAnything = async (question: string) => {
		const answer = await fetchAskMeAnything({
			exercise,
			question,
			word: word.word,
			sentenceEntered: sentence,
			sentenceCorrected: feedback?.exercise == 'write' ? feedback.corrected : undefined
		});

		if (!feedback) {
			fetchProvidedWordsInAnswer({ question, answer })
				.then((words) => (unknownWords = dedup([...unknownWords, ...words])))
				.catch(console.error);
		}

		return answer;
	};
</script>

<Error {error} onClear={() => (error = undefined)} />

<div>
	{#if exercise == 'write'}
		<h1 class="mb-4 text-xl">
			{#if isRevealed}
				{word.word}
			{:else if lookedUpWord}"{lookedUpWord?.english}"{:else}...{/if}
		</h1>
	{/if}

	<form>
		{#if !feedback}
			{#if exercise === 'translate'}
				<div class="text-sm mb-6" in:slide>
					<div class="text-xs font-lato">Translate into {language.name}:</div>
					<div class="text-xl">"{englishSentence}"</div>
				</div>
			{:else}
				<p class="mb-4 font-lato text-xs">
					Write a sentence or fragment using the {language.name} word for "<b
						>{lookedUpWord?.english || '...'}</b
					>"
				</p>
			{/if}

			<input
				type="text"
				bind:value={sentence}
				class="bg-blue-1 rounded-sm block w-full p-2 text-lg mb-6"
				lang="pl"
			/>

			{#if showChars > 0 && !isRevealed}
				<div class="text-xs font-lato mb-6">
					The word starts with <b>"{word.word.slice(0, showChars)}..."</b>
				</div>
			{/if}

			{#if englishSentence && exercise == 'write'}
				<div class="text-sm mb-6" in:slide>
					<div class="text-xs font-lato">Maybe write this in {language.name}?</div>
					<div class="text-xl">"{englishSentence}"</div>
				</div>
			{/if}
		{:else}
			{#if !feedback.isCorrect}
				<div class="text-xl font-bold mb-6 text-balance line-through">
					{sentence}
				</div>
			{/if}

			<div class="mb-6 font-lato text-xs">
				{feedback.feedback}
			</div>

			<div class="text-xl font-bold mb-6 text-balance">
				{feedback.corrected}
			</div>
		{/if}

		{#if unknownWords.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8" transition:slide>
				{#each unknownWords as unknownWord}
					<WordCard
						word={unknownWord}
						english={unknownWord.english}
						onRemove={() =>
							(unknownWords = unknownWords.filter((word) => word.id != unknownWord.id))}
					/>
				{/each}
			</div>
		{/if}

		<div class="mt-8">
			{#if !feedback}
				{#if exercise === 'write'}
					{#if !isRevealed}
						<SpinnerButton onClick={onHint} type="secondary">Hint</SpinnerButton>
					{/if}

					{#if !englishSentence}
						<SpinnerButton onClick={getEnglishSentence} type="secondary">Idea</SpinnerButton>
					{/if}
				{/if}

				<SpinnerButton onClick={onSubmit} isSubmit={true}>Submit</SpinnerButton>
			{:else}
				<SpinnerButton
					onClick={async () => {
						feedback = undefined;
					}}
					type="secondary">Try again</SpinnerButton
				>

				<SpinnerButton onClick={clickedContinue}>Continue</SpinnerButton>
			{/if}
		</div>
	</form>

	<AMA
		suggestions={[`How do you say "to scratch"?`, `traffic light in ${language.name}?`]}
		ask={askMeAnything}
		wordId={word.id}
	/>
</div>
