<script lang="ts">
	import { formatCurrency, type MenuItem } from '$lib/actions-store.svelte';

	interface Props {
		items: MenuItem[];
		columns?: number;
		onItemTap?: (item: MenuItem) => void;
		getQty?: (itemId: number) => number;
	}

	let { items, columns = 2, onItemTap, getQty }: Props = $props();

	const categories = $derived.by(() => {
		const cats = new Set<string>();
		for (const item of items) cats.add(item.category);
		return [...cats];
	});

	const isInteractive = $derived(!!onItemTap);
</script>

{#each categories as category}
	<h2 class="category-title">{category}</h2>
	<div class="menu-grid" class:two-col={columns === 2}>
		{#each items.filter(i => i.category === category) as item (item.id)}
			{#if isInteractive}
				<button class="menu-card" class:grid-card={columns === 2} onclick={() => onItemTap?.(item)}>
					{#if getQty && getQty(item.id) > 0}
						<span class="card-qty">{getQty(item.id)}</span>
					{/if}
					<div class="card-info">
						<span class="card-name">{item.name}</span>
						<span class="card-desc">{item.description}</span>
					</div>
					<span class="card-price">{formatCurrency(item.price)}</span>
				</button>
			{:else}
				<div class="menu-card" class:grid-card={columns === 2}>
					<div class="card-info">
						<span class="card-name">{item.name}</span>
						<span class="card-desc">{item.description}</span>
					</div>
					<span class="card-price">{formatCurrency(item.price)}</span>
				</div>
			{/if}
		{/each}
	</div>
{/each}

<style>
	.category-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 1.25rem 0 0.5rem;
	}

	.category-title:first-of-type {
		margin-top: 0;
	}

	.menu-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
	}

	.menu-grid.two-col {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	}

	.menu-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.65rem 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 10px;
		transition: border-color 0.15s, box-shadow 0.15s;
		min-width: 0;
		width: 100%;
		font-family: inherit;
		font-size: inherit;
		text-align: left;
		position: relative;
	}

	button.menu-card {
		cursor: pointer;
	}

	button.menu-card:hover {
		border-color: #d0d0d0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.card-name {
		font-weight: 600;
		font-size: 0.95rem;
		color: #222;
	}

	.card-desc {
		font-size: 0.8rem;
		color: #888;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-price {
		font-weight: 700;
		font-size: 0.95rem;
		color: #6c63ff;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.card-qty {
		position: absolute;
		top: -0.35rem;
		left: -0.35rem;
		background: #6c63ff;
		color: #fff;
		font-size: 0.65rem;
		font-weight: 700;
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.menu-card.grid-card {
		flex-direction: column;
		align-items: flex-start;
		padding: 0.75rem;
	}

	.menu-card.grid-card .card-desc {
		white-space: normal;
	}

	.menu-card.grid-card .card-price {
		align-self: flex-end;
	}
</style>
