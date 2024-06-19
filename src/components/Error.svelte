<script lang="ts" context="module">
	let lastThrottleTime = 0;
	let logCount = 0;
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';

	export let error: any | undefined;
	export let onClear: () => any;

	import { captureException } from '@sentry/browser';

	$: if (error) {
		console.log(error);

		logCount++;

		let isWorthLogging =
			error.message != 'Failed to fetch' &&
			typeof document !== 'undefined' &&
			document.location.hostname !== 'localhost';

		if (isWorthLogging && (logCount < 4 || Date.now() - lastThrottleTime > 60000)) {
			lastThrottleTime = Date.now();
			logCount = 0;

			captureException(error);
		}
	}
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
