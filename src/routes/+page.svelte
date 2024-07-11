<script lang="ts">
	import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH } from '../constants';
</script>

<img src="/morpheem-logo-square.png" class="w-16 mx-auto mt-8" alt="Morpheem" />

<p class="text-center text-sm mt-8 font-lato">What language do you want to learn?</p>

<div class="w-full my-4 grid grid-cols-2 gap-12 max-w-[400px] mx-auto">
	{#each [DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH] as language}
		<a
			href={`/${language.code}/`}
			class="bg-blue-1 py-4 px-8 text-center rounded"
			style="box-shadow: 0 0 2px -1px rgba(0, 0, 0, 0.1);"
		>
			{language.name}
		</a>
	{/each}
</div>

<span class="text-sm font-lato block mt-12 max-w-[600px] mx-auto">
	<p class="my-4">
		The most effective form of teaching is one-on-one tutoring. Traditional language learning apps
		can’t replicate this experience. However, with the advent of Large Language Models (LLMs), this
		can change.
	</p>
	<p class="my-4">
		Morpheem is an experiment in applying LLMs to language learning. It offers endless example
		sentences, open-ended writing exercises, and personalized feedback.
	</p>
	<p class="my-4">
		Morpheem is a lean-forward experience, not for killing time on the subway. It is very much a
		work in progress, but for serious learners, it can already be a uniquely useful tool in their
		learning journey.
	</p>
	<p class="my-4">
		This is a non-commercial project. There is no cost associated with it, and your feedback is
		crucial for future development. Welcome!
	</p>
	<p class="my-4 text-right">
		<a
			href="https://www.linkedin.com/in/andreas-ehrencrona-a242717/"
			class="underline text-xs font-lato"
		>
			About the developer
		</a>
	</p>
</span>
