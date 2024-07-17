<script lang="ts">
	import { callDeleteSentence } from '../../api/sentences/[sentence]/client';
	import type { PageData } from './$types';

	export let data: PageData;

	$: wordCounts = data.sentences.reduce(
		(acc, sentence) => {
			sentence.words.forEach((word) => {
				acc[word] = acc[word] ? acc[word] + 1 : 1;
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
</script>

<h1 class="text-lg font-sans font-bold mt-4 mb-8">{data.unit.name}</h1>
<div class="flex flex-wrap gap-2 mb-8">
	{#each Object.entries(wordCounts) as [word, count]}
		<button
			class="whitespace-nowrap bg-blue-3 text-white px-2 py-1 rounded-md {word == filterWord
				? 'bg-blue-4'
				: ''} {data.words.find((w) => w.word == word) ? '' : 'opacity-50'}"
			on:click={() => (filterWord = filterWord === word ? undefined : word)}
		>
			{word}: {count}
		</button>
	{/each}
</div>

<ul>
	{#each data.sentences.filter((s) => filterWord == undefined || s.words.includes(filterWord)) as sentence}
		<li>
			{sentence.sentence}
			<button
				class="ml-2 border rounded-sm px-2 text-xs text-blue-3"
				on:click={() => deleteSentence(sentence.id)}>Delete</button
			>
		</li>
	{/each}
</ul>
