<script lang="ts">
	import '../../app.css';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="flex justify-center align-center">
	<div>
		<h1 class="font-sans font-bold text-2xl mb-6 mt-12">Log in</h1>

		{#if form?.message}
			<p class="text-red text-sm mb-6">
				{form?.message}
			</p>
		{/if}

		<form method="post" use:enhance class="mt-8 mx-auto border-4 border-blue-4 rounded-lg p-8">
			<label for="username" class="block text-sm font-lato mb-2">Username</label>
			<input
				name="username"
				id="username"
				autocomplete="username"
				autocapitalize="false"
				class="bg-blue-1 rounded-sm block max-w-80 p-2 text-lg mb-2"
				value={form?.username ?? ''}
			/>

			<label for="password" class="block text-sm font-lato mb-2 mt-6">Password</label>

			<input
				type="password"
				name="password"
				id="password"
				autocomplete="current-password"
				autocapitalize="false"
				class="bg-blue-1 rounded-sm block p-2 text-lg mb-2 max-w-80"
			/>

			<button class="text-blue-1 rounded-md px-6 py-1 m-2 ml-0 bg-blue-4 mt-6">Continue</button>

			<a href="/signup" class="text-blue-4 underline ml-4">Sign up</a>
		</form>
	</div>
</div>
