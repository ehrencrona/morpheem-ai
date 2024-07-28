<script lang="ts">
	import { onMount } from 'svelte';
	import Dialog from './Dialog.svelte';
	import SpinnerButton from './SpinnerButton.svelte';
	import { fetchUnits } from '../routes/[lang]/api/units/client';
	import type { Units } from '../routes/[lang]/api/units/client';
	import { logError } from '$lib/logError';

	export let unit: number | null;

	export let onCancel: () => void;
	export let save: (unit: number | null) => Promise<void>;

	let units: Units = [];

	onMount(async () => {
		console.log('on mount');

		units = await fetchUnits().catch((e) => {
			logError(e);

			return [];
		});
	});

	let editedNumber = unit;
</script>

<Dialog {onCancel}>
	<form class="p-8">
		<p class="text-sm mb-2">Unit:</p>

		<select bind:value={editedNumber} class="bg-blue-1 rounded-sm block p-2 text-lg mb-6">
			<option value={null} selected={unit == null}>None</option>
			{#each units as u}
				<option value={u.id} selected={u.id == unit}>{u.id}. {u.name}</option>
			{/each}
		</select>

		<SpinnerButton onClick={() => save(editedNumber)} isSubmit={true}>Save</SpinnerButton>
		<SpinnerButton onClick={async () => onCancel()} type="secondary">Cancel</SpinnerButton>
	</form>
</Dialog>
