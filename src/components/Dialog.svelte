<script lang="ts">
	export let width = 600;

	export let hasPadding = true;

	export let onCancel: () => any;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
	class="fixed inset-0 bg-[#000] bg-opacity-80 flex items-center justify-center z-20 pb-[100px]"
	on:click={onCancel}
	role="dialog"
>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="bg-[#fff] rounded-lg max-w-[94vw] {hasPadding ? 'px-3 md:px-6 py-6 pb-4' : ''}"
		style="box-shadow: 0 0 8px -1px rgba(0, 0, 0, 0.1); width: {width}px"
		on:click|stopPropagation={() => {}}
	>
		<slot />
	</div>
</div>
