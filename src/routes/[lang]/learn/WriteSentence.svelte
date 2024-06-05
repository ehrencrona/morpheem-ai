<script lang="ts">
	import type { SendKnowledge } from '$lib/SendKnowledge';
	import { slide } from 'svelte/transition';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import { KNOWLEDGE_TYPE_WRITE } from '../../../db/knowledgeTypes';
	import type { Language } from '../../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import { fetchProvidedWordsInAnswer } from '../api/write/ama/provided/client';
	import { storeWrittenSentence } from '../api/write/client';
	import { fetchWritingFeedback } from '../api/write/feedback/client';
	import AMA from './AMA.svelte';
	import WordCard from './WordCard.svelte';

	export let word: { id: number; word: string };
	export let onNext: () => Promise<any>;
	export let fetchIdea: () => Promise<string>;
	export let language: Language;
	export let sendKnowledge: SendKnowledge;

	let feedback: string | undefined;
	let corrected: string | undefined;
	let sentence: string;
	let idea: string | undefined;

	let showChars: number = 0;
	let unknownWords: UnknownWordResponse[] = [];

	let lookedUpWord: UnknownWordResponse | undefined;

	$: isRevealed = showChars > 2 || showChars > word.word.length - 1;

	function clear() {
		sentence = '';
		feedback = '';
		corrected = '';
		idea = '';
		unknownWords = [];
		showChars = 0;
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
		const studiedWordId = word.id;
		const words = await storeWrittenSentence({
			wordId: studiedWordId,
			sentence: corrected!
		});

		const unknownWordIds = unknownWords.map(({ id }) => id);

		const knowledge = words.map((word) => ({
			word,
			wordId: word.id,
			isKnown: !unknownWordIds.includes(word.id),
			studiedWordId,
			sentenceId: undefined,
			type: KNOWLEDGE_TYPE_WRITE,
			userId: -1
		}));

		sendKnowledge(knowledge);

		return onNext();
	};

	const onHint = async () => {
		showChars++;

		if ((showChars > 2 || showChars > word.word.length - 1) && lookedUpWord) {
			unknownWords = [...unknownWords, lookedUpWord];
			showChars = 99;
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
		{#if isRevealed}
			{word.word}
		{:else if lookedUpWord}"{lookedUpWord?.english}"{:else}...{/if}
	</h1>

	<form>
		{#if !feedback}
			<p class="mb-4 font-lato text-xs">
				Write a sentence or fragment using the {language.name} word for "<b
					>{lookedUpWord?.english || '...'}</b
				>"
			</p>

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

			{#if idea}
				<div class="text-sm mb-6" in:slide>
					<div class="text-xs font-lato">Maybe write this in {language.name}?</div>
					<div class="text-xl">"{idea}"</div>
				</div>
			{/if}
		{:else}
			{#if corrected != sentence}
				<div class="text-xl font-bold mb-6 text-balance line-through">
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
				{#if !isRevealed}
					<SpinnerButton onClick={onHint} type="secondary">Hint</SpinnerButton>
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
