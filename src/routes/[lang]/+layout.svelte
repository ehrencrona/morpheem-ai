<script>
	import '../../app.css';
	import Menu from '../../components/Menu.svelte';
	import { page } from '$app/stores';

	$: isWide = $page.url.pathname.includes('/reader/url') || $page.url.pathname.includes('/history');
</script>

<div class="flex font-lato">
	<Menu></Menu>

	<div class="flex flex-1 align-center justify-center p-4 pb-[170px]">
		<div class="{isWide ? `` : `w-full lg:w-[800px] max-w-[100vw] lg:max-w-[95vw]`}">
			<slot />
		</div>
	</div>
</div>
