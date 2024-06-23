<script lang="ts">
	import Dialog from '../../../components/Dialog.svelte';
	import SpinnerButton from '../../../components/SpinnerButton.svelte';
	import type { Cloze } from '../../../logic/generateCloze';

	export let clozes: Cloze[];

	let skill: string;

	export let onGenerate: (skill: string) => Promise<any>;
	export let onStore: () => Promise<any>;
	export let onCancel: () => Promise<void>;
	export let onMore: (skill: string) => Promise<void>;
</script>

<Dialog
width={800}
	on:keydown={(event) => {
		if (event.key === 'Escape') {
			onCancel;
		}
	}}
>
	<form>
		<div class="text-xs font-lato mb-6">
			Describe the grammatical issue you want to practice. We will generate fill-in-the-blanks
			exercises using AI based on your description. You will get a preview of the exercises before
			saving them, so you can refine your description.
		</div>

		<div class="mb-2">I find it difficult to</div>

		<div class="flex items-center gap-4 flex-wrap md:flex-nowrap">
			<input
				bind:value={skill}
				type="text"
				placeholder="know when to use the form xyz"
				class="bg-blue-1 rounded-sm block p-2 text-lg flex-1"
			/>

			<SpinnerButton isSubmit={true} type="primary" onClick={() => onGenerate(skill)}
				>Preview</SpinnerButton
			>
		</div>

		{#if !clozes.length}
			<div class="mt-2">
				<SpinnerButton onClick={onCancel} type="secondary">Cancel</SpinnerButton>
			</div>
		{/if}
	</form>

	{#if clozes.length}
		<form>
			<div class="mb-2 mt-4">Save these exercises?</div>

			<div class="max-h-60 overflow-auto mt-4 mb-4 border p-2">
				{#each clozes as cloze}
					<div class="flex flex-col gap-4">
						<div class="text-lg">{cloze.exercise.replace('___', `[${cloze.answer}]`)}</div>
					</div>
				{/each}
			</div>

			<div class="flex flex-wrap mt-4">
				<SpinnerButton onClick={onStore}>Save</SpinnerButton>

				<SpinnerButton onClick={() => onMore(skill)} type="secondary">Generate more</SpinnerButton>

				<SpinnerButton onClick={onCancel} type="secondary">Cancel</SpinnerButton>
			</div>
		</form>
	{/if}
</Dialog>
