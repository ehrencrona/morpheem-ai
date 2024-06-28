<script lang="ts">
	import { goto } from '$app/navigation';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import { getLanguageOnClient } from '../api/api-call';

	let url = '';

	function go() {
		return goto(`./reader/url?url=${encodeURIComponent(url)}`);
	}
</script>

<h1 class="text-2xl mb-6 mt-8">Reader</h1>

<p class="mb-8 text-xs font-lato">
	Import a {getLanguageOnClient().name} article from another website. You will get tools to translate and simplify
	the text. Any words you read will feed into your exercises.
</p>

<p class="mb-2 text-xs font-lato">Article URL</p>

<form>
	<input
		type="text"
		class="bg-blue-1 rounded-sm block p-2 text-lg flex-1 w-full mb-4"
		bind:value={url}
		placeholder="https://example.com/article"
	/>

	<SpinnerButton onClick={go}>Load</SpinnerButton>
</form>
