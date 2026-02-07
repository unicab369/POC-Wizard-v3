<script lang="ts">
	import MenuItemsGrid from './MenuItemsGrid.svelte';
	import type { Menu, MenuItem } from '$lib/actions-store.svelte';

	interface Props {
		menus: Menu[];
		onItemTap?: (item: MenuItem) => void;
		getQty?: (itemId: number) => number;
		title?: string;
		showTitle?: boolean;
		showListButton?: boolean;
		showGridButton?: boolean;
		stickyHeader?: boolean;
	}

	let {
		menus,
		onItemTap,
		getQty,
		title,
		showTitle = true,
		showListButton = true,
		showGridButton = true,
		stickyHeader = false
	}: Props = $props();

	// Menu selection
	let selectedMenuId = $state<number | null>(null);
	let columns = $state(2);

	const hasMultipleMenus = $derived(menus.length > 1);

	const activeMenu = $derived.by(() => {
		if (menus.length === 0) return null;
		if (selectedMenuId !== null) {
			const found = menus.find(m => m.id === selectedMenuId);
			if (found) return found;
		}
		return menus[0];
	});

	const displayItems = $derived(activeMenu?.items ?? []);

	// Title logic: use provided title, or menu name for single menu, or "Menu" for multiple
	const displayTitle = $derived(title ?? (hasMultipleMenus ? 'Menu' : (activeMenu?.name ?? 'Menu')));

	const showToggle = $derived(showListButton || showGridButton);
</script>

{#if showTitle || showToggle}
	<div class="menu-header" class:sticky={stickyHeader} class:toggle-only={!showTitle && showToggle}>
		{#if showTitle}
			<h1 class="menu-title">{displayTitle}</h1>
		{/if}
		{#if showToggle}
			<div class="view-toggle">
				{#if showListButton}
					<button
						class="toggle-btn"
						class:active={columns === 1}
						onclick={() => (columns = 1)}
						aria-label="List view"
					>
						<svg viewBox="0 0 24 24"><path d="M3 4h18M3 12h18M3 20h18" /></svg>
					</button>
				{/if}
				{#if showGridButton}
					<button
						class="toggle-btn"
						class:active={columns === 2}
						onclick={() => (columns = 2)}
						aria-label="Grid view"
					>
						<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
					</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#if hasMultipleMenus}
	<div class="menu-tabs">
		{#each menus as menu (menu.id)}
			<button
				class="menu-tab"
				class:active={activeMenu?.id === menu.id}
				onclick={() => (selectedMenuId = menu.id)}
			>
				{menu.name}
			</button>
		{/each}
	</div>
{/if}

<MenuItemsGrid items={displayItems} {columns} {onItemTap} {getQty} />

<style>
	.menu-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.menu-header.toggle-only {
		justify-content: flex-end;
	}

	.menu-header.sticky {
		position: sticky;
		top: 0;
		background: #f5f5f5;
		z-index: 10;
		padding: 1.25rem 0 0.5rem;
		margin-top: 0;
	}

	.menu-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #333;
		margin: 0;
	}

	.menu-tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.menu-tab {
		padding: 0.4rem 0.75rem;
		background: #f0f0f0;
		border: none;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 500;
		color: #666;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.15s;
	}

	.menu-tab:hover {
		background: #e8e8e8;
	}

	.menu-tab.active {
		background: #6c63ff;
		color: #fff;
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
</style>
