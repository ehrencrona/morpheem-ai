<script lang="ts">
	import { onMount } from 'svelte';

	export let url: string;
	export let isPreload = false;

	let audioPlayer: HTMLAudioElement;
	let autoplay: boolean = false;

	let lastUrl: string;

	// Initialize autoplay flag from local storage
	onMount(() => {
		const storedAutoplay = localStorage.getItem('autoplay');
		autoplay = storedAutoplay === 'true';

		onUrlChange();
	});

	$: if (url && !isPreload) {
		onUrlChange();
	}

	function onUrlChange() {
		if (autoplay && !isPreload) {
			play();
		}
	}

	// Function to replay the audio
	function play() {
		if (url == lastUrl) {
			audioPlayer.currentTime = 0;
			audioPlayer.play();
		} else {
			audioPlayer.src = url;
			audioPlayer.load();
			lastUrl = url;
		}
	}

	// Function to toggle autoplay setting
	function toggleAutoplay() {
		autoplay = !autoplay;

		localStorage.setItem('autoplay', String(autoplay));
	}
</script>

<audio bind:this={audioPlayer} autoplay></audio>

{#if !isPreload}
	<div class="flex gap-4 mt-8">
		<button class="text-xs font-lato rounded-full" on:click={play}>
			<img src="/icons/play.svg" class="w-8 h-8" alt="Play" />
		</button>
		<button class="text-xs font-lato rounded-full" on:click={toggleAutoplay}>
			{#if autoplay}
				<img src="/icons/sound.svg" class="w-8 h-8" alt="Mute" />
			{:else}
				<img src="/icons/mute.svg" class="w-8 h-8" alt="Unmute" />
			{/if}
		</button>
	</div>
{/if}
