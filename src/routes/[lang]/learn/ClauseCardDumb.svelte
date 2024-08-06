<script lang="ts">
	import CloseSvg from '../../../components/CloseSvg.svelte';
	import type { Clause } from '../../../db/types';

	export let clause: Clause;
	export let onRemove: (() => void) | undefined = undefined;
</script>

<div class="bg-light-gray rounded-md w-full border border-gray md:max-w-[500px] mb-4">
	<div class="font-medium mb-1 flex bg-blue-3 text-[#fff] px-3 py-2 rounded-t-md items-baseline">
		<div class="flex-1">
			{clause.sentence}
		</div>
		<button
			type="button"
			on:click={onRemove}
			class="flex justify-center items-center p-[4px] mr-[-6px] ml-1"
		>
			<CloseSvg />
		</button>
	</div>

	<div class="px-3 pb-4">
		<div class="text-balance font-lato mt-2">
			{clause.english}
		</div>
	</div>
</div>
