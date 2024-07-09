<script lang="ts">
	import { goto } from '$app/navigation';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import { getLanguageOnClient } from '../api/api-call';
	import { getReaderHistory } from './history';

	let url = '';

	function go() {
		return goto(`./reader/url?url=${encodeURIComponent(url)}`);
	}

	const history = getReaderHistory();
</script>

<h1 class="text-2xl mb-6 mt-8">Reader</h1>

<p class="mb-8 text-sm font-lato">
	Import a {getLanguageOnClient().name} article from another website. You will get tools to translate
	and simplify the text. Any unknown words will feed into your exercises.
</p>

{#if history.length > 0}
	<ul class="mb-8">
		{#each history as item}
			<li class="mb-3">
				<a
					href="./reader/url?url={encodeURIComponent(item.url)}"
					class="text-blue-4 underline text-lg">{item.title}</a
				>
				<div class="font-lato text-sm">{new URL(item.url).host} {item.date}</div>
			</li>
		{/each}
	</ul>
{/if}

<p class="mb-2 text-sm font-lato">Article URL</p>

<form>
	<input
		type="text"
		class="bg-blue-1 rounded-sm block p-2 text-lg flex-1 w-full mb-4"
		bind:value={url}
		placeholder="https://example.com/article"
	/>

	<SpinnerButton onClick={go}>Load</SpinnerButton>
</form>
