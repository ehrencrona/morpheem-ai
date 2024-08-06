<script>
	import '../../app.css';
	import Menu from '../../components/Menu.svelte';
	import { page } from '$app/stores';

	$: isWide = $page.url.pathname.includes('/reader/url') || $page.url.pathname.includes('/history');
</script>

<div class="flex font-lato">
	<Menu></Menu>

	<div class="flex flex-1 align-center justify-center pb-[170px] max-w-[100vw] mt-12 lg:mt-0">
		<div class="{isWide ? `` : `w-full lg:w-[800px] p-4`}">
			<slot />
		</div>
	</div>
</div>
