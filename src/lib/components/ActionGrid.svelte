<script lang="ts">
	import type { QuickAction } from '$lib/actions-store.svelte';

	interface Props {
		items: QuickAction[];
		columns?: number;
		onselect?: (action: QuickAction) => void;
	}

	let { items, columns = 4, onselect }: Props = $props();
</script>

<div class="grid" style="grid-template-columns: repeat({columns}, 1fr);">
	{#each items as action (action.id)}
		{#if onselect}
			<button class="tile" onclick={() => onselect(action)}>
				<svg viewBox="0 0 24 24">{@html action.icon}</svg>
				<span>{action.label}</span>
			</button>
		{:else if action.href}
			<a class="tile" href={action.href}>
				<svg viewBox="0 0 24 24">{@html action.icon}</svg>
				<span>{action.label}</span>
			</a>
		{:else}
			<button class="tile" onclick={() => {}}>
				<svg viewBox="0 0 24 24">{@html action.icon}</svg>
				<span>{action.label}</span>
			</button>
		{/if}
	{/each}
</div>

<style>
	.grid {
		display: grid;
		gap: 0.75rem;
		max-width: 500px;
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem 0.5rem;
		background: #f9f9fb;
		border: 1px solid #e0e0e0;
		border-radius: 10px;
		cursor: pointer;
		font-size: 0.85rem;
		color: #555;
		transition: background 0.15s, border-color 0.15s;
	}

	a.tile { text-decoration: none; }
	.tile:hover { background: #f0eeff; border-color: #6c63ff; color: #6c63ff; }
	.tile:active { background: #e8e5ff; }
	.tile svg { width: 1.75rem; height: 1.75rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
