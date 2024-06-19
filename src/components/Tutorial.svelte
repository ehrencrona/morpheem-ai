<script lang="ts">
	import { onMount } from 'svelte';

	export let paragraphs: string[];
	export let id: string;

	let show = false;

	onMount(() => {
		const counter = parseInt(localStorage.getItem(`tutorial-${id}`) || '0') || 0;

		if (counter < 3) {
			show = true;
			localStorage.setItem(`tutorial-${id}`, (counter + 1).toString());
		}
	});
</script>

{#if show}
	<div
		class="bg-blue-1 border border-blue-4 py-2 px-4 rounded-sm inline-block text-sm font-lato mb-6 text-balance mt-8"
	>
		{#each paragraphs as text}
			<p class="my-1">
				{text}
			</p>
		{/each}
	</div>
{/if}
