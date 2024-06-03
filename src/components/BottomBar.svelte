<script lang="ts">
  export let isFullScreen = false;
</script>

<div
	class="fixed bottom-0 left-0 right-0 bg-[#ffffff] px-4 py-2 flex justify-center center z-30 {isFullScreen
		? 'top-0'
		: ''}"
	style="box-shadow: 0 -2px 4px -1px rgba(0, 0, 0, 0.1); transition: top 0.3s;"
>
	<div class="w-full max-w-[800px]">
		<slot></slot>
	</div>
</div>
