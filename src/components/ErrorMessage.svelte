<script lang="ts">
	import { fade } from 'svelte/transition';
	import { errorStore } from '$lib/logError';

	const onClear = () => {
		errorStore.set(null);
	};
</script>

{#if $errorStore}
	<div
		class="flex fixed left-0 bottom-0 right-0 p-2 bg-red text-[#fff] text-xs font-lato z-50"
		transition:fade
	>
		<div class="flex-1">{$errorStore.message || $errorStore.toString()}</div>
		<div>
			<button class="underline ml-2" on:click={onClear}>Close</button>
		</div>
	</div>
{/if}
