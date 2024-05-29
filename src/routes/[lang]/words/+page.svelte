<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;

	export let cognatesOnly = false;

	$: words = cognatesOnly
		? data.words.filter((word) => word.cognate)
		: data.words;
</script>

<div>
	<label>
		<input type="checkbox" bind:checked={cognatesOnly} />
		Cognates
	</label>
</div>

<main>
	{#each words as word}
		<div class='word'>
			<a href={`words/${word.id}`}>{word.word}</a>
		</div>
	{/each}
</main>

<style>
	.word {
		line-height: 140%;
	}
</style>