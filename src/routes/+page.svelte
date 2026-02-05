<script lang="ts">
	import { actionsStore, pageStore } from '$lib/actions-store.svelte';
	import ActionGrid from '$lib/components/ActionGrid.svelte';

	let columns = $state(4);
</script>

<h1>{pageStore.title}</h1>
<p>{pageStore.description}</p>

<div class="grid-header">
	<span class="grid-label">Quick Actions</span>
</div>

<ActionGrid items={actionsStore.items} {columns} />

<style>
	.grid-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.grid-label {
		font-weight: 600;
		font-size: 1rem;
	}
</style>
