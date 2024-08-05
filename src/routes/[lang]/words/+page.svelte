<script lang="ts">
	import { onMount } from 'svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { ResultSchema } from '../api/word/+server';
	import { sendWords } from '../api/word/client';
	import { fetchWordsByPrefix } from '../api/word/prefix/[prefix]/client';
	import type { PageData } from './$types';

	export let data: PageData;

	$: isAdmin = data.isAdmin;

	let searchString: string;

	onMount(() => {
		searchString = localStorage.getItem('wordSearch') || '';
	});

	let words: string[] = [];

	$: !import.meta.env.SSR &&
		fetchWordsByPrefix(searchString).then((res) => {
			words = res;
		});

	$: if (searchString) {
		localStorage.setItem('wordSearch', searchString);
	}

	let addLemma: string;
	let addResult: ResultSchema | undefined;

	async function addWords() {
		addResult = await sendWords(addLemma.split(',').map((s) => s.trim()));
	}
</script>

<main>
	<div class="flex items-center">
		<div class="mr-2">Word search:</div>
		<input
			type="text"
			bind:value={searchString}
			class="bg-blue-1 rounded-sm block p-2 text-lg mb-2 w-60"
		/>
	</div>

	<div class="flex gap-2 flex-wrap mt-4">
		{#each words.length ? words : data.words as word}
			<div class="bg-blue-1 border-blue-1 rounded-lg px-5 py-1 whitespace-nowrap">
				<a href={`words/${word}`}>{word}</a>
			</div>
		{/each}
	</div>

	{#if isAdmin}
		<div class="border-2 border-blue-4 p-2 mt-8 rounded-lg inline-block">
			<p class="text-xs mb-2 mt-1">Add words:</p>

			<div class="flex gap-2">
				<input
					type="text"
					class="bg-blue-1 rounded-sm block p-2 text-lg mb-2 w-60"
					bind:value={addLemma}
				/>

				<SpinnerButton onClick={addWords}>Add</SpinnerButton>
			</div>

			{#if addResult}
				{#each addResult as word}
					<div class="bg-blue-1 rounded-lg px-5 py-1">
						<b>{word.word}</b>:ok
					</div>
				{/each}

				{#if addResult.length == 0}
					<div class="bg-blue-1 px-5 py-1 font-bold">
						No words added
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</main>
