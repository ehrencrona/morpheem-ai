<script lang="ts">
	import SpinnerButton from '../../../components/SpinnerButton.svelte';

	export let sentences: { sentence: string }[];

	export let showAll = false;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 w-full gap-x-4 text-xs">
	{#each showAll ? sentences : sentences.slice(0, 6) as sentence}
		<div class="bg-light-gray rounded-md px-4 py-3 w-full mb-4">
			{sentence.sentence}
		</div>
	{/each}
</div>

{#if sentences.length > 6}
	<SpinnerButton
		onClick={async () => (showAll = !showAll)}
		className="underline text-blue-3 text-sm font-lato mb-2"
	>
		{showAll ? 'Show less' : 'Show more'}
	</SpinnerButton>
{/if}
