<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<p class="my-8">
	Congratulations, you know <b>{data.vocabularySize}</b> words.
</p>

<a href={`/${data.languageCode}/`} class="text-blue-1 rounded-md px-6 py-1 m-2 ml-0 bg-blue-4">
	Start studying
</a>
