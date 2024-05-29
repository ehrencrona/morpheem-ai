<script lang="ts">
	import { slide } from 'svelte/transition';
	import type * as DB from '../../../db/types';
	import { expectedKnowledge, now } from '../../../logic/isomorphic/knowledge';
	import { isSeparator, toWordsWithSeparators } from '../../../logic/toWords';
	import type { AggKnowledgeForUser, Language } from '../../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { fetchAskMeAnything } from '../api/write/ama/client';
	import Ama from './AMA.svelte';
	import SpinnerButton from './SpinnerButton.svelte';
	import WordCard from './WordCard.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word | undefined;
	export let knowledge: AggKnowledgeForUser[] | undefined = undefined;
	export let language: Language;

	export let revealed: UnknownWordResponse[];

	export let onUnknown: (word: string) => Promise<any>;
	export let onRemoveUnknown: (word: string) => Promise<any>;
	export let onNext: () => Promise<any>;

	let hint: string | undefined;
	let translation: string | undefined;

	export let getHint: () => Promise<string>;
	export let getTranslation: () => Promise<string>;

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence, language);

	function clear() {
		hint = undefined;
		translation = undefined;
	}

	$: if (sentence) {
		clear();
	}

	function getExpectedKnowledge(word: DB.Word) {
		if (!knowledge) return '';

		const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

		if (wordKnowledge) {
			return (
				Math.round(100 * expectedKnowledge(wordKnowledge, { now: now(), exercise: 'read' })) +
				'% known'
			);
		} else {
			return 'first time';
		}
	}
</script>

{#if word}
	<div class="">
		{word.word} <span class="text-xxs font-lato ml-1">{getExpectedKnowledge(word)}</span>
	</div>
{/if}

<div class="text-4xl mb-4 mt-4 font-medium">
	{#each wordsWithSeparators as word, index}{#if !isSeparator(word)}<span
				style="cursor: pointer"
				role="button"
				tabindex={index}
				on:click={() => onUnknown(word)}>{word}</span
			>{:else}{word}{/if}{/each}
</div>

{#if translation || hint}
	<div class="mb-6 text-balance text-lg font-lato italic" in:slide>
		{translation || hint}
	</div>
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4">
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

<div class="flex gap-2">
	{#if !hint && !translation}
		<SpinnerButton type="secondary" onClick={() => getHint().then((got) => (hint = got))}>
			Hint
		</SpinnerButton>
	{/if}

	{#if !translation}
		<SpinnerButton
			type="secondary"
			onClick={() => getTranslation().then((got) => (translation = got))}
		>
			Translation
		</SpinnerButton>
	{/if}

	<SpinnerButton onClick={onNext}>Got it</SpinnerButton>
</div>

<div
	class="absolute bottom-0 left-0 right-0 bg-[#ffffff] px-4 py-2 flex justify-center center z-30"
	style="box-shadow: 0 -2px 4px -1px rgba(0, 0, 0, 0.1);"
>
	<div class="w-full max-w-[800px]">
		<Ama
			explanation="You can refer to the current question or the explained words."
			ask={(question) =>
				fetchAskMeAnything({
					type: 'read',
					question,
					word: word?.word,
					sentence: sentence.sentence,
					revealed,
					translation
				})}
			wordId={sentence.id}
		/>
	</div>
</div>
