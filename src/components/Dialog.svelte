<script lang="ts">
	export let width = 600;

	export let onCancel: () => any;
</script>

<div
	class="fixed inset-0 bg-[#000] bg-opacity-80 flex items-center justify-center z-20 pb-[100px]"
	on:click={onCancel}
>
	<div
		class="bg-[#fff] px-3 md:px-6 py-6 pb-4 rounded-lg max-w-[94vw]"
		style="box-shadow: 0 0 8px -1px rgba(0, 0, 0, 0.1); width: {width}px"
		on:click|stopPropagation={() => {}}
	>
		<slot />
	</div>
</div>
