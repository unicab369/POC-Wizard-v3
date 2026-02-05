<script lang="ts">
	import { actionsStore, pageStore, hoursStore } from '$lib/actions-store.svelte';
	import ActionGrid from '$lib/components/ActionGrid.svelte';
	import BusinessHours from '$lib/components/BusinessHours.svelte';

	let columns = $state(4);
</script>

<h1>{pageStore.title}</h1>
<p>{pageStore.description}</p>

<div class="section-header">
	<span class="section-label">Quick Actions</span>
</div>

<ActionGrid items={actionsStore.items} {columns} />

<div class="section-header">
	<span class="section-label">Business Hours</span>
</div>

<BusinessHours items={hoursStore.items} />

<style>
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.section-label {
		font-weight: 600;
		font-size: 1rem;
	}

</style>
