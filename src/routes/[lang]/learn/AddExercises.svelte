<script lang="ts">
	import { sendClozes, sendGenerateCloze } from '../api/cloze/create/client';
	import AddExercisesDumb from './AddExercisesDumb.svelte';

	const noOfExercises = 6;

	export let onCancel: () => Promise<any>;

	let clozes: import('../../../logic/generateCloze').Cloze[] = [];

	const onGenerate = async (skill: string) => {
		clozes = await sendGenerateCloze({ skill, noOfExercises });
	};

	const onMore = async (skill: string) => {
		clozes = await sendGenerateCloze({ skill, noOfExercises: clozes.length + noOfExercises });
	};

	const onStore = async () => {
		await sendClozes(clozes);

		await onCancel();
	};
</script>

<AddExercisesDumb {clozes} {onGenerate} {onStore} {onCancel} {onMore} />
