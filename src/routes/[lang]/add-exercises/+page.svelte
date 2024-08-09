<script lang="ts">
	import { sendKnowledge } from '../api/knowledge/client';
	import type { PageData } from './$types';
	import AddExercises from './AddExercises.svelte';

	export let data: PageData;
</script>

<AddExercises {sendKnowledge} translateExercises={data.translateExercises} />
