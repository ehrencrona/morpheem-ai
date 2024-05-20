<script lang="ts">
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { storeWrittenSentence } from '../api/write/client';
	import { fetchWritingFeedback } from '../api/write/feedback/client';
	import AMA from './AMA.svelte';
	import SpinnerButton from './SpinnerButton.svelte';

	export let word: { id: number; word: string };
	export let onContinue: () => Promise<any>;

	let feedback: string | undefined;
	let corrected: string | undefined;
	let sentence: string;

	let unknownWord: UnknownWordResponse | undefined;

	function clear() {
		sentence = '';
		feedback = '';
		corrected = '';
		unknownWord = undefined;
	}

	$: if (word) {
		clear();
	}

	const onSubmit = async () => {
		if (!sentence) return;

		({ feedback, corrected } = await fetchWritingFeedback({ word: word.word, sentence }));
	};

	const clickedContinue = async () => {
		await storeWrittenSentence({ wordId: word.id, sentence: corrected! });

		return onContinue();
	};

	const onWordUnknown = async () => {
		unknownWord = await lookupUnknownWord(word.word, undefined, word.id, true);
	};
</script>

<div>
	{#if !unknownWord}
		<h1 class="mb-4">
			{word.word}

			<span>
				<a
					href="#"
					class="ml-1 text-xs font-lato underline"
					on:click|preventDefault={onWordUnknown}
				>
					Explain word
				</a>
			</span>
		</h1>
	{/if}

	{#if unknownWord}
		<div class="bg-blue-1 rounded-md px-4 py-3 w-full md:w-[48%] mb-4">
			<div class="font-medium mb-1 text-xs flex">
				<a href="/words/{unknownWord.id}" class="flex-1">{unknownWord.word}</a>
			</div>

			<div class="text-balance text-lg font-lato mt-2">{unknownWord.english}</div>
		</div>
	{/if}

	{#if !feedback}
		<p class="mb-4 font-lato text-xs">
			Write a sentence or fragment using the word "<b>{word.word}</b>"
		</p>

		<form>
			<input
				type="text"
				bind:value={sentence}
				class="bg-blue-1 rounded-sm block w-full p-2 text-lg mb-2"
				lang="pl"
			/>

			<SpinnerButton onClick={onSubmit}>Submit</SpinnerButton>
		</form>
	{:else}
		<div class="text-xl font-bold mb-6 mt-4 text-balance line-through">
			{sentence}
		</div>

		<div class="mb-6 font-lato text-xs">
			{feedback}
		</div>

		<div class="text-xl font-bold mb-6 text-balance">{corrected}</div>

		<SpinnerButton onClick={clickedContinue}>Continue</SpinnerButton>
	{/if}

	<div
		class="absolute bottom-0 left-0 right-0 bg-[#ffffff] px-4 py-2"
		style="box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);"
	>
		<AMA
			explanation="Enter an English word to get a Polish translation."
			ask={(question) =>
				fetchAskMeAnything({
					type: 'write',
					question,
					word: word.word,
					sentenceEntered: sentence,
					sentenceCorrected: corrected
				})}
			wordId={word.id}
		/>
	</div>
</div>
