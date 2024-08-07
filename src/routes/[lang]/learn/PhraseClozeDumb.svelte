<script lang="ts">
	import { logError } from '$lib/logError';
	import { getShowTransliteration } from '$lib/settings';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Spinner from '../../../components/Spinner.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import * as DB from '../../../db/types';
	import type { PhraseEvaluation } from '../../../ai/evaluatePhraseCloze';
	import {
		isSeparator,
		toSeparatedWords,
		toWordsWithSeparators
	} from '../../../logic/toWordStrings';
	import type { Language } from '../../../logic/types';
	import type { Translation } from '../api/sentences/[sentence]/english/client';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import WordCard from './WordCard.svelte';
	import { getLanguageOnClient } from '../api/api-call';
	import { replaceIgnoreCase } from '$lib/replaceIgnoreCase';

	export let sentence: DB.Sentence;
	export let phrase: string;
	export let hint: string;

	export let sentenceTranslation: Translation | undefined;

	export let language: Language;

	export let evaluation: PhraseEvaluation | undefined;

	export let isFetchingEvaluation = false;
	let isLoadingUnknown = false;

	export let unknown: UnknownWordResponse[];

	export let onNext: () => Promise<any>;
	export let onUnknown: (wordString: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onReveal: () => Promise<any>;
	export let onTranslate: () => Promise<any>;
	export let onAnswer: (wordString: string) => Promise<void>;
	let showTransliteration = getShowTransliteration();

	let answered = '';

	$: separatedWords = toSeparatedWords(
		replaceIgnoreCase(sentence.sentence, phrase, 'xyxyx'),
		language
	);

	function clear() {
		answered = '';
	}

	$: if (sentence.id) {
		clear();
		input?.focus();
	}

	onMount(() => {
		input?.focus();
	});

	let input: HTMLInputElement;

	function onSubmit() {
		onAnswer(answered);
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
</script>

<form on:submit={onSubmit}>
	<div class="font-sans text-3xl lg:text-4xl leading-snug mb-8 mt-8 font-medium">
		{#each separatedWords as wordTokens}
			<span class="whitespace-nowrap">
				{#each wordTokens.tokens as wordString, i}{#if wordString == 'xyxyx'}{#if evaluation}<span
								class={['correct', 'alternate'].includes(evaluation.outcome)
									? 'text-green'
									: evaluation.outcome == 'typo'
										? 'text-orange'
										: 'text-red'}
								>{#each toWordsWithSeparators(evaluation.correctedAlternate || phrase, language) as word}{#if isSeparator(word)}{word}{:else}<button
											type="button"
											class="inline {unknown.find((r) => (r.inflected || r.word) == word)
												? 'border-b-2 border-green border-dotted'
												: 'hover:underline decoration-green'}"
											on:click|preventDefault={() => onClickedWord(word)}>{word}</button
										>{/if}{/each}</span
							>{:else}<div class="inline-flex flex-col -mb-1">
								<span class="whitespace-nowrap">
									<input
										type="text"
										class="w-full border-b-4 border-b-red bg-blue-1 relative px-1 max-w-[90vw]"
										size={phrase.length}
										bind:value={answered}
										autocapitalize="off"
										bind:this={input}
										lang={getLanguageOnClient().code}
									/>
								</span>
								<span class="text-xs font-lato text-right">
									<span class="-mt-1">{hint}</span>
								</span>
							</div>{/if}{:else if !isSeparator(wordString)}<button
							type="button"
							class="inline {unknown.find((r) => (r.inflected || r.word) == wordString)
								? 'border-b-2 border-blue-3 border-dotted'
								: 'hover:underline decoration-yellow'}"
							on:click={() => onClickedWord(wordString)}>{wordString}</button
						>{:else}{wordString}{/if}{/each}</span
			>
			<span> </span>
		{/each}
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

	{#if evaluation}
		{#if ['correct', 'typo'].includes(evaluation.outcome)}
			<div class="mb-4">Correct!</div>
		{:else}
			<div class="mb-4">
				{#if evaluation.answered}
					You answered <b>{evaluation.answered}</b>.
				{/if}

				{#if isFetchingEvaluation}
					<div class="mt-2"><Spinner /></div>
				{/if}

				{evaluation.evaluation || ''}
			</div>
		{/if}

		{#if evaluation.outcome == 'typo'}
			<div class="mb-4">However, it is not spelled "{evaluation.answered}".</div>
		{/if}
	{/if}

	{#if unknown.length > 0 || isLoadingUnknown}
		<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8 items-stretch">
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

	{#if !evaluation}
		<div class="mt-4 mb-4">
			<SpinnerButton onClick={onTranslate} type="secondary">Translate</SpinnerButton>

			{#if answered}
				<SpinnerButton onClick={() => onAnswer(answered || '')}>Submit</SpinnerButton>
			{:else}
				<SpinnerButton onClick={onReveal}>Reveal</SpinnerButton>
			{/if}
		</div>
	{:else}
		<div class="mt-4">
			<SpinnerButton onClick={onTranslate} type="secondary">Translate</SpinnerButton>

			<SpinnerButton type="primary" onClick={onNext} grabFocus={true}>Continue</SpinnerButton>
		</div>
	{/if}
</form>
