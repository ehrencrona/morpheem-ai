<script lang="ts">
	import type { load } from './+page.server';

	export let data: Awaited<ReturnType<typeof load>>;
</script>

<main>
	{#each data.sentences as sentence}
		<p>
			<a href={`/${data.languageCode}/sentences/${sentence.id}`}>{sentence.sentence}</a>
		</p>
	{/each}
</main>
