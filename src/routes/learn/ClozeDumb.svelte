<script lang="ts">
	import { slide } from 'svelte/transition';
	import * as DB from '../../db/types';
	import { standardize } from '../../logic/isomorphic/standardize';
	import { isSeparator, toWords, toWordsWithSeparators } from '../../logic/toWords';
	import type { AggKnowledgeForUser, SentenceWord } from '../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import SpinnerButton from './SpinnerButton.svelte';
	import WordCard from './WordCard.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word;
	export let sentenceWords: SentenceWord[];
	export let english: string | undefined;
	export let showPercentage: number;
	export let showEnglish: boolean;
	export let suggestedWords: string[] = [];
	export let userSelection: string | undefined;
	export let revealed: UnknownWordResponse[];
	export let knowledge: AggKnowledgeForUser[] | undefined = undefined;

	export let onHint: () => Promise<any>;
	export let onNext: (knew: boolean) => Promise<any>;
	export let onUnknown: (wordString: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onReveal: () => Promise<any>;
	export let onType: (prefix: string) => void;
	export let onAnswer: (wordString: string) => void;

	let prefix: string;

	function clear() {
		prefix = '';
	}

	$: if (sentence.id) {
		clear();
	}

	$: isRevealed = showPercentage >= 1;
	$: knew = userSelection == word.word;

	$: if (prefix != null) {
		onType(prefix);
	}

	$: wordStrings = toWords(sentence.sentence);

	$: maskedWordString = wordStrings[sentenceWords.findIndex((w) => w.id === word.id)];
	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence);
	$: showChars = Math.floor(maskedWordString.length * showPercentage);
</script>

<div class="text-4xl mb-8 mt-8 font-medium">
	{#each wordsWithSeparators as wordString, index}{#if !isSeparator(wordString)}{#if standardize(wordString) == standardize(maskedWordString)}
				{#if isRevealed}
					<span class={knew ? 'text-green' : 'text-red'}>{wordString}</span>
				{:else}
					<span class="whitespace-nowrap">
						<input
							type="text"
							class="border-b-4 border-b-red bg-blue-1"
							size={wordString.length - showChars}
							bind:value={prefix}
						/>
						{wordString.slice(wordString.length - showChars)}
					</span>
				{/if}
			{:else}<span
					style="cursor: pointer"
					role="button"
					tabindex={index}
					on:click={() => onUnknown(wordString)}>{wordString}</span
				>{/if}{:else}{wordString}{/if}{/each}
</div>

{#if !isRevealed}
	{#if english && showEnglish}
		<div class="text-sm mb-4" in:slide>{english}</div>
	{/if}

	<div class="flex flex-wrap mb-6 gap-4">
		{#each revealed as word (word.id)}
			<WordCard {word} onRemove={() => onRemoveUnknown(word.word)} english={word.english} />
		{/each}
	</div>

	{#if suggestedWords.length > 0}
		<div class="flex flex-wrap gap-4 my-8">
			{#each suggestedWords as suggestedWord}
				<button
					class="bg-blue-1 border-blue-1 rounded-lg px-5 py-1"
					on:click={() => onAnswer(suggestedWord)}
				>
					{suggestedWord}
				</button>
			{/each}
		</div>
	{/if}

	<div class="mt-4">
		<SpinnerButton onClick={onHint} type="secondary">Hint</SpinnerButton>

		<SpinnerButton onClick={onReveal} type="secondary">Reveal</SpinnerButton>
	</div>
{:else}
	{#if knew}
		<div class="mb-4">Correct!</div>
	{:else if userSelection}
		<div class="mb-4">You picked <b>{userSelection}</b>.</div>
	{/if}

	<div class="flex flex-wrap mb-6 gap-4">
		<WordCard {word} {english} />
		{#each revealed as word (word.id)}
			<WordCard
				{word}
				onRemove={() => onRemoveUnknown(word.word)}
				english={word.english}
				{knowledge}
			/>
		{/each}
	</div>

	<SpinnerButton
		className="text-blue-1 bg-blue-4 rounded-md px-5 py-1 mt-2"
		onClick={() => onNext(knew)}
	>
		Continue
	</SpinnerButton>
{/if}
