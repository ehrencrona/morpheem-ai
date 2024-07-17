<script lang="ts">
	import Dialog from './Dialog.svelte';
	import SpinnerButton from './SpinnerButton.svelte';

	export let selectedUnit: number | null;
	export let units: { id: number; name: string | null }[];

	export let onCancel: () => void;
	export let onSet: (unit: number | null) => Promise<void>;
</script>

<Dialog {onCancel}>
	<form class="p-4">
		<h3 class="font-sans font-bold mb-4 text-lg">Choose Level</h3>

		<p class="mb-4">
			Choose the level of grammar you want to be exposed to. If you are already familiar with most
			of the grammar; choose "Clear level".
		</p>

		<div class="flex flex-col gap-1 overflow-auto max-h-[50vh]">
			{#each units as unit}
				<button
					class="text-left px-2 py-1 flex items-center"
					on:click={() => (selectedUnit = unit.id)}
				>
					<div
						class="flex justify-center items-center border-[3px] border-blue-3 w-8 h-8 font-bold font-sans text-sm text-blue-3 rounded-full {selectedUnit ==
						unit.id
							? 'bg-blue-3 text-white'
							: ''}"
					>
						{unit.id}
					</div>
					<div class="ml-2 {selectedUnit == unit.id ? 'font-bold' : ''}">{unit.name}</div>
				</button>
			{/each}
		</div>

		<div class="flex mt-4 gap-2 justify-end">
			<SpinnerButton onClick={() => onSet(null)} type="secondary">Clear level</SpinnerButton>
			<SpinnerButton onClick={() => onSet(selectedUnit)} isSubmit={true}>Save</SpinnerButton>
		</div>
	</form>
</Dialog>
