<script lang="ts">
	export let onClick: () => Promise<any>;
	export let isSubmit = false;
	export let type: 'primary' | 'secondary' = 'primary';
	export let className =
		'text-blue-1 rounded-md px-6 py-1 m-2 ml-0 ' + (type == 'primary' ? 'bg-blue-4' : 'bg-blue-3');

	let isLoading = false;
	let showSpinner = false;

	async function didClick() {
		const timeout = setTimeout(() => (showSpinner = true), 300);

		try {
			await onClick();
		} finally {
			clearTimeout(timeout);

			isLoading = false;
			showSpinner = false;
		}
	}
</script>

<button
	class={`${className} relative`}
	on:click|preventDefault={didClick}
	disabled={isLoading}
	type={isSubmit ? 'submit' : 'button'}
>
	{#if showSpinner}
		<div class="absolute left-1 top-2">
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

	<slot />
</button>
