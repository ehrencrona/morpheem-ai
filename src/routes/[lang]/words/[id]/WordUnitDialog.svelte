<script lang="ts">
	import Dialog from '../../../../components/Dialog.svelte';
	import SpinnerButton from '../../../../components/SpinnerButton.svelte';

	export let unit: number | null;

	export let onCancel: () => void;
	export let save: (unit: number | null) => Promise<void>;

	let editedNumber = (unit || '') + '';
</script>

<Dialog {onCancel}>
	<form class="p-8">
    <p class="text-sm mb-2">Unit:</p>

		<input
			type="text"
			bind:value={editedNumber}
      maxlength="2"
			class="bg-blue-1 rounded-sm block p-2 text-lg mb-6 w-10"
		/>

		<SpinnerButton onClick={() => save(parseInt(editedNumber) || null)} isSubmit={true}>Save</SpinnerButton>
    <SpinnerButton onClick={async () => onCancel()} type="secondary">Cancel</SpinnerButton>
	</form>
</Dialog>
