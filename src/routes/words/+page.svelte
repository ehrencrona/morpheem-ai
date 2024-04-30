<script lang="ts">
	import type { load } from './+page.server';

	export let data: Awaited<ReturnType<typeof load>>;
</script>

<main>
	{#each data.words as word}
		<p>
			<a href="/words/{word.id}">{word.word}</a>
		</p>
	{/each}
</main>
