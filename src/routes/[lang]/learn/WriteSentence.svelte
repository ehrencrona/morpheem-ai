<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { fetchProvidedWordsInAnswer } from '../api/write/ama/provided/client';
	import { storeWrittenSentence } from '../api/write/client';
	import { fetchWritingFeedback } from '../api/write/feedback/client';
	import AMA from './AMA.svelte';
	import SpinnerButton from './SpinnerButton.svelte';
	import WordCard from './WordCard.svelte';
	import type { Language } from '../../../logic/types';

	export let word: { id: number; word: string };
	export let onNext: () => Promise<any>;
	export let fetchIdea: () => Promise<string>;
	export let language: Language;

	let feedback: string | undefined;
	let corrected: string | undefined;
	let sentence: string;
	let idea: string | undefined;

	let revealed = false;
	let unknownWords: UnknownWordResponse[] = [];

	let lookedUpWord: UnknownWordResponse | undefined;

	function clear() {
		sentence = '';
		feedback = '';
		corrected = '';
		idea = '';
		unknownWords = [];
		revealed = false;
	}

	$: if (word) {
		clear();

		lookupUnknownWord(word.word, undefined)
			.then((word) => (lookedUpWord = word))
			.catch(console.error);
	}

	const onSubmit = async () => {
		if (!sentence) return;

		sentence = sentence.trim();

		const res = await fetchWritingFeedback({ word: word.word, sentence });

		({ feedback, corrected } = res);

		unknownWords = dedup([...unknownWords, ...res.unknownWords]);
	};

	const clickedContinue = async () => {
		await storeWrittenSentence({
			wordId: word.id,
			sentence: corrected!,
			unknownWordIds: unknownWords.map(({ id }) => id)
		});

		return onNext();
	};

	const onWordUnknown = async () => {
		if (lookedUpWord) {
			unknownWords = [...unknownWords, lookedUpWord];
			revealed = true;
		}
	};

	const getIdea = async () => {
		idea = await fetchIdea();
	};

	function dedup(words: UnknownWordResponse[]) {
		return words.filter((word, index) => words.findIndex((w) => w.id == word.id) == index);
	}

	const askMeAnything = async (question: string) => {
		const answer = await fetchAskMeAnything({
			type: 'write',
			question,
			word: word.word,
			sentenceEntered: sentence,
			sentenceCorrected: corrected
		});

		if (!feedback) {
			fetchProvidedWordsInAnswer({ question, answer })
				.then((words) => (unknownWords = dedup([...unknownWords, ...words])))
				.catch(console.error);
		}

		return answer;
	};
</script>

<div>
	<h1 class="mb-4 text-xl">
		{#if lookedUpWord}"{lookedUpWord?.english}"{:else}...{/if}
	</h1>

	<form>
		{#if !feedback}
			<p class="mb-4 font-lato text-xs">
				Write a sentence or fragment using the {language.name} word for "<b>{lookedUpWord?.english || '...'}</b>"
			</p>

			<input
				type="text"
				bind:value={sentence}
				class="bg-blue-1 rounded-sm block w-full p-2 text-lg mb-2"
				lang="pl"
			/>

			{#if idea}
				<div class="text-xs font-lato text-gray-1 mb-2">{idea}</div>
			{/if}
		{:else}
			{#if corrected != sentence}
				<div class="text-xl font-bold mb-6 mt-4 text-balance line-through">
					{sentence}
				</div>
			{/if}

			<div class="mb-6 font-lato text-xs">
				{feedback}
			</div>

			<div class="text-xl font-bold mb-6 text-balance">{corrected}</div>
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
				{#if !revealed}
					<SpinnerButton onClick={onWordUnknown} type="secondary">Hint</SpinnerButton>
				{/if}

				{#if !idea}
					<SpinnerButton onClick={getIdea} type="secondary">Idea</SpinnerButton>
				{/if}

				<SpinnerButton onClick={onSubmit} isSubmit={true}>Submit</SpinnerButton>
			{:else}
				<SpinnerButton
					onClick={async () => {
						feedback = '';
						corrected = '';
					}}
					className="text-blue-1 bg-blue-3 rounded-md px-5 py-1 m-2 ml-0">Try again</SpinnerButton
				>

				<SpinnerButton onClick={clickedContinue}>Continue</SpinnerButton>
			{/if}
		</div>
	</form>

	<div
		class="absolute bottom-0 left-0 right-0 bg-[#ffffff] px-4 py-2"
		style="box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);"
	>
		<AMA
			explanation="Enter an English word to get a {language.name} translation."
			ask={askMeAnything}
			wordId={word.id}
		/>
	</div>
</div>
