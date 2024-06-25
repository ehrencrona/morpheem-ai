<script lang="ts">
	import { goto } from '$app/navigation';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';

	let url = '';

	function go() {
		return goto(`./read/url?url=${encodeURIComponent(url)}`);
	}
</script>

<h1 class="text-2xl mb-6 mt-8">Read article</h1>

<p class="mb-4 text-sm">Enter URL:</p>

<form>
	<input
		type="text"
		class="bg-blue-1 rounded-sm block p-2 text-lg flex-1 w-full mb-4"
		bind:value={url}
	/>

	<SpinnerButton onClick={go}>Load</SpinnerButton>
</form>
