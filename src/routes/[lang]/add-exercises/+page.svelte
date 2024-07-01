<script>
	import { sendKnowledge } from '../api/knowledge/client';
	import AddExercises from '../learn/AddExercises.svelte';
</script>

<AddExercises {sendKnowledge} />
