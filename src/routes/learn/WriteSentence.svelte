<script lang="ts">
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { storeWrittenSentence } from '../api/write/client';
	import { fetchWritingFeedback } from '../api/write/feedback/client';
	import AMA from './AMA.svelte';
	import SpinnerButton from './SpinnerButton.svelte';

	export let word: { id: number; word: string };
	export let onContinue: () => void;

	let feedback: string | undefined;
	let corrected: string | undefined;
	let sentence: string;

	let isCorrecting = false;
	let isContinuing = false;
	let unknownWord: UnknownWordResponse | undefined;

	function clear() {
		sentence = '';
		feedback = undefined;
		corrected = undefined;
		unknownWord = undefined;
	}

	$: if (word) {
		clear();
	}

	const onSubmit = async () => {
		isCorrecting = true;

		try {
			if (!sentence) return;

			({ feedback, corrected } = await fetchWritingFeedback({ word: word.word, sentence }));
		} finally {
			isCorrecting = false;
		}
	};

	const clickedContinue = async () => {
		isContinuing = true;

		try {
			await storeWrittenSentence({ wordId: word.id, sentence: corrected! });

			onContinue();
		} finally {
			isContinuing = false;
		}
	};

	const onWordUnknown = async () => {
		unknownWord = await lookupUnknownWord(word.word, undefined, word.id);
	};
</script>

<h1>{word.word}</h1>

<div>
	<p>Write a sentence or fragment using the word <b>{word.word}</b></p>

	<p>
		{#if unknownWord}
			<i>{unknownWord.english}</i>
		{:else}
			<a href="#" on:click|preventDefault={onWordUnknown}>Explain word</a>
		{/if}
	</p>

	{#if !feedback}
		<form style="display: flex">
			<input type="text" bind:value={sentence} />

			<SpinnerButton on:click={onSubmit} isLoading={isCorrecting}>Test</SpinnerButton>
		</form>
	{:else}
		<p>
			<b>{sentence}</b>
		</p>
		<div>
			<i>
				{feedback}
				<!-- {#each feedback as line}
					<p>{line}</p>
				{/each} -->
			</i>
		</div>

		<p>
			Corrected sentence: <b>{corrected}</b>
		</p>

		<SpinnerButton on:click={clickedContinue} isLoading={isContinuing}>Continue</SpinnerButton>
	{/if}
</div>

<AMA word={word.word} {sentence} />

<style>
	input {
		font-size: larger;
		width: 300px;
		padding: 6px;
	}
</style>
