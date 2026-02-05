<script lang="ts">
	import { menuStore, type MenuItem } from '$lib/actions-store.svelte';
	import Popup from '$lib/components/Popup.svelte';

	let columns = $state(1);
	let selected = $state<MenuItem | null>(null);
	let quantity = $state(1);

	interface CartItem { item: MenuItem; qty: number; }
	let cart = $state<CartItem[]>([]);
	let cartOpen = $state(false);

	const cartCount = $derived(cart.reduce((sum, c) => sum + c.qty, 0));
	const cartTotal = $derived(cart.reduce((sum, c) => sum + c.qty * parseFloat(c.item.price), 0));

	const categories = $derived(
		[...new Set(menuStore.items.map((i: MenuItem) => i.category))]
	);

	function openItem(item: MenuItem) {
		selected = item;
		quantity = 1;
	}

	function addToCart(item: MenuItem, qty: number) {
		const existing = cart.find(c => c.item.id === item.id);
		if (existing) {
			existing.qty += qty;
			cart = [...cart];
		} else {
			cart = [...cart, { item, qty }];
		}
	}

	function submitItem() {
		if (selected) {
			addToCart(selected, quantity);
			selected = null;
		}
	}

	function removeFromCart(id: number) {
		cart = cart.filter(c => c.item.id !== id);
	}

	// Double-tap detection
	let lastTap = $state<{ id: number; time: number }>({ id: 0, time: 0 });

	function handleTap(item: MenuItem) {
		const now = Date.now();
		if (lastTap.id === item.id && now - lastTap.time < 350) {
			// Double tap — add 1 to cart directly
			addToCart(item, 1);
			lastTap = { id: 0, time: 0 };
		} else {
			lastTap = { id: item.id, time: now };
			// Wait to see if it's a double tap, otherwise open modal
			setTimeout(() => {
				if (lastTap.id === item.id && Date.now() - lastTap.time >= 300) {
					openItem(item);
					lastTap = { id: 0, time: 0 };
				}
			}, 350);
		}
	}
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
		{#each menuStore.items.filter((i: MenuItem) => i.category === category) as item (item.id)}
			<button class="menu-card" class:grid-card={columns === 2} onclick={() => handleTap(item)}>
				<div class="card-info">
					<span class="card-name">{item.name}</span>
					<span class="card-desc">{item.description}</span>
				</div>
				<span class="card-price">${item.price}</span>
			</button>
		{/each}
	</div>
{/each}

<!-- Item detail modal -->
<Popup open={selected !== null} title={selected?.name ?? ''} onclose={() => (selected = null)} fullscreen>
	{#if selected}
		<div class="detail">
			<div class="detail-img">
				<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
				<span>No image</span>
			</div>
			<span class="detail-category">{selected.category}</span>
			<p class="detail-desc">{selected.description}</p>
			<span class="detail-price">${selected.price}</span>
			<div class="qty-row">
				<button class="qty-btn" onclick={() => { if (quantity > 1) quantity--; }}>-</button>
				<span class="qty-value">{quantity}</span>
				<button class="qty-btn" onclick={() => quantity++}>+</button>
			</div>
		</div>
	{/if}
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn primary" onclick={submitItem}>Submit</button>
			<button class="btn secondary" onclick={() => (selected = null)}>Cancel</button>
		</div>
	{/snippet}
</Popup>

<!-- Cart modal -->
<Popup open={cartOpen} title="Cart" onclose={() => (cartOpen = false)} fullscreen>
	{#if cart.length === 0}
		<p class="cart-empty">Your cart is empty</p>
	{:else}
		<ul class="cart-list">
			{#each cart as entry (entry.item.id)}
				<li class="cart-item">
					<div class="cart-item-info">
						<span class="cart-item-name">{entry.item.name}</span>
						<span class="cart-item-meta">{entry.qty} x ${entry.item.price}</span>
					</div>
					<span class="cart-item-total">${(entry.qty * parseFloat(entry.item.price)).toFixed(2)}</span>
					<button class="cart-remove" onclick={() => removeFromCart(entry.item.id)} aria-label="Remove">
						<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
					</button>
				</li>
			{/each}
		</ul>
		<div class="cart-total-row">
			<span>Total</span>
			<span class="cart-total-price">${cartTotal.toFixed(2)}</span>
		</div>
	{/if}
</Popup>

<!-- Floating cart button -->
{#if cartCount > 0}
	<button class="cart-fab" onclick={() => (cartOpen = true)}>
		<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
		<span class="cart-badge">{cartCount}</span>
	</button>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 20px;
		position: sticky;
		top: 0;
		background: #f5f5f5;
		z-index: 10;
		padding-bottom: 0.5rem;
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
		width: 100%;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		text-align: left;
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

	.menu-card.grid-card {
		flex-direction: column;
		align-items: flex-start;
		padding: 0.75rem;
	}

	.menu-card.grid-card .card-desc {
		white-space: normal;
	}

	/* Detail modal */
	.detail {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		text-align: center;
	}

	.detail-img {
		width: 100%;
		aspect-ratio: 16 / 10;
		background: #f0f0f0;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: #bbb;
	}

	.detail-img svg {
		width: 2.5rem;
		height: 2.5rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.detail-img span {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.detail-category {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #999;
		background: #f0f0f0;
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
	}

	.detail-desc {
		font-size: 0.95rem;
		color: #555;
		margin: 0;
		line-height: 1.5;
	}

	.detail-price {
		font-size: 1.5rem;
		font-weight: 700;
		color: #6c63ff;
	}

	.qty-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.qty-btn {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		border: 1px solid #ddd;
		background: #fff;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6c63ff;
		transition: background 0.15s, border-color 0.15s;
	}

	.qty-btn:hover {
		background: #f0eeff;
		border-color: #6c63ff;
	}

	.qty-value {
		font-size: 1.25rem;
		font-weight: 700;
		min-width: 2rem;
		text-align: center;
	}

	/* Footer buttons */
	.footer-buttons {
		display: flex;
		width: 100%;
		gap: 0.5rem;
	}

	.footer-buttons .btn { flex: 1; }

	.btn.primary {
		padding: 0.55rem 1.2rem;
		background: #6c63ff;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.btn.primary:hover { background: #5a52d5; }

	.btn.secondary {
		padding: 0.55rem 1.2rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		color: #555;
	}

	.btn.secondary:hover { background: #f0f0f0; }

	/* Cart FAB */
	.cart-fab {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background: #6c63ff;
		color: #fff;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
		z-index: 50;
		transition: transform 0.15s, box-shadow 0.15s;
	}

	.cart-fab:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 16px rgba(108, 99, 255, 0.5);
	}

	.cart-fab svg {
		width: 1.4rem;
		height: 1.4rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.cart-badge {
		position: absolute;
		top: -0.2rem;
		right: -0.2rem;
		background: #e74c3c;
		color: #fff;
		font-size: 0.7rem;
		font-weight: 700;
		width: 1.3rem;
		height: 1.3rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Cart modal */
	.cart-empty {
		text-align: center;
		color: #999;
		padding: 2rem 0;
	}

	.cart-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.cart-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		background: #f9f9fb;
		border-radius: 8px;
	}

	.cart-item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.cart-item-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: #222;
	}

	.cart-item-meta {
		font-size: 0.8rem;
		color: #888;
	}

	.cart-item-total {
		font-weight: 700;
		font-size: 0.9rem;
		color: #6c63ff;
		white-space: nowrap;
	}

	.cart-remove {
		background: none;
		border: none;
		cursor: pointer;
		color: #ccc;
		padding: 0.25rem;
		display: flex;
		transition: color 0.15s;
	}

	.cart-remove:hover { color: #e74c3c; }

	.cart-remove svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.cart-total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		margin-top: 0.75rem;
		border-top: 1px solid #e0e0e0;
		font-weight: 600;
		font-size: 1rem;
	}

	.cart-total-price {
		color: #6c63ff;
		font-size: 1.15rem;
		font-weight: 700;
	}
</style>
