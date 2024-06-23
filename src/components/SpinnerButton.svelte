<script lang="ts">
	import { logError } from '$lib/logError';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Spinner from './Spinner.svelte';

	export let onClick: () => Promise<any>;
	export let isSubmit = false;
	export let grabFocus = false;
	export let type: 'primary' | 'secondary' = 'primary';
	export let className =
		'text-blue-1 rounded-md py-2 px-8 md:px-6 md:py-1 m-2 ml-0 text-base whitespace-nowrap ' +
		(type == 'primary' ? 'bg-blue-4' : 'bg-blue-3');

	let isLoading = false;
	let showSpinner = false;
	let button: HTMLButtonElement;
	let error: string | undefined = undefined;

	async function didClick() {
		const timeout = setTimeout(() => (showSpinner = true), 300);

		try {
			await onClick();
			error = undefined;
		} catch (e: any) {
			error = e.message || e.toString();

			logError(e);
		} finally {
			clearTimeout(timeout);

			isLoading = false;
			showSpinner = false;
		}
	}

	onMount(() => {
		if (grabFocus) {
			setTimeout(() => button?.focus());
		}
	});
</script>

<button
	class={`${className} ${error ? 'bg-red' : ''} relative`}
	on:click|preventDefault={didClick}
	disabled={isLoading}
	type={isSubmit ? 'submit' : 'button'}
	bind:this={button}
>
	{#if showSpinner}
		<div
			class="absolute inset-0 flex items-center justify-center"
			transition:fade={{ duration: 200 }}
		>
			<Spinner />
		</div>
	{/if}

	<div class={showSpinner ? 'opacity-0' : 'opacity-100'} style=" transition: opacity 0.2s">
		<slot />
	</div>
</button>
