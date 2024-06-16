<script lang="ts" context="module">
	export interface SuggestedWords {
		type: 'inflection' | 'lemma';
		words: string[];
	}

	export interface Evaluation {
		answered: string;
		isCorrectLemma: boolean;
		isCorrectInflection: boolean;
		message?: string;
		isPossibleDifferentWord?: DB.Word;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Error from '../../../components/Error.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import * as DB from '../../../db/types';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { isSeparator, toWords, toWordsWithSeparators } from '../../../logic/toWords';
	import type { Language, SentenceWord } from '../../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import WordCard from './WordCard.svelte';

	export let sentence: DB.Sentence;
	export let sentenceWords: SentenceWord[];

	export let word: DB.Word;
	export let englishWord: string | undefined;
	export let englishSentence: string | undefined;
	export let mnemonic: string | undefined;
	export let exercise: 'cloze' | 'cloze-inflection' = 'cloze';

	export let language: Language;

	export let showChars: number;

	export let suggestedWords: SuggestedWords = {
		type: 'lemma',
		words: []
	};

	export let evaluation: Evaluation | undefined;

	export let isPickingInflection: boolean;
	export let isLoadingSuggestions = false;

	export let revealed: UnknownWordResponse[];

	export let onHint: () => Promise<any>;
	export let onNext: () => Promise<any>;
	export let onUnknown: (wordString: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onReveal: () => Promise<any>;
	export let onTranslate: () => Promise<any>;
	export let onType: (prefix: string) => void;
	export let onAnswer: (wordString: string) => void;

	$: answer = conjugatedWord.slice(0, showChars) + (prefix?.trim() || '');

	let prefix: string | null;

	function clear() {
		prefix = null;
	}

	$: if (sentence.id) {
		clear();
		input?.focus();
	}

	onMount(() => {
		input.focus();
	});

	$: if (prefix != null || showChars > 0) {
		onType(answer);
	}

	$: wordStrings = toWords(sentence.sentence, language);

	$: conjugatedWord = wordStrings[sentenceWords.findIndex((w) => w.id === word.id)];
	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence, language);

	let isLoadingUnknown = false;
	let error: any;
	let input: HTMLInputElement;

	function onSubmit() {
		onAnswer(answer);
	}

	async function onClickedWord(wordString: string) {
		const timer = setTimeout(() => (isLoadingUnknown = true), 100);

		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));

			await onUnknown(wordString);
		} catch (e) {
			console.error(e);

			error = e;
		} finally {
			clearTimeout(timer);
			isLoadingUnknown = false;
		}
	}

	async function onHintLocal() {
		let oldShowChars = showChars;

		onHint();

		setTimeout(() => {
			if (showChars > oldShowChars) {
				prefix = prefix?.slice(showChars - oldShowChars) || null;
			}
		});
	}
</script>

<form on:submit={onSubmit}>
	<div class="text-4xl mb-8 mt-8 font-medium">
		{#each wordsWithSeparators as wordString, index}{#if !isSeparator(wordString)}{#if standardize(wordString) == standardize(conjugatedWord)}
					{#if evaluation}
						<span class={evaluation.isCorrectInflection ? 'text-green' : 'text-red'}
							>{evaluation.isPossibleDifferentWord ? evaluation.answered : wordString}</span
						>{:else}
						<div class="inline-flex flex-col -mb-1">
							<span class="whitespace-nowrap">
								{wordString.slice(0, showChars)}<input
									type="text"
									class="border-b-4 border-b-red bg-blue-1 relative"
									size={wordString.length - showChars}
									bind:value={prefix}
									autocapitalize="off"
									bind:this={input}
								/>
							</span>
							<span class="text-xs font-lato text-right">
								{#if englishWord}
									"{englishWord}"
								{:else}
									<div class="w-full flex items-center justify-center">
										<Spinner />
									</div>
								{/if}
							</span>
						</div>
					{/if}{:else}<span
						style="cursor: pointer"
						role="button"
						tabindex={index}
						class="hover:underline decoration-yellow"
						on:click={() => onClickedWord(wordString)}>{wordString}</span
					>{/if}{:else}{wordString}{/if}{/each}
	</div>

	{#if englishSentence}
		<div class="text-sm mb-6" in:slide>
			<div class="text-xs font-lato">The sentence means</div>
			<div class="text-xl">"{englishSentence}"</div>
		</div>
	{/if}

	{#if !evaluation}
		{#if revealed.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8">
				{#each revealed as word (word.id)}
					<WordCard {...word} {word} onRemove={() => onRemoveUnknown(word.word)} />
				{/each}
				{#if isLoadingUnknown}
					<div class="flex justify-center items-center">
						<Spinner />
					</div>
				{/if}
			</div>
		{/if}

		<div class="mt-8">
			{#if isPickingInflection}
				<div class="text-xs font-lato mb-4">
					{#if exercise === 'cloze-inflection'}
						Pick
					{:else}
						Now pick
					{/if} the correct form of <b>{word.word}</b>:
				</div>
			{/if}

			<div class="min-h-[50px] md:min-h-[150px]">
				<div class="flex overflow-x-auto md:flex-wrap gap-4 pt-1 pb-4 mb-4">
					{#if isLoadingSuggestions}
						<Spinner />
					{/if}
					{#each suggestedWords.words as suggestedWord}
						<button
							class={(suggestedWords.type == 'inflection' ? 'bg-blue-4 text-white' : 'bg-blue-1') +
								' border-blue-1 rounded-lg px-5 py-1 whitespace-nowrap'}
							on:click={() => onAnswer(suggestedWord)}
							type="button"
						>
							{suggestedWord}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="mt-4 mb-4">
			{#if exercise === 'cloze'}
				<SpinnerButton onClick={onHintLocal} type="secondary">Hint</SpinnerButton>
			{/if}

			<SpinnerButton onClick={onTranslate} type="secondary">Translate</SpinnerButton>

			<SpinnerButton onClick={onReveal}>Reveal</SpinnerButton>
		</div>
	{:else}
		{#if evaluation.isCorrectInflection}
			{#if !evaluation.isPossibleDifferentWord}
				<div class="mb-4">Correct!</div>
			{:else}
				<div class="mb-4">
					We were actually looking for the word <b>{conjugatedWord}</b>, but your answer is also
					correct.
					{evaluation.message || ''}
				</div>
			{/if}
		{:else if evaluation.answered}
			<div class="mb-4">
				You picked <b>{evaluation.answered}</b
				>{#if evaluation.isCorrectLemma && !evaluation.isCorrectInflection}, which is the wrong form
					of the right word{/if}.
				{evaluation.message || ''}
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8">
			<WordCard inflected={conjugatedWord} {word} english={englishWord} {mnemonic} />

			{#each revealed as word (word.id)}
				<WordCard {...word} {word} onRemove={() => onRemoveUnknown(word.word)} />
			{/each}
		</div>

		<div class="mt-4">
			<SpinnerButton onClick={onTranslate} type="secondary">Translate</SpinnerButton>

			<SpinnerButton type="primary" onClick={onNext} grabFocus={true}>Continue</SpinnerButton>
		</div>
	{/if}
</form>

<Error {error} onClear={() => (error = undefined)} />
