<script lang="ts">
	import { onMount } from 'svelte';
	import { type Scan, getScans, deleteScan, clearScans } from '$lib/scan-db';
	import QRList, { type ListItem } from '$lib/components/QRList.svelte';

	let scans = $state<Scan[]>([]);

	let items = $derived<ListItem[]>(
		scans.map(s => ({ id: s.id, label: s.text, data: s.text, timestamp: s.timestamp }))
	);

	let listRef: { closePopup: () => void } | undefined;

	async function handleDelete(id: number) {
		await deleteScan(id);
		scans = scans.filter(s => s.id !== id);
		listRef?.closePopup();
	}

	async function handleClearAll() {
		await clearScans();
		scans = [];
	}

	onMount(async () => {
		scans = (await getScans()).reverse();
	});
</script>

<h1>Scan History</h1>

{#if scans.length > 0}
	<button class="btn danger" onclick={handleClearAll}>Clear all</button>
{/if}

<QRList bind:this={listRef} {items} emptyText="No scans yet. Go scan something!">
	{#snippet actions({ item, close })}
		<button class="btn danger" onclick={() => handleDelete(item.id)}>Remove</button>
	{/snippet}
</QRList>

<style>
	.btn.danger {
		padding: 0.4rem 0.9rem;
		background: #e74c3c;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
		margin-bottom: 1rem;
	}

	.btn.danger:hover { background: #c0392b; }
</style>
