<script lang="ts">
	import { expectedKnowledge, now } from '../../logic/isomorphic/knowledge';
	import type { AggKnowledgeForUser } from '../../logic/types';
	import type { UnknownWordResponse } from '../api/word/unknown/+server';
	import { lookupUnknownWord } from '../api/word/unknown/client';
	import SpinnerButton from '../learn/SpinnerButton.svelte';
	import WordCard from '../learn/WordCard.svelte';

	export let knowledge: AggKnowledgeForUser[];

	let revealed: UnknownWordResponse[] = [];
	let showAll = false;

	async function onUnknown(word: AggKnowledgeForUser) {
		const unknownWord = await lookupUnknownWord(word.word, undefined);

		revealed = [...revealed, unknownWord];
	}

	$: words = knowledge.map((wordKnowledge) => {
		const revealedWord = revealed.find((r) => r.id === wordKnowledge.wordId);

		return {
			word: revealedWord,
			knowledge: wordKnowledge
		};
	});

	const toPercent = (n: number) => `${(n * 100).toFixed(0)}%`;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4">
	{#each showAll ? words : words.slice(0, 8) as word (word.knowledge.wordId)}
		{#if word.word}
			<WordCard
				word={word.word}
				english={word.word.english}
				mnemonic={word.word.mnemonic}
				knowledge={[word.knowledge]}
			/>
		{:else}
			<button
				class="bg-light-gray rounded-md px-4 py-3 w-full mb-4 text-left inline-flex"
				on:click={() => onUnknown(word.knowledge)}
			>
				<div class="text-xs flex items-center w-full">
					<span class="flex-1">{word.knowledge.word}</span>
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
