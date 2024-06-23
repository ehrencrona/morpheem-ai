<script lang="ts">
	export let width = 600
</script>

<div class="fixed inset-0 bg-[#000] bg-opacity-80 flex items-center justify-center z-20 pb-[100px]">
	<div
		class="bg-[#fff] p-6 py-6 pb-4 rounded-lg max-w-[90vw]"
		style="box-shadow: 0 0 8px -1px rgba(0, 0, 0, 0.1); width: {width}px"
	>
		<slot />
	</div>
</div>
