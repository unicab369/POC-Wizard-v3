<script lang="ts">
	import { menuStore, cartStore, tablesStore, menuDisplayStore, menuSettingsStore, branchStore, tableShapeCss, formatCurrency, type MenuItem, type TableItem } from '$lib/actions-store.svelte';
	import Popup from '$lib/components/Popup.svelte';
	import QRCode from 'qrcode';
	import { getBranchData } from '$lib/test-data/branch-data';

	interface Customer { id: number; name: string; phone: string; }
	const customers = $derived<Customer[]>(getBranchData(branchStore.id).customers);

	// Check if employee is signed in via Branch
	const isEmployee = $derived(
		typeof sessionStorage !== 'undefined' && sessionStorage.getItem('employee-auth') !== null
	);

	let tableSelectOpen = $state(false);
	let selectedTable = $state<TableItem | null>(null);

	function selectTable(t: TableItem) {
		selectedTable = t;
		tableSelectOpen = false;
		cartOpen = true;
	}

	function clearTable() {
		selectedTable = null;
	}

	let columns = $state(menuDisplayStore.mode === 'grid' ? 2 : 1);
	const effectiveColumns = $derived(menuDisplayStore.mode === 'list' ? 1 : menuDisplayStore.mode === 'grid' ? 2 : columns);
	let selected = $state<MenuItem | null>(null);
	let quantity = $state(1);
	let cartOpen = $state(false);
	let checkoutOpen = $state(false);
	let qrDataUrl = $state('');
	let qrContent = $state('');
	let confirmClearOpen = $state(false);
	let purchasesOpen = $state(false);
	let purchaseQrOpen = $state(false);
	let purchaseQrUrl = $state('');
	let purchaseQrOrder = $state<Order | null>(null);
	let customerName = $state('');
	let customerPhone = $state('');
	let showCustomerForm = $state(false);
	let customerSearch = $state('');

	const filteredCustomers = $derived(() => {
		const q = customerSearch.trim().toLowerCase();
		if (!q) return [];
		return customers.filter(c =>
			c.name.toLowerCase().includes(q) || c.phone.includes(q)
		);
	});

	function selectCustomer(c: Customer) {
		customerName = c.name;
		customerPhone = c.phone;
		customerSearch = '';
	}

	interface Order {
		items: { id: number; name: string; qty: number; price: number }[];
		total: number;
		date: string;
		customer?: { name: string; phone: string };
		table?: { id: number; label: string };
	}

	let orders = $state<Order[]>(getBranchData(branchStore.id).purchases as Order[]);

	async function startCheckout() {
		const tableId = selectedTable ? selectedTable.id : 0;
		const orderStr = cartStore.items.map(c => `${c.item.id}:${c.qty}`).join(',') + `,${cartStore.total},${tableId}`;
		qrContent = orderStr;
		qrDataUrl = await QRCode.toDataURL(orderStr, { width: 256, margin: 2 });
		showCustomerForm = false;
		customerSearch = '';
		cartOpen = false;
		checkoutOpen = true;
	}

	function submitOrder() {
		const order: Order = {
			items: cartStore.items.map(c => ({ id: c.item.id, name: c.item.name, qty: c.qty, price: c.item.price })),
			total: cartStore.total,
			date: new Date().toLocaleString()
		};
		if (customerName.trim()) {
			order.customer = { name: customerName.trim(), phone: customerPhone.trim() };
		}
		if (selectedTable) {
			order.table = { id: selectedTable.id, label: selectedTable.label };
		}
		orders = [order, ...orders];
		cartStore.clear();
		customerName = '';
		customerPhone = '';
		selectedTable = null;
		checkoutOpen = false;
	}

	async function viewPurchaseQr(order: Order) {
		const tableId = order.table ? order.table.id : 0;
		const orderStr = order.items.map(i => `${i.id}:${i.qty}`).join(',') + `,${order.total},${tableId}`;
		purchaseQrUrl = await QRCode.toDataURL(orderStr, { width: 256, margin: 2 });
		purchaseQrOrder = order;
		purchasesOpen = false;
		purchaseQrOpen = true;
	}

	function backToPurchases() {
		purchaseQrOpen = false;
		purchasesOpen = true;
	}

	function backToCart() {
		checkoutOpen = false;
		cartOpen = true;
	}

	const categories = $derived(
		[...new Set(menuStore.items.map((i: MenuItem) => i.category))]
	);

	function openItem(item: MenuItem) {
		selected = item;
		quantity = cartStore.qtyOf(item.id) || 1;
	}

	function submitItem() {
		if (selected) {
			cartStore.set(selected, quantity);
			selected = null;
		}
	}

	// Double-tap detection
	let lastTap = $state<{ id: number; time: number }>({ id: 0, time: 0 });

	function handleTap(item: MenuItem) {
		const now = Date.now();
		if (lastTap.id === item.id && now - lastTap.time < 350) {
			// Double tap — add 1 to cart directly
			cartStore.add(item, 1);
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
		{#if menuDisplayStore.mode === 'list' || menuDisplayStore.mode === 'both'}
			<button
				class="toggle-btn"
				class:active={effectiveColumns === 1}
				onclick={() => (columns = 1)}
				aria-label="List view"
			>
				<svg viewBox="0 0 24 24"><path d="M3 4h18M3 12h18M3 20h18" /></svg>
			</button>
		{/if}
		{#if menuDisplayStore.mode === 'grid' || menuDisplayStore.mode === 'both'}
			<button
				class="toggle-btn"
				class:active={effectiveColumns === 2}
				onclick={() => (columns = 2)}
				aria-label="Grid view"
			>
				<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
			</button>
		{/if}
	</div>
</div>

{#each categories as category}
	<h2 class="category-title">{category}</h2>
	<div class="menu-grid" class:two-col={effectiveColumns === 2}>
		{#each menuStore.items.filter((i: MenuItem) => i.category === category) as item (item.id)}
			<button class="menu-card" class:grid-card={effectiveColumns === 2} onclick={() => handleTap(item)}>
				{#if cartStore.qtyOf(item.id) > 0}
					<span class="card-qty">{cartStore.qtyOf(item.id)}</span>
				{/if}
				<div class="card-info">
					<span class="card-name">{item.name}</span>
					<span class="card-desc">{item.description}</span>
				</div>
				<span class="card-price">{formatCurrency(item.price)}</span>
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
			</div>
			<span class="detail-category">{selected.category}</span>
			<p class="detail-desc">{selected.description}</p>
			<div class="detail-bottom">
				<span class="detail-price">{formatCurrency(selected.price)}</span>
				<div class="qty-row">
					<button class="qty-btn" onclick={() => { if (quantity > 0) quantity--; }}>-</button>
					<span class="qty-value">{quantity}</span>
					<button class="qty-btn" onclick={() => quantity++}>+</button>
				</div>
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

<!-- Table selection modal -->
<Popup open={tableSelectOpen} title="Select Table" onclose={() => { tableSelectOpen = false; cartOpen = true; }} fullscreen>
	<div class="table-grid">
		{#each tablesStore.items as t (t.id)}
			<button class="table-card" class:selected={selectedTable?.id === t.id} onclick={() => selectTable(t)}>
				<span class="table-shape-icon table-shape-{tableShapeCss(t.shape)}"></span>
				<span class="table-label">{t.label}</span>
				<span class="table-seats">{t.seats} seat{t.seats !== 1 ? 's' : ''}</span>
			</button>
		{/each}
	</div>
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={() => { tableSelectOpen = false; cartOpen = true; }}>Back</button>
		</div>
	{/snippet}
</Popup>

<!-- Cart modal -->
<Popup open={cartOpen} title="Cart" onclose={() => (cartOpen = false)} fullscreen>
	<!-- Top action bar -->
	<div class="cart-action-bar">
		{#if isEmployee}
			<button class="btn-table" onclick={() => { cartOpen = false; tableSelectOpen = true; }}>
				<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 16v4M17 16v4" /></svg>
				{selectedTable ? selectedTable.label : 'Select Table'}
			</button>
		{:else}
			<span></span>
		{/if}
		{#if cartStore.items.length > 0}
			<button class="btn-clear" onclick={() => (confirmClearOpen = true)}>
				<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12z" /></svg>
				Clear
			</button>
		{/if}
	</div>

	<!-- Cart content -->
	{#if cartStore.items.length === 0}
		<div class="cart-empty-state">
			<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
			<p class="cart-empty">Your cart is empty</p>
			<p class="cart-hint">Tap an item to add it to your cart</p>
		</div>
	{:else}
		<ul class="cart-list">
			{#each cartStore.items as entry (entry.item.id)}
				<li class="cart-item">
					<button class="cart-remove" onclick={() => cartStore.remove(entry.item.id)} aria-label="Remove">
						<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
					</button>
					<div class="cart-item-info">
						<span class="cart-item-name">{entry.item.name}</span>
						<span class="cart-item-meta">{entry.qty} x {formatCurrency(entry.item.price)}</span>
					</div>
					<span class="cart-item-total">{formatCurrency(entry.qty * entry.item.price)}</span>
				</li>
			{/each}
		</ul>
		<div class="cart-total-row">
			<span>Total</span>
			<span class="cart-total-price">{formatCurrency(cartStore.total)}</span>
		</div>
	{/if}

	<!-- Last Purchases link -->
	{#if orders.length > 0}
		<button class="btn-purchases" onclick={() => { cartOpen = false; purchasesOpen = true; }}>
			<svg viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			Last Purchases
		</button>
	{/if}

	{#if menuSettingsStore.requireTable && !selectedTable && cartStore.items.length > 0}
		<p class="table-required-hint">Please select a table to checkout</p>
	{/if}

	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={() => (cartOpen = false)}>Cancel</button>
			<button class="btn primary" onclick={startCheckout} disabled={cartStore.items.length === 0 || (menuSettingsStore.requireTable && !selectedTable)}>Checkout</button>
		</div>
	{/snippet}
</Popup>

<!-- Confirm Remove All modal -->
<Popup open={confirmClearOpen} title="Remove All" onclose={() => (confirmClearOpen = false)} wide>
	<p class="confirm-text">Are you sure you want to remove all items from your cart?</p>
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={() => (confirmClearOpen = false)}>Cancel</button>
			<button class="btn danger" onclick={() => { cartStore.clear(); confirmClearOpen = false; cartOpen = false; }}>Remove All</button>
		</div>
	{/snippet}
</Popup>

<!-- Checkout QR modal -->
<Popup open={checkoutOpen} title="Order QR Code" onclose={() => (checkoutOpen = false)} fullscreen>
	<div class="checkout-content">
		{#if qrDataUrl}
			<img src={qrDataUrl} alt="Order QR Code" class="checkout-qr" />
		{/if}
		<p class="checkout-hint">Scan this QR code to complete your order</p>
		<p class="qr-decoded">{qrContent}</p>
		<div class="checkout-summary">
			<span>{cartStore.count} item{cartStore.count !== 1 ? 's' : ''}</span>
			<span class="cart-total-price">{formatCurrency(cartStore.total)}</span>
		</div>

		{#if selectedTable}
			<div class="customer-tag">
				<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 16v4M17 16v4" /></svg>
				<span>{selectedTable.label}</span>
			</div>
		{/if}

		{#if showCustomerForm}
			<div class="customer-form">
				<label class="field"><span>Search Customer</span>
					<input type="text" bind:value={customerSearch} placeholder="Search by name or phone" />
				</label>
				{#if filteredCustomers().length > 0}
					<ul class="customer-results">
						{#each filteredCustomers() as c (c.id)}
							<li>
								<button class="customer-result" onclick={() => selectCustomer(c)}>
									<span class="customer-result-name">{c.name}</span>
									<span class="customer-result-phone">{c.phone}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
				<label class="field"><span>Name</span>
					<input type="text" bind:value={customerName} placeholder="Customer name" />
				</label>
				<label class="field"><span>Phone</span>
					<input type="text" bind:value={customerPhone} placeholder="1234567890" inputmode="numeric" oninput={(e) => { customerPhone = (e.target as HTMLInputElement).value.replace(/\D/g, ''); }} />
				</label>
			</div>
		{:else}
			<button class="btn-add-customer" onclick={() => (showCustomerForm = true)}>
				<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-6M19 8v6" /></svg>
				Add Customer
			</button>
		{/if}

		{#if customerName.trim()}
			<div class="customer-tag">
				<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
				<span>{customerName}{customerPhone ? ` \u2022 ${customerPhone}` : ''}</span>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={backToCart}>Back</button>
			<button class="btn primary" onclick={submitOrder}>Submit</button>
		</div>
	{/snippet}
</Popup>

<!-- Purchases history modal -->
<Popup open={purchasesOpen} title="Last Purchases" onclose={() => (purchasesOpen = false)} fullscreen>
	{#if orders.length === 0}
		<p class="cart-empty">No previous purchases</p>
	{:else}
		<div class="purchases-list">
			{#each orders as order}
				<button class="purchase-card" onclick={() => viewPurchaseQr(order)}>
					<div class="purchase-header">
						<div class="purchase-header-left">
							<span class="purchase-date">{order.date} {#if order.table} | {order.table.label}{/if}</span>
							{#if order.customer}
								<span class="purchase-customer">{order.customer.name}</span>
							{/if}
						</div>
						<span class="cart-total-price">{formatCurrency(order.total)}</span>
					</div>
					<ul class="purchase-items">
						{#each order.items as item}
							<li>{item.qty} x {item.name} <span class="purchase-item-price">{formatCurrency(item.price)}</span></li>
						{/each}
					</ul>
				</button>
			{/each}
		</div>
	{/if}
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={() => { purchasesOpen = false; cartOpen = true; }}>Back</button>
		</div>
	{/snippet}
</Popup>

<!-- Purchase QR modal -->
<Popup open={purchaseQrOpen} title="Purchase QR Code" onclose={() => (purchaseQrOpen = false)} fullscreen>
	<div class="checkout-content">
		{#if purchaseQrUrl}
			<img src={purchaseQrUrl} alt="Purchase QR Code" class="checkout-qr" />
		{/if}
		{#if purchaseQrOrder}
			<p class="checkout-hint">{purchaseQrOrder.date}</p>
			<div class="checkout-summary">
				<span>{purchaseQrOrder.items.length} item{purchaseQrOrder.items.length !== 1 ? 's' : ''}</span>
				<span class="cart-total-price">{formatCurrency(purchaseQrOrder.total)}</span>
			</div>
			{#if purchaseQrOrder.customer}
				<div class="customer-tag">
					<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
					<span>{purchaseQrOrder.customer.name}{purchaseQrOrder.customer.phone ? ` \u2022 ${purchaseQrOrder.customer.phone}` : ''}</span>
				</div>
			{/if}
			{#if purchaseQrOrder.table}
				<div class="customer-tag">
					<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 16v4M17 16v4" /></svg>
					<span>{purchaseQrOrder.table.label}</span>
				</div>
			{/if}
		{/if}
	</div>
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={backToPurchases}>Back</button>
		</div>
	{/snippet}
</Popup>

<!-- Floating cart button -->
<button class="cart-fab" onclick={() => (cartOpen = true)}>
	<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
	{#if cartStore.count > 0}
		<span class="cart-badge">{cartStore.count}</span>
	{/if}
</button>

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

	.menu-card {
		position: relative;
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

	/* Detail modal */
	.detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.25rem;
	}

	.detail-img {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: linear-gradient(135deg, #f0eeff 0%, #e8e8f0 100%);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #c4c0e0;
	}

	.detail-img svg {
		width: 3rem;
		height: 3rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.detail-category {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #6c63ff;
		background: #f0eeff;
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		align-self: flex-start;
	}

	.detail-desc {
		font-size: 0.95rem;
		color: #666;
		margin: 0;
		line-height: 1.6;
	}

	.detail-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.5rem;
	}

	.detail-price {
		font-size: 1.6rem;
		font-weight: 700;
		color: #6c63ff;
	}

	.qty-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #f5f5f7;
		padding: 0.35rem 0.5rem;
		border-radius: 25px;
	}

	.qty-btn {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		border: none;
		background: #fff;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6c63ff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		transition: background 0.15s, box-shadow 0.15s;
	}

	.qty-btn:hover {
		background: #f0eeff;
		box-shadow: 0 2px 6px rgba(108, 99, 255, 0.2);
	}

	.qty-value {
		font-size: 1.2rem;
		font-weight: 700;
		min-width: 1.5rem;
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
		font-size: 1.1rem;
		cursor: pointer;
	}

	.btn.primary:hover:not(:disabled) { background: #5a52d5; }
	.btn.primary:disabled { opacity: 0.4; cursor: not-allowed; }

	.btn.secondary {
		padding: 0.55rem 1.2rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1.1rem;
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
		padding: 1.5rem 0 0;
		margin: 0;
	}

	.cart-hint {
		text-align: center;
		color: #bbb;
		font-size: 0.85rem;
		margin: 0.25rem 0 0;
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

	.confirm-text {
		text-align: center;
		color: #555;
		font-size: 0.95rem;
		margin: 1rem 0;
		line-height: 1.5;
	}

	.btn.danger {
		padding: 0.55rem 1.2rem;
		background: #e74c3c;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn.danger:hover { background: #c0392b; }

	.cart-action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f0f0;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}

	.btn-clear {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.75rem;
		background: none;
		border: 1px solid #e74c3c;
		border-radius: 6px;
		color: #e74c3c;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.btn-clear:hover {
		background: #e74c3c;
		color: #fff;
	}

	.btn-clear svg {
		width: 0.9rem;
		height: 0.9rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.cart-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1rem;
		color: #999;
	}

	.cart-empty-state svg {
		width: 3rem;
		height: 3rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		margin-bottom: 0.75rem;
		opacity: 0.5;
	}

	.btn-purchases {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.6rem;
		margin-top: 0.75rem;
		background: #f9f9fb;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		color: #666;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.btn-purchases:hover {
		background: #f0eeff;
		border-color: #6c63ff;
		color: #6c63ff;
	}

	.btn-purchases svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Purchases */
	.purchases-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.purchase-card {
		border: 1px solid #e8e8e8;
		border-radius: 10px;
		overflow: hidden;
		background: #fff;
		width: 100%;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		text-align: left;
		padding: 0;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.purchase-card:hover {
		border-color: #d0d0d0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.purchase-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.75rem;
		background: #f9f9fb;
		border-bottom: 1px solid #f0f0f0;
	}

	.purchase-header-left {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.purchase-date {
		font-size: 0.8rem;
		color: #888;
	}

	.purchase-customer {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6c63ff;
	}

	.purchase-table {
		font-size: 0.7rem;
		font-weight: 600;
		color: #888;
	}

	.purchase-items {
		list-style: none;
		padding: 0.5rem 0.75rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: #555;
	}

	.purchase-items li {
		display: flex;
		justify-content: space-between;
	}

	.purchase-item-price {
		color: #888;
	}

	/* Checkout */
	.checkout-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0.5rem;
		text-align: center;
	}

	.checkout-qr {
		width: 200px;
		height: 200px;
		border-radius: 10px;
	}

	.checkout-hint {
		font-size: 0.9rem;
		color: #888;
		margin: 0;
	}

	.qr-decoded {
		font-family: monospace;
		font-size: 0.8rem;
		color: #999;
		background: #f5f5f5;
		padding: 0.4rem 0.75rem;
		border-radius: 6px;
		margin: 0;
		word-break: break-all;
	}

	.checkout-summary {
		display: flex;
		justify-content: space-between;
		width: 100%;
		max-width: 250px;
		font-weight: 600;
		font-size: 1rem;
	}

	.btn-add-customer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: none;
		border: 1px dashed #ccc;
		border-radius: 8px;
		color: #888;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}

	.btn-add-customer:hover {
		border-color: #6c63ff;
		color: #6c63ff;
	}

	.btn-add-customer svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.customer-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		max-width: 280px;
	}

	.customer-form .field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.customer-form .field span {
		font-size: 0.8rem;
		font-weight: 600;
		color: #555;
		text-align: left;
	}

	.customer-form .field input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.9rem;
		font-family: inherit;
	}

	.customer-results {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
		max-height: 150px;
		overflow-y: auto;
	}

	.customer-result {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: #fff;
		border: none;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: background 0.15s;
	}

	.customer-result:last-child { border-bottom: none; }
	.customer-result:hover { background: #f0eeff; }

	.customer-result-name {
		font-size: 0.85rem;
		font-weight: 500;
		color: #333;
	}

	.customer-result-phone {
		font-size: 0.8rem;
		color: #999;
	}

	.customer-tag {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		background: #f0eeff;
		border-radius: 20px;
		color: #6c63ff;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.customer-tag svg {
		width: 0.9rem;
		height: 0.9rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Table selection */
	.btn-table {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		background: #f0eeff;
		color: #6c63ff;
		border: 1px solid #d8d4ff;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-table:hover { background: #e4e0ff; }

	.btn-table svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}


	.table-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		padding: 0.25rem;
	}

	.table-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 1rem 0.5rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 10px;
		cursor: pointer;
		transition: border-color 0.15s, box-shadow 0.15s;
		font-family: inherit;
	}

	.table-card:hover {
		border-color: #6c63ff;
		box-shadow: 0 2px 8px rgba(108, 99, 255, 0.15);
	}

	.table-card.selected {
		border-color: #6c63ff;
		background: #f0eeff;
	}

	.table-shape-icon {
		display: block;
		width: 1.75rem;
		height: 1.75rem;
		border: 2px solid #6c63ff;
	}

	.table-shape-square { border-radius: 2px; }
	.table-shape-round { border-radius: 50%; }
	.table-shape-rectangle { width: 2.5rem; height: 1.2rem; border-radius: 3px; }
	.table-shape-bar { width: 2.8rem; height: 0.7rem; border-radius: 3px; }

	.table-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #333;
	}

	.table-seats {
		font-size: 0.7rem;
		color: #999;
	}

	.table-required-hint {
		text-align: center;
		font-size: 0.8rem;
		color: #e74c3c;
		margin: 0.5rem 0 0;
	}
</style>
