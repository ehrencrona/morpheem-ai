<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<div class="flex justify-center align-center">
	<div>
		<h1 class="font-bold text-3xl mb-6 mt-12">Log in</h1>

		<form method="post" use:enhance>
			<label for="username" class="block text-sm font-lato mb-2">Username</label>
			<input
				name="username"
				id="username"
				class="bg-blue-1 rounded-sm block w-80 p-2 text-lg mb-2"
			/>

			<label for="password" class="block text-sm font-lato mb-2">Password</label>

			<input
				type="password"
				name="password"
				id="password"
				class="bg-blue-1 rounded-sm block p-2 text-lg mb-2 w-80"
			/>

			<button class="text-blue-1 rounded-md px-6 py-1 m-2 ml-0 bg-blue-4 mt-6">Continue</button>
		</form>
	</div>
</div>
