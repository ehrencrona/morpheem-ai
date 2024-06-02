<script lang="ts">
	import { fade } from 'svelte/transition';
	import Error from '../../../components/Error.svelte';

	export let onClick: () => Promise<any>;
	export let isSubmit = false;
	export let type: 'primary' | 'secondary' = 'primary';
	export let className =
		'text-blue-1 rounded-md py-2 px-8 md:px-6 md:py-1 m-2 ml-0 text-lg md:text-base ' +
		(type == 'primary' ? 'bg-blue-4' : 'bg-blue-3');

	let isLoading = false;
	let showSpinner = false;
	let error: string | undefined = undefined;

	async function didClick() {
		const timeout = setTimeout(() => (showSpinner = true), 300);

		try {
			await onClick();
			error = undefined;
		} catch (e: any) {
			error = e.message || e.toString();

			console.error(e);
		} finally {
			clearTimeout(timeout);

			isLoading = false;
			showSpinner = false;
		}
	}
</script>

<Error
	{error}
	onClear={() => {
		error = undefined;
	}}
/>

<button
	class={`${className} ${error ? 'bg-red' : ''} relative`}
	on:click|preventDefault={didClick}
	disabled={isLoading}
	type={isSubmit ? 'submit' : 'button'}
>
	{#if showSpinner}
		<div
			class="absolute inset-0 flex items-center justify-center"
			transition:fade={{ duration: 200 }}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
				>
					<animateTransform
						attributeName="transform"
						dur="0.75s"
						repeatCount="indefinite"
						type="rotate"
						values="0 12 12;360 12 12"
					/>
				</path>
			</svg>
		</div>
	{/if}

	<div class={showSpinner ? 'opacity-0' : 'opacity-100'} style=" transition: opacity 0.2s">
		<slot />
	</div>
</button>
