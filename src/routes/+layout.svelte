<script>
	import '../app.css';
	import Menu from '../components/Menu.svelte';
	import { page } from '$app/stores';

	$: isWide = $page.url.pathname.includes('/reader') || $page.url.pathname.includes('/history');
</script>

<Menu></Menu>

<div class="flex align-center justify-center p-4 pb-[170px]">
	<div class="w-full {isWide ? `lg:w-[900px]` : `lg:w-[800px]`}">
		<slot />
	</div>
</div>
