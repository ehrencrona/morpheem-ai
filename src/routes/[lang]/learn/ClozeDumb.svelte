<script lang="ts" context="module">
	export interface SuggestedWords {
		type: 'inflection' | 'lemma';
		words: string[];
	}

	export interface Evaluation {
		answered: string;
		outcome: 'correct' | 'wrongForm' | 'typo' | 'alternate' | 'alternateWrongForm' | 'wrong';
		evaluation?: string;
		alternateWord?: DB.Word & { conjugated: string };
	}
</script>

<script lang="ts">
	import { logError } from '$lib/logError';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Spinner from '../../../components/Spinner.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import * as DB from '../../../db/types';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { isSeparator, toWordsWithSeparators } from '../../../logic/toWordStrings';
	import type { Language, SentenceWord } from '../../../logic/types';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import WordCard from './WordCard.svelte';
	import { getShowTransliteration } from '$lib/settings';
	import { getLanguageOnClient } from '../api/api-call';

	export let sentence: DB.Sentence;

	export let word: SentenceWord & { conjugatedWord: string };
	export let unknownWord: UnknownWordResponse | undefined;
	export let sentenceTranslation: Translation | undefined;
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
	export let isFetchingEvaluation = false;

	export let unknown: UnknownWordResponse[];

	export let onHint: () => Promise<any>;
	export let onNext: () => Promise<any>;
	export let onUnknown: (wordString: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onReveal: () => Promise<any>;
	export let onTranslate: () => Promise<any>;
	export let onType: (prefix: string) => void;
	export let onAnswer: (wordString: string) => Promise<void>;
	export let onPickedWord: (wordString: string) => Promise<void>;

	let isLoadingUnknown = false;
	let input: HTMLInputElement;

	let showTransliteration = getShowTransliteration();

	$: answer = word.conjugatedWord.slice(0, showChars) + (entered?.trim() || '');

	let entered: string | null;

	function clear() {
		entered = null;
	}

	$: if (sentence.id) {
		clear();
		input?.focus();
	}

	onMount(() => {
		input.focus();
	});

	$: if (entered != null || showChars > 0) {
		onType(answer);
	}

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence, language);

	function onSubmit() {
		onAnswer(answer);
	}

	async function onClickedWord(wordString: string) {
		const timer = setTimeout(() => (isLoadingUnknown = true), 100);

		try {
			await onUnknown(wordString);
		} catch (e) {
			logError(e);
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
				entered = entered?.slice(showChars - oldShowChars) || null;
			}
		});
	}
</script>

<form on:submit={onSubmit}>
	<div class="font-sans text-3xl lg:text-4xl leading-snug mb-8 mt-8 font-medium">
		{#each wordsWithSeparators as wordString, index}{#if !isSeparator(wordString)}{#if standardize(wordString) == standardize(word.conjugatedWord)}
					{#if evaluation}
						<span
							class={['correct', 'alternate'].includes(evaluation.outcome)
								? 'text-green'
								: evaluation.outcome == 'typo'
									? 'text-orange'
									: 'text-red'}>{evaluation.alternateWord?.conjugated || wordString}</span
						>{:else}
						<div class="inline-flex flex-col -mb-1">
							<span class="whitespace-nowrap">
								{wordString.slice(0, showChars)}<input
									type="text"
									class="border-b-4 border-b-red bg-blue-1 relative px-1"
									size={wordString.length - showChars}
									bind:value={entered}
									autocapitalize="off"
									bind:this={input}
									lang={getLanguageOnClient().code}
								/>
							</span>
							<span class="text-xs font-lato text-right">
								{#if unknownWord}
									<span class="-mt-1">"{unknownWord.english}"</span>
								{:else}
									<div class="w-full flex items-center justify-center my-[3px]">
										<Spinner />
									</div>
								{/if}
							</span>
						</div>
					{/if}{:else}<span
						style="cursor: pointer"
						role="button"
						tabindex={index}
						class={unknown.find((r) => (r.inflected || r.word) == wordString)
							? 'border-b-2 border-blue-3 border-dotted'
							: 'hover:underline decoration-yellow'}
						on:click={() => onClickedWord(wordString)}>{wordString}</span
					>{/if}{:else}{wordString}{/if}{/each}
	</div>

	{#if sentenceTranslation}
		<div class="text-sm mb-6" in:slide>
			<div class="text-xs font-lato">The sentence means</div>
			<div class="text-xl">"{sentenceTranslation.english}"</div>
			{#if sentenceTranslation.transliteration && showTransliteration}
				<div class="text-xs font-lato">{sentenceTranslation.transliteration}</div>
			{/if}
		</div>
	{/if}

	{#if !evaluation}
		{#if unknown.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8">
				{#each unknown as word (word.id)}
					<WordCard {word} onRemove={() => onRemoveUnknown(word.word)} />
				{/each}
				{#if isLoadingUnknown}
					<div class="flex justify-center items-center">
						<Spinner />
					</div>
				{/if}
			</div>
		{/if}

		<div class="mt-8">
			<div class="text-xs font-lato mb-4 text-gray-1">
				{#if !entered}
					Find the missing word. Click any words you don't know.
				{:else if entered && suggestedWords.words.length == 0 && !isLoadingSuggestions}
					Press Submit to check your answer.
				{:else if isPickingInflection}
					{#if exercise === 'cloze-inflection'}
						Pick
					{:else}
						Now pick
					{/if} the correct form:
				{:else}
					Pick the word:
				{/if}
			</div>

			<div
				class="pt-1 mb-4 md:mb-8 min-h-[52px] md:h-[180px] {suggestedWords.type == 'lemma'
					? 'md:overflow-y-hidden'
					: 'md:overflow-y-auto'}"
			>
				<div class="flex overflow-x-auto md:flex-wrap gap-4 pb-3 md:pb-0">
					{#if isLoadingSuggestions}
						<Spinner />
					{/if}
					{#each suggestedWords.words as suggestedWord}
						<button
							class={(suggestedWords.type == 'inflection' ? 'bg-blue-4 text-white' : 'bg-blue-1') +
								' border-blue-1 rounded-lg px-5 py-1 whitespace-nowrap'}
							on:click={() => onPickedWord(suggestedWord)}
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

			{#if entered}
				<SpinnerButton onClick={() => onAnswer(answer)}>Submit</SpinnerButton>
			{:else}
				<SpinnerButton onClick={onReveal}>Reveal</SpinnerButton>
			{/if}
		</div>
	{:else}
		{#if ['alternate', 'alternateWrongForm'].includes(evaluation.outcome)}
			<div class="mb-4">
				We were actually looking for the word <b>{word.conjugatedWord}</b>. {evaluation.evaluation}
			</div>
		{:else if ['correct', 'typo'].includes(evaluation.outcome)}
			<div class="mb-4">Correct!</div>
		{:else if evaluation.answered}
			<div class="mb-4">
				You picked <b>{evaluation.answered}</b>{#if evaluation.outcome == 'wrongForm'}, which is the
					wrong form of the right word{/if}.

				{#if isFetchingEvaluation}
					<div class="mt-2"><Spinner /></div>
				{/if}

				{evaluation.evaluation || ''}
			</div>
		{/if}

		{#if evaluation.outcome == 'typo'}
			<div class="mb-4">However, it is not spelled "{evaluation.answered}".</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8">
			{#if (evaluation.outcome != 'correct' || evaluation.alternateWord) && unknownWord}
				<WordCard word={{ ...unknownWord, inflected: word.conjugatedWord }} />
			{/if}

			{#each unknown as word (word.id)}
				<WordCard {word} onRemove={() => onRemoveUnknown(word.word)} />
			{/each}
		</div>

		<div class="mt-4">
			<SpinnerButton onClick={onTranslate} type="secondary">Translate</SpinnerButton>

			<SpinnerButton type="primary" onClick={onNext} grabFocus={true}>Continue</SpinnerButton>
		</div>
	{/if}
</form>
