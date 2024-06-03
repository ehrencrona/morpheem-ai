<script lang="ts">
	import SpinnerButton from '../../../components/SpinnerButton.svelte';

	export let onSave: (mnemonic: string) => Promise<any>;
	export let onCancel: () => Promise<any>;

	export let mnemonic = '';
	export let wordString: string;
	export let english: string | undefined;

	export let generate: () => Promise<string>;

	let form: HTMLFormElement;
</script>

<div class="fixed inset-0 bg-[#000] bg-opacity-80 flex md:items-center justify-center z-20">
	<form
		class="bg-[#fff] p-6 py-6 pb-4 md:rounded-lg max-w-full w-full md:w-[500px]"
		style="box-shadow: 0 0 8px -1px rgba(0, 0, 0, 0.1);"
		bind:this={form}
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
</div>
