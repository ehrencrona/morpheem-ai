<script lang="ts">
	import { onMount } from 'svelte';
	import type { Sentence } from '../db/types';
	import Dialog from './Dialog.svelte';
	import SpinnerButton from './SpinnerButton.svelte';
	import { sendReport } from '../routes/[lang]/api/reports/client';

	export let sentence: Sentence;
	export let exercise: any;

	let description: string;
	let email: string;

	// persist e-mail in localstorage

	onMount(() => {
		email = localStorage.getItem('email') || '';
	});

	export let onCancel: () => Promise<void>;

	async function onSubmit() {
		if (email) {
			localStorage.setItem('email', email);
		}

		await sendReport({
			sentenceId: sentence.id,
			exercise: exercise,
			report: description,
			email
		});

		onCancel();
	}
</script>

<Dialog {onCancel}>
	<div class="p-2 md:p-8 text-sm">
		<h3 class="text-lg font-bold font-sans mb-4">Report a content error</h3>

		<p class="mb-2">
			Briefly describe what is wrong with the sentence "{sentence.sentence}" or the current
			exercise.
		</p>

		<p class="mb-4">Your email is used if we need to contact you with follow-up questions.</p>

		<label class="mb-4 block">
			<div class="mt-2 mb-1 font-bold">Describe the problem</div>

			<textarea class="w-full h-32 bg-blue-1 text-lg p-2" bind:value={description}></textarea>
		</label>

		<label class="block">
			<div class="mt-2 mb-1"><span class="font-bold">Your e-mail</span> (optional)</div>

			<input class="w-full bg-blue-1 text-lg p-2" bind:value={email} type="email" />
		</label>

		<div class="mt-6 flex justify-end gap-4">
			<SpinnerButton onClick={onSubmit} isSubmit={true}>Submit</SpinnerButton>

			<SpinnerButton onClick={onCancel} type="secondary">Cancel</SpinnerButton>
		</div>
	</div>
</Dialog>
