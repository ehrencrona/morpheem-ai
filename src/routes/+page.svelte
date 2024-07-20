<script>
	import '../app.css';
	import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH, SWEDISH } from '../constants';
	import { fade } from 'svelte/transition';

	let isSelectLanguage = false;
</script>

<main class="font-lato pb-12 bg-offwhite">
	<div
		style="background: url('/flags.webp') center center; background-size: cover;"
		class="flex flex-col p-8 md:py-12 md:px-20"
	>
		<div class="p-8 max-w-[400px] md:w-[60%] bg-[#fffffff0] rounded-lg">
			<h1 class="text-5xl leading-tight font-sans font-bold mb-3">
				Are you serious about learning a language?
			</h1>
			<div class="text-lg font-sans font-bold mb-8">Morpheem can get you there.</div>
			<p class="mb-2">
				Multiple-choice exercises aren’t rich enough to learn a language; you need the ability to
				drill down into nuances of grammar, see words in different contexts and get feedback on your
				writing.
			</p>
			<p class="mb-2">
				Morpheem is an attempt to offer all this. It’s a one-man project, so you won’t get the
				slickness of Big Tech apps, but you will get better at the language you’re studying.
			</p>
			<p>Use it as your main learning tool or as a complement to classes.</p>
		</div>
	</div>

	{#if isSelectLanguage}
		<div
			class="fixed inset-0 flex justify-center items-center bg-[#ffffffd0]"
			transition:fade={{ duration: 200 }}
			on:click={() => (isSelectLanguage = false)}
		>
			<div
				class="bg-offwhite p-8 md:p-12 md:px-20 rounded-lg border-4 border-morpheem-red"
				on:click|stopPropagation={() => {}}
			>
				<p class="text-center mb-12">What language do you want to learn?</p>
				<div class="w-full my-4 grid grid-cols-3 gap-12 gap-y-12 md:gap-20 max-w-[800px] mx-auto">
					{#each [POLISH, KOREAN, SPANISH, FRENCH, DUTCH, RUSSIAN, SWEDISH] as language}
						<a href="/{language.code}">
							<img
								src="/flags/{language.name.toLowerCase()}.svg"
								class="w-20 h-20 p-1 border-[3px] border-offwhite hover:border-morpheem-red transition-colors"
								style="border-radius: 999px"
								alt={language.name}
							/>

							<div class="mt-4 text-center text-sm">
								{language.name}
							</div>
						</a>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<div class="flex flex-col gap-8 items-center justify-center">
		<div class="flex mt-10 w-[800px] max-w-[90vw]">
			{#each [POLISH, SWEDISH, KOREAN, SPANISH, FRENCH, DUTCH, RUSSIAN] as language}
				<div class="flex-1 flex justify-center">
					<a
						href="/{language.code}"
						class="p-1 border-[3px] border-offwhite hover:border-morpheem-red transition-colors"
						style="border-radius: 999px"
					>
						<img
							src="/flags/{language.name.toLowerCase()}.svg"
							class="w-12 h-12"
							alt={language.name}
						/>
					</a>
				</div>
			{/each}
		</div>
		<div class="text-sm text-center text-balance">
			Currently available in Polish, Swedish, Korean, Spanish, French, Dutch and Russian.
			<div class="mt-2">Languages can be added on request.</div>
		</div>
	</div>

	<div class="flex items-center justify-center mt-12">
		<button
			class="bg-morpheem-red text-white border-[3px] font-sans font-medium text-xl py-4 px-12 text-center rounded-lg hover:bg-morpheem-darkred transition-colors"
			on:click={() => (isSelectLanguage = true)}
		>
			Start learning
		</button>
	</div>

	<p class="text-center text-sm mt-4 mb-12">Morpheem is completely free.</p>

	<div class="mt-12 px-8 md:px-0">
		<div class="flex mt-8 mx-auto max-w-[1000px] items-stretch flex-col md:flex-row gap-8 md:gap-0">
			<div class="p-2 flex flex-1 justify-start">
				<div class="max-w-[400px] text-balance border-l-4 border-morpheem-red pl-4">
					<h3 class="font-sans text-lg font-bold mb-2">The right exercise at the right time</h3>

					<p class="mb-2">
						Morpheem tracks your language skills. If you make a mistake, it remembers it. If you
						click a word to get a translation, it tracks that you didn’t know the word.
					</p>
					<p class="mb-2">
						Any gaps in your knowledge are turned into new exercises. If you use the wrong word in a
						writing exercise, you will get a fill-in-the-blanks exercise for that word later. If you
						choose the wrong article, you will get an exercise to choose the right article.
					</p>
					<p class="mb-2">
						You will get reading exercises with carefully chosen words that refresh and expand your
						vocabulary.
					</p>
				</div>
			</div>
			<div class="p-4 flex flex-1 justify-end">
				<div
					class="max-w-[400px] text-balance border-r-4 md:border-r-0 md:border-l-4 border-morpheem-red pl-4"
				>
					<h3 class="font-sans text-lg font-bold mb-2">Engaging with the language</h3>

					<p class="mb-2">
						It’s not about collecting points. You learn by making mistakes. Treat mistakes as a
						learning experience.
					</p>

					<p class="mb-2">
						Drill into them by using the “ask my anything” feature to explain. If you find a skill
						you want to work on more, you can generate more exercises. Engage with vocabulary by
						creating mnemonics.
					</p>
					<p class="mb-2">
						All of this is hard work, but that is precisely what is required to learn a new skill.
					</p>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-8 mx-auto w-[600px] max-w-[90vw] border-4 border-morpheem-red rounded-lg p-4">
		<h3 class="font-sans text-lg font-bold mb-2">A non-commercial project</h3>

		<p class="mb-2">
			Morpheem is a one-man project with no commercial ambitions. I created it because I could not
			find any existing tool that could teach me Polish.
		</p>

		<p class="mb-2">
			It currently has a very small user group that is giving active feedback and helping steer
			development. Your feedback is crucial; do reach out and let me know what works for you and
			what doesn’t.
		</p>
	</div>

	<div class="flex justify-center mt-12">
		<img src="/morpheem-logo-square.png" class="w-12 h-12" alt="Logo" />
	</div>
</main>
