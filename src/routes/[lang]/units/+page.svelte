<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="text-lg font-sans font-bold mt-8 mb-8">Units</h1>

{#each data.units as unit}
	<a href={'units/' + unit.id} class="text-left px-2 py-1 flex items-center">
		<div
			class="flex justify-center items-center border-[3px] border-blue-3 w-8 h-8 font-bold font-sans text-sm text-blue-3 rounded-full"
		>
			{unit.id}
		</div>
		<div class="ml-2 hover:underline">{unit.name}</div>
	</a>
{/each}
