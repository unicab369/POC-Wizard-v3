<script lang="ts">
	import { menuStore } from '$lib/actions-store.svelte';

	let columns = $state(1);

	const categories = $derived(
		[...new Set(menuStore.items.map(i => i.category))]
	);
</script>

<div class="page-header">
	<h1>Menu</h1>
	<div class="view-toggle">
		<button
			class="toggle-btn"
			class:active={columns === 1}
			onclick={() => (columns = 1)}
			aria-label="List view"
		>
			<svg viewBox="0 0 24 24"><path d="M3 4h18M3 12h18M3 20h18" /></svg>
		</button>
		<button
			class="toggle-btn"
			class:active={columns === 2}
			onclick={() => (columns = 2)}
			aria-label="Grid view"
		>
			<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
		</button>
	</div>
</div>

{#each categories as category}
	<h2 class="category-title">{category}</h2>
	<div class="menu-grid" class:two-col={columns === 2}>
		{#each menuStore.items.filter(i => i.category === category) as item (item.id)}
			<div class="menu-card">
				<div class="card-info">
					<span class="card-name">{item.name}</span>
					<span class="card-desc">{item.description}</span>
				</div>
				<span class="card-price">${item.price}</span>
			</div>
		{/each}
	</div>
{/each}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 20px;
	}

	.page-header h1 {
		margin: 0;
	}

	.view-toggle {
		display: flex;
		background: #f0f0f0;
		border-radius: 8px;
		padding: 3px;
		gap: 2px;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: none;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: #999;
		transition: background 0.15s, color 0.15s;
	}

	.toggle-btn.active {
		background: #fff;
		color: #6c63ff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.toggle-btn:hover:not(.active) {
		color: #666;
	}

	.toggle-btn svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.category-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 1.25rem 0 0.5rem;
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
	}

	.menu-card:hover {
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
</style>
