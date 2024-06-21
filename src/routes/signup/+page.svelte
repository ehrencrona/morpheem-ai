<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="flex justify-center align-center">
	<div>
		<h1 class="font-bold text-3xl mb-6 mt-12">Sign up</h1>

		{#if form?.message}
			<p class="text-red text-sm mb-6">
				{form?.message}
			</p>
		{/if}

		<form method="post" use:enhance>
			<label for="username" class="block text-sm font-lato mb-2">Username</label>
			<input
				name="username"
				id="username"
				autocomplete="username"
				class="bg-blue-1 rounded-sm block w-80 p-2 text-lg mb-2"
			/>

			<label for="password" class="block text-sm font-lato mb-2">Password</label>

			<input
				type="password"
				name="password"
				id="password"
				autocomplete="new-password"
				class="bg-blue-1 rounded-sm block p-2 text-lg mb-2 w-80"
			/>

			<button class="text-blue-1 rounded-md px-6 py-1 m-2 ml-0 bg-blue-4 mt-6">Continue</button>

			<a href="/login" class="text-blue-4 underline ml-4">Log in</a>
		</form>
	</div>
</div>
