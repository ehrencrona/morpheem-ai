<script lang="ts">
	import { slide } from 'svelte/transition';
	import type * as DB from '../../db/types';
	import { expectedKnowledge, now } from '../../logic/isomorphic/knowledge';
	import { isSeparator, toWordsWithSeparators } from '../../logic/toWords';
	import type { AggKnowledgeForUser } from '../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import SpinnerButton from './SpinnerButton.svelte';

	export let sentence: DB.Sentence;
	export let word: DB.Word | undefined;
	export let knowledge: AggKnowledgeForUser[];

	export let revealed: (UnknownWordResponse & { mnemonic?: string })[];

	export let onUnknown: (word: string) => Promise<any>;
	export let onNext: () => Promise<any>;

	let hint: string | undefined;
	let translation: string | undefined;

	export let getHint: () => Promise<string>;
	export let getTranslation: () => Promise<string>;
	export let getMnemonic: (word: DB.Word) => Promise<any>;

	$: wordsWithSeparators = toWordsWithSeparators(sentence.sentence);

	function clear() {
		console.log('clear')
		hint = undefined;
		translation = undefined;
	}

	$: if (sentence) {
		clear();
	}

	function getExpectedKnowledge(word: DB.Word) {
		const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

		if (wordKnowledge) {
			return (
				Math.round(
					100 * expectedKnowledge(wordKnowledge, { now: now(), lastTime: wordKnowledge.time })
				) + '% known'
			);
		} else {
			return 'first time';
		}
	}
</script>

{#if word}
	<div class="">{word.word}</div>
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
	<div class="mb-6 text-balance text-lg font-lato italic" transition:slide>
		{translation || hint}
	</div>
{/if}

<ul class="flex flex-wrap mb-6 gap-4">
	{#each revealed as word}
		<li class="bg-blue-1 rounded-md px-4 py-3 w-[48%]">
			<div class="font-medium mb-1 text-xs flex">
				<a href="/words/{word.id}" class="flex-1">{word.word}</a>

				<span class="text-xxs font-lato ml-1">{getExpectedKnowledge(word)}</span>
			</div>

			<div class="text-balance text-lg font-lato mt-2">{word.english}</div>

			<div class="text-xs font-lato mt-2">
				{#if word.mnemonic}
					<p>{word.mnemonic}</p>
				{:else}
					<SpinnerButton className="underline" onClick={() => getMnemonic(word)}>
						Mnemonic
					</SpinnerButton>
				{/if}
			</div>
		</li>
	{/each}
</ul>

<div class="flex gap-4">
	{#if !hint && !translation}
		<SpinnerButton
			className="text-blue-1 bg-blue-3 rounded-md px-5 py-1"
			onClick={() => getHint().then((got) => (hint = got))}
		>
			Hint
		</SpinnerButton>
	{/if}

	{#if !translation}
		<SpinnerButton
			className="text-blue-1 bg-blue-3 rounded-md px-5 py-1"
			onClick={() => getTranslation().then((got) => (translation = got))}
		>
			Translation
		</SpinnerButton>
	{/if}

	<SpinnerButton className="text-blue-1 bg-blue-4 rounded-md px-5 py-1" onClick={onNext}>
		Got it
	</SpinnerButton>
</div>
