<script lang="ts">
	import { callDeleteSentence } from '../../api/sentences/[sentence]/client';
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

	function deleteSentence(id: number) {
		data.sentences = data.sentences.filter((s) => s.id !== id);

		callDeleteSentence(id);
	}

	function sortWordEntries(words: Record<string, number>) {
		return Object.entries(words).sort((a, b) => a[0].localeCompare(b[0]));
	}
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
	{#each sortWordEntries(wordCountsEarlier) as [word, count]}
		<button
			class="whitespace-nowrap text-white px-2 py-1 rounded-md {word == filterWord
				? 'bg-blue-4'
				: 'bg-blue-3'}"
			on:click={() => (filterWord = filterWord === word ? undefined : word)}
		>
			{word}: {count}
		</button>
	{/each}
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
			<button
				class="ml-2 border rounded-sm px-2 text-xs text-blue-3"
				on:click={() => deleteSentence(sentence.id)}>Delete</button
			>
		</li>
	{/each}
</ul>
