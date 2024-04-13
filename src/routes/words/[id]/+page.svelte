<script lang="ts">
	import type { load } from './+page.server';

	export let data: Awaited<ReturnType<typeof load>>;
</script>

<main>
	<h1>{data.word?.word}</h1>

	<p><i>{data.word?.english}</i></p>

	{#each data.sentences as sentence}
		<p>
			<a href="/sentences/{sentence.id}">{sentence.sentence}</a>
		</p>
	{/each}

	{#if data.forms.length}
		<h2>Forms</h2>

		<ul>
			{#each data.forms as form}
				<li>
					{form.word}
				</li>
			{/each}
		</ul>
	{/if}
</main>
