<script lang="ts">
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';
	import type { Word } from '../../../../db/types';
	import { callDeleteSentence } from '../../api/sentences/[sentence]/client';
	import { sendSentenceUnit } from '../../api/sentences/[sentence]/unit/client';
	import { sendWordUnit } from '../../api/word/[id]/unit/client';
	import type { PageData } from './$types';

	export let data: PageData;

	$: isAdmin = data.isAdmin;

	$: allWordsByWord = data.allWordsByWord;

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

	$: wordCountsExcessive = data.sentences.reduce(
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

	function findWord(wordString: string) {
		return allWordsByWord[wordString];
	}

	let filterWord: Word | undefined = undefined;

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

	function toggleFilter(wordString: string) {
		if (filterWord?.word === wordString) {
			filterWord = undefined;
		} else {
			filterWord = findWord(wordString);
		}
	}

	let isShowAllExcessive = false;
</script>

<h1 class="text-lg font-sans font-bold mt-8 mb-8">{data.unit.name}</h1>

<h2 class="mb-2 text-sm font-bold">New vocabulary</h2>

<div class="flex flex-wrap gap-2 mb-8">
	{#each sortWordEntries(wordCountsThis) as [word, count]}
		<button
			class="whitespace-nowrap bg-blue-3 text-white px-2 py-1 rounded-md {word == filterWord?.word
				? 'bg-blue-4'
				: 'bg-blue-3'} {count < 5 ? 'opacity-50' : ''}"
			on:click={() => toggleFilter(word)}
		>
			{word}: {count}
		</button>
	{/each}
</div>

{#if Object.entries(wordCountsExcessive).length && isAdmin}
	<h2 class="mb-2 text-sm font-bold">Not in vocabulary</h2>

	<div class="flex flex-wrap gap-2 mb-8">
		{#each sortWordEntries(wordCountsExcessive)
			.sort((a, b) => b[1] - a[1])
			.slice(0, isShowAllExcessive ? undefined : 20) as [word, count]}
			<button
				class="whitespace-nowrap text-white px-2 py-1 rounded-md {word == filterWord?.word
					? 'bg-morpheem-darkred'
					: 'bg-red'}"
				on:click={() => toggleFilter(word)}
			>
				{word}: {count}
			</button>
		{/each}

		{#if Object.keys(wordCountsExcessive).length > 20}
			<button
				on:click={() => (isShowAllExcessive = !isShowAllExcessive)}
				class="whitespace-nowrap text-blue-3 px-2 py-1"
			>
				{isShowAllExcessive ? 'Show less' : 'Show more'}
			</button>
		{/if}
	</div>
{/if}

{#if filterWord}
	<h2 class="text-lg mb-4">
		<a href="../words/{filterWord.id}">
			{filterWord.word}
		</a>

		{#if isAdmin}
			<SpinnerButton
				className="ml-2 text-white bg-red rounded-md py-1 px-4 m-2 text-xs whitespace-nowrap"
				onClick={async () => {
					if (filterWord) {
						if (filterWord.unit == data.unit.id) {
							await sendWordUnit(null, filterWord.id);

							data.words = data.words.filter(({ id }) => id !== filterWord?.id);

							filterWord = undefined;
						} else {
							await sendWordUnit(data.unit.id, filterWord.id);

							data.words = data.words.concat(filterWord);
						}
					}
				}}
			>
				{#if filterWord.unit == data.unit.id}
					Remove from unit
				{:else}
					Add to unit
				{/if}
			</SpinnerButton>
		{/if}
	</h2>
{/if}

<div class="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2 gap-y-1">
	{#each data.sentences.filter((s) => filterWord == undefined || s.words.includes(filterWord.word)) as sentence}
		<span class="text-xxs">
			#{sentence.id}
		</span>

		<a href="../sentences/{sentence.id}" class="pb-1 border-b-[1px] border-gray">
			{sentence.sentence}
		</a>

		<div>
			{#if isAdmin}
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
			{/if}
		</div>
	{/each}
</div>
