<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchWordsByPrefix } from '../api/word/prefix/[prefix]/client';
	import type { PageData } from './$types';

	export let data: PageData;

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
</main>
