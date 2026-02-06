<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { branchStore } from '$lib/actions-store.svelte';

	onMount(() => {
		goto(`/${branchStore.id}`, { replaceState: true });
	});
</script>

<p>Redirecting...</p>
