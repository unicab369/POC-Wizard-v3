<script lang="ts">
	import { branchStore } from '$lib/actions-store.svelte';

	let { data, children } = $props();

	// Set the branch ID when this layout loads
	$effect(() => {
		if (data.branchId && data.branchId !== branchStore.id) {
			branchStore.id = data.branchId;
		}
	});
</script>

{@render children()}
