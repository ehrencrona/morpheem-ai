<script lang="ts">
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import Dialog from '../../../components/Dialog.svelte';

	export let onSave: (mnemonic: string) => Promise<any>;
	export let onCancel: () => Promise<any>;

	export let mnemonic = '';
	export let wordString: string;
	export let english: string | undefined;

	export let generate: () => Promise<string>;
</script>

<Dialog {onCancel}>
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<form
		on:keydown={(event) => {
			if (event.key === 'Enter' && !event.shiftKey) {
				onSave(mnemonic);
			}
		}}
	>
		<p class="mb-4">
			Write a mnemonic to help you remember
			{#if english}
				that <b>{wordString}</b> means "{english}":
			{:else}
				<b>{wordString}</b>
			{/if}
		</p>

		<textarea
			bind:value={mnemonic}
			class="bg-blue-1 rounded-sm block w-full p-2 text-lg mb-4"
			lang="pl"
			rows="5"
		/>

		<SpinnerButton onClick={() => onSave(mnemonic)}>Save</SpinnerButton>

		<SpinnerButton onClick={async () => (mnemonic = await generate())} type="secondary"
			>Suggest</SpinnerButton
		>

		<SpinnerButton onClick={onCancel} type="secondary">Cancel</SpinnerButton>
	</form>
</Dialog>
