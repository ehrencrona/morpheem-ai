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
			name: 'Progress',
			href: '/progress'
		},
		{
			name: 'History',
			href: '/history'
		},
		{
			name: 'Settings',
			href: '/settings'
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
	<button type="button" class="p-4 absolute lg:hidden" on:click={() => (isMobileOpen = true)}>
		<Hamburger />
	</button>

	{#if isMobileOpen}
		<div
			class="fixed inset-0 z-40"
			style="background-color: rgba(0,0,0,0.2)"
			on:click={() => (isMobileOpen = false)}
			transition:fade={{ duration: 200 }}
		>
			<div class="h-full w-[200px] bg-white flex flex-col flex-wrap">
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
					<a href="mailto:andreas.ehrencrona@velik.it" class="block mb-4 text-sm underline text-xs">
						Contact
					</a>

					<div class="flex gap-2">
						{#each languages as language}
							<a
								href={`/${language.code}`}
								class="text-sm text-xs p-[3px] rounded bg-gray-1 text-white"
							>
								{language.code.toUpperCase()}
							</a>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<nav class="absolute hidden lg:block w-[100px] xl:w-[180px]">
		<ul class="mt-8 xl:ml-4">
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
	</nav>
{/if}
