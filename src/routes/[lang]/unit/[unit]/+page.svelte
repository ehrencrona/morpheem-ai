<script lang="ts">
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';
	import { callDeleteSentence } from '../../api/sentences/[sentence]/client';
	import { sendSentenceUnit } from '../../api/sentences/[sentence]/unit/client';
	import { sendWordUnit } from '../../api/word/[id]/unit/client';
	import type { PageData } from './$types';

	export let data: PageData;

	$: wordCountsEarlier = data.sentences.reduce(
		(acc, sentence) => {
			sentence.words.forEach((word) => {
				if (word in acc) {
					acc[word] = acc[word] ? acc[word] + 1 : 1;
				}
			});

			return acc;
		},
		data.words
			.filter((w) => w.unit != null && w.unit < data.unit.id)
			.reduce(
				(acc, word) => {
					acc[word.word] = 0;
					return acc;
				},
				{} as Record<string, number>
			)
	);

	$: wordCountsThis = data.sentences.reduce(
		(acc, sentence) => {
			sentence.words.forEach((word) => {
				if (word in acc) {
					acc[word] = acc[word] + 1;
				}
			});

			return acc;
		},
		data.words
			.filter((w) => w.unit == data.unit.id)
			.reduce(
				(acc, word) => {
					acc[word.word] = 0;
					return acc;
				},
				{} as Record<string, number>
			)
	);

	$: wordCountsWrong = data.sentences.reduce(
		(acc, sentence) => {
			sentence.words.forEach((word) => {
				if (!data.words.find((w) => w.word == word)) {
					acc[word] = acc[word] ? acc[word] + 1 : 1;
				}
			});

			return acc;
		},
		{} as Record<string, number>
	);

	let filterWord: string | undefined = undefined;

	async function deleteSentence(id: number) {
		await callDeleteSentence(id);
		data.sentences = data.sentences.filter((s) => s.id !== id);
	}

	async function removeFromUnit(id: number) {
		await sendSentenceUnit(null, id);
		data.sentences = data.sentences.filter((s) => s.id !== id);
	}

	function sortWordEntries(words: Record<string, number>) {
		return Object.entries(words).sort((a, b) => a[0].localeCompare(b[0]));
	}

	let isShowAllEarlier = false;
</script>

<h1 class="text-lg font-sans font-bold mt-8 mb-8">{data.unit.name}</h1>

<h2>This unit</h2>

<div class="flex flex-wrap gap-2 mb-8">
	{#each sortWordEntries(wordCountsThis) as [word, count]}
		<button
			class="whitespace-nowrap bg-blue-3 text-white px-2 py-1 rounded-md {word == filterWord
				? 'bg-blue-4'
				: 'bg-blue-3'} {count < 5 ? 'opacity-50' : ''}"
			on:click={() => (filterWord = filterWord === word ? undefined : word)}
		>
			{word}: {count}
		</button>
	{/each}
</div>

<h2>Earlier units</h2>

<div class="flex flex-wrap gap-2 mb-8">
	{#each sortWordEntries(wordCountsEarlier).slice(0, isShowAllEarlier ? undefined : 20) as [word, count]}
		<button
			class="whitespace-nowrap text-white px-2 py-1 rounded-md {word == filterWord
				? 'bg-blue-4'
				: 'bg-blue-3'}"
			on:click={() => (filterWord = filterWord === word ? undefined : word)}
		>
			{word}: {count}
		</button>
	{/each}

	{#if Object.keys(wordCountsEarlier).length > 20}
		<button
			on:click={() => (isShowAllEarlier = !isShowAllEarlier)}
			class="whitespace-nowrap text-blue-3 px-2 py-1"
		>
			{isShowAllEarlier ? 'Show less' : 'Show more'}
		</button>
	{/if}
</div>

{#if Object.entries(wordCountsWrong).length}
	<h2>Excessive</h2>

	<div class="flex flex-wrap gap-2 mb-8">
		{#each sortWordEntries(wordCountsWrong) as [word, count]}
			<button
				class="whitespace-nowrap text-white px-2 py-1 rounded-md {word == filterWord
					? 'bg-morpheem-darkred'
					: 'bg-red'}"
				on:click={() => (filterWord = filterWord === word ? undefined : word)}
			>
				{word}: {count}
			</button>
		{/each}
	</div>
{/if}

<ul>
	{#each data.sentences.filter((s) => filterWord == undefined || s.words.includes(filterWord)) as sentence}
		<li>
			{sentence.sentence}

			<span class="text-xxs">
				#{sentence.id}
			</span>
			<SpinnerButton
				className="ml-2 border rounded-sm px-2 text-xs text-blue-3"
				onClick={() => deleteSentence(sentence.id)}
			>
				Delete
			</SpinnerButton>
			<SpinnerButton
				className="ml-2 border rounded-sm px-2 text-xs text-blue-3"
				onClick={() => removeFromUnit(sentence.id)}
			>
				Remove
			</SpinnerButton>
		</li>
	{/each}
</ul>
