<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { languages } from '../constants';
	import Hamburger from './Hamburger.svelte';

	$: topPath = $page.url.pathname.split('/')[1];
	$: language = languages.find((lang) => lang.code == topPath);
	$: baseUrl = '/' + (language ? language.code : '');

	const pages = [
		{
			name: 'Study',
			href: ''
		},
		{
			name: 'Reader',
			href: '/reader'
		},
		{
			name: 'Writer',
			href: '/writer'
		},
		{
			name: 'Progress',
			href: '/progress'
		},
		{
			name: 'History',
			href: '/history'
		},
		{
			name: 'Placement test',
			href: '/test'
		},
		{
			name: 'Add exercises',
			href: '/add-exercises'
		},
		{
			name: 'Settings',
			href: '/settings'
		},
		{
			name: 'Community',
			href: '/community'
		}
	];

	$: url = $page.url;

	$: links = pages.map((link) => {
		return {
			...link,
			href: `${baseUrl}${link.href}`,
			active: url.pathname == `${baseUrl}${link.href}`
		};
	});

	let isMobileOpen = false;
</script>

{#if language}
	<button type="button" class="p-4 absolute lg:hidden z-10" on:click={() => (isMobileOpen = true)}>
		<Hamburger />
	</button>

	{#if isMobileOpen}
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div
			class="fixed inset-0 z-40"
			style="background-color: rgba(0,0,0,0.2)"
			on:click={() => (isMobileOpen = false)}
			transition:fade={{ duration: 200 }}
			on:keydown={(e) => e.key == 'Escape' && (isMobileOpen = false)}
			role="dialog"
		>
			<div class="h-full w-[200px] bg-white flex flex-col flex-wrap">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="flex-1 pt-8" on:click|stopPropagation={() => {}}>
					<ul>
						{#each links as link}
							<li class="px-2 mb-2 text-sm">
								<a
									href={link.href}
									class={`block p-1 px-3 ${link.active ? 'bg-light-gray font-bold rounded-lg' : ''}`}
									>{link.name}</a
								>
							</li>
						{/each}
					</ul>
				</div>
				<div class="p-4">
					<div class="flex flex-wrap gap-2">
						{#each languages as language}
							<a href={`/${language.code}`} class="text-xs p-[3px] rounded bg-gray-1 text-white">
								{language.code.toUpperCase()}
							</a>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<nav class="hidden lg:block w-[200px]">
		<ul class="mt-6 xl:ml-4">
			{#each links as link}
				<li class="px-2 mb-2 text-base">
					<a
						href={link.href}
						class={`block p-1 px-3 leading-snug ${link.active ? 'bg-light-gray font-sans font-bold rounded-lg' : 'text-gray-1'}`}
						>{link.name}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
