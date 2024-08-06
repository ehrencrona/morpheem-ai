<script lang="ts">
	import { addUnknown } from '$lib/addUnknown';
	import { toPercent } from '$lib/toPercent';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { AggKnowledgeForUser } from '../../../db/types';
	import { expectedKnowledge, now } from '../../../logic/isomorphic/knowledge';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import WordCard from '../learn/WordCard.svelte';

	export let knowledge: AggKnowledgeForUser[];

	let unknown: UnknownWordResponse[] = [];
	let showAll = false;

	async function onUnknown(word: AggKnowledgeForUser) {
		const unknownWord = await lookupUnknownWord(word.word);

		unknown = addUnknown(unknownWord, unknown);
	}

	$: words = knowledge.map((wordKnowledge) => {
		const word = unknown.find((r) => r.id === wordKnowledge.wordId);

		return {
			word,
			knowledge: wordKnowledge
		};
	});
</script>

<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 items-stretch">
	{#each showAll ? words : words.slice(0, 8) as word (word.knowledge.wordId)}
		{#if word.word}
			<WordCard word={word.word} />
		{:else}
			<button
				class="bg-light-gray rounded-md px-4 py-3 w-full mb-4 text-left inline-flex"
				on:click={() => onUnknown(word.knowledge)}
				type="button"
			>
				<div class="text-base flex items-center w-full">
					<span class="flex-1 font-sans">{word.knowledge.word}</span>
					<span class="text-xxs font-lato ml-1">
						{toPercent(
							expectedKnowledge(word.knowledge, {
								now: now(),
								exercise: 'read'
							})
						)} / {toPercent(
							expectedKnowledge(word.knowledge, {
								now: now(),
								exercise: 'write'
							})
						)}
					</span>
				</div>
			</button>
		{/if}
	{/each}
</div>

{#if words.length > 8}
	<SpinnerButton
		onClick={async () => (showAll = !showAll)}
		className="underline text-blue-3 text-sm font-lato mb-2"
	>
		{showAll ? 'Show less' : 'Show more'}
	</SpinnerButton>
{/if}
