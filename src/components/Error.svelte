<script lang="ts">
	import { fade } from 'svelte/transition';

	export let error: any | undefined;
	export let onClear: () => any;
</script>

{#if error}
	<div
		class="flex fixed left-0 bottom-0 right-0 p-2 bg-red text-[#fff] text-xs font-lato z-100"
		transition:fade
	>
		<div class="flex-1">{error.message || error.toString()}</div>
		<div>
			<button class="underline ml-2" on:click={onClear}>Close</button>
		</div>
	</div>
{/if}
