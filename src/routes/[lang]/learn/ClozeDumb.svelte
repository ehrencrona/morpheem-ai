<script lang="ts">
	import { slide } from 'svelte/transition';
	import * as DB from '../../../db/types';
	import { standardize } from '../../../logic/isomorphic/standardize';
	import { isSeparator, toWords, toWordsWithSeparators } from '../../../logic/toWords';
	import type { AggKnowledgeForUser, Language, SentenceWord } from '../../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import SpinnerButton from './SpinnerButton.svelte';
	import WordCard from './WordCard.svelte';

	export let sentence: DB.Sentence;
	export let sentenceWords: SentenceWord[];

	export let word: DB.Word;
	export let englishWord: string | undefined;
	export let englishSentence: string | undefined;
	export let mnemonic: string | undefined;

	export let language: Language;

	export let showChars: number;

	export let suggestedWords: string[] = [];
	export let answered: string | undefined;

	export let revealed: UnknownWordResponse[];
	export let knowledge: AggKnowledgeForUser[] | undefined = undefined;

	export let onHint: () => Promise<any>;
	export let onNext: (knew: boolean) => Promise<any>;
	export let onUnknown: (wordString: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onReveal: () => Promise<any>;
	export let onTranslate: () => Promise<any>;
	export let onType: (prefix: string) => void;
	export let onAnswer: (wordString: string) => void;

	$: answer = conjugatedWord.slice(0, showChars) + (prefix || '');

	let prefix: string | null;

	function clear() {
		prefix = null;
	}

	$: if (sentence.id) {
		clear();
	}

	$: isRevealed = showChars >= word.word.length;
	$: knew = answered == word.word || answered == conjugatedWord;

	$: if (prefix != null || showChars > 0) {
		onType(answer);
	}

	$: wordStrings = toWords(sentence.sentence, language);

	$: conjugatedWord = wordStrings[sentenceWords.findIndex((w) => w.id === word.id)];
	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence, language);

	function onSubmit() {
		onAnswer(answer);
	}
</script>

<form class="text-4xl mb-8 mt-8 font-medium" on:submit={onSubmit}>
	{#each wordsWithSeparators as wordString, index}{#if !isSeparator(wordString)}{#if standardize(wordString) == standardize(conjugatedWord)}
				{#if isRevealed}
					<span class={knew ? 'text-green' : 'text-red'}>{wordString}</span>
				{:else}
					<span class="whitespace-nowrap">
						{wordString.slice(0, showChars)}
						<input
							type="text"
							class="border-b-4 border-b-red bg-blue-1"
							size={wordString.length - showChars}
							bind:value={prefix}
						/>
					</span>
				{/if}
			{:else}<span
					style="cursor: pointer"
					role="button"
					tabindex={index}
					on:click={() => onUnknown(wordString)}>{wordString}</span
				>{/if}{:else}{wordString}{/if}{/each}
</form>

{#if !isRevealed}
	{#if englishSentence || englishWord}
		<div class="text-sm mb-4" in:slide>{englishSentence || englishWord}</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8">
		{#each revealed as word (word.id)}
			<WordCard
				{word}
				mnemonic={word.mnemonic}
				onRemove={() => onRemoveUnknown(word.word)}
				english={word.english}
			/>
		{/each}
	</div>

	{#if suggestedWords.length > 0 && !answered}
		<div class="flex flex-wrap gap-4 mt-8 mb-8">
			{#each suggestedWords as suggestedWord}
				<button
					class="bg-blue-1 border-blue-1 rounded-lg px-5 py-1"
					on:click={() => onAnswer(suggestedWord)}
				>
					{suggestedWord}
				</button>
			{/each}
		</div>
		<div class="text-xs font-sans mb-8">
			Select the dictionary form of the word.
		</div>
	{/if}

	<div class="mt-4">
		<SpinnerButton onClick={onHint} type="secondary">Hint</SpinnerButton>

		<SpinnerButton onClick={onTranslate} type="secondary">Translate</SpinnerButton>

		<SpinnerButton onClick={onReveal}>Reveal</SpinnerButton>
	</div>
{:else}
	{#if knew}
		<div class="mb-4">Correct!</div>
	{:else if answered}
		<div class="mb-4">You picked <b>{answered}</b>.</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 mt-8">
		<WordCard {word} english={englishWord} {mnemonic} />

		{#each revealed as word (word.id)}
			<WordCard
				{word}
				mnemonic={word.mnemonic}
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
