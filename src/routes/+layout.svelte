<script>
	import '../app.css';
	import Menu from '../components/Menu.svelte';
</script>

<Menu></Menu>

<div class="flex align-center justify-center p-4 pb-[170px]">
	
	<div class="w-full lg:w-[800px]">
		<slot />
	</div>
</div>
