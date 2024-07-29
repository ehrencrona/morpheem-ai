<script lang="ts">
	import '../../app.css';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="flex justify-center align-center p-4">
	<div>
		<h1 class="font-sans font-bold text-2xl mb-6 mt-12">Sign up</h1>

		<p class="text-sm mb-6 text-balance">
			Just choose a username and password and you'll immediately be up and running.
		</p>

		<p class="text-sm mb-6 text-balance">
			No verification required. No e-mail, no phone number, no spam.
		</p>

		<p class="text-sm mb-6 text-balance">Morpheem is completely free.</p>

		{#if form?.message}
			<p class="text-red text-sm mb-6">
				{form?.message}
			</p>
		{/if}

		<form
			method="post"
			use:enhance
			class="mt-4 mx-auto border-4 border-blue-4 rounded-lg p-8 inline-block"
		>
			<label for="username" class="block text-sm font-lato mb-2">Choose a username:</label>
			<input
				name="username"
				id="username"
				autocomplete="username"
				autocapitalize="false"
				class="bg-blue-1 rounded-sm block max-w-80 p-2 text-lg mb-2"
			/>

			<label for="password" class="block text-sm font-lato mb-2">Choose a password:</label>

			<input
				type="password"
				name="password"
				id="password"
				autocomplete="new-password"
				autocapitalize="false"
				class="bg-blue-1 rounded-sm block p-2 text-lg mb-2 max-w-80"
			/>

			<button class="text-blue-1 rounded-md px-6 py-1 m-2 ml-0 bg-blue-4 mt-6">Sign up</button>

			<a href="/login" class="text-blue-4 underline ml-4">Log in</a>
		</form>
	</div>
</div>
