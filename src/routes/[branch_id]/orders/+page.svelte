<script lang="ts">
	import { branchStore, formatCurrency, purchasesStore } from '$lib/actions-store.svelte';
	import Popup from '$lib/components/Popup.svelte';

	type OrderStatus = 'reserved' | 'ordering' | 'preparing' | 'served' | 'billing' | 'completed' | 'cancelled';

	const STATUS_FLOW: OrderStatus[] = ['reserved', 'ordering', 'preparing', 'served', 'billing', 'completed'];

	const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
		reserved: { label: 'Reserved', color: '#0ea5e9', bg: '#e0f2fe' },
		ordering: { label: 'Ordering', color: '#f59e0b', bg: '#fef3c7' },
		preparing: { label: 'Preparing', color: '#f59e0b', bg: '#fef3c7' },
		served: { label: 'Served', color: '#f59e0b', bg: '#fef3c7' },
		billing: { label: 'Billing', color: '#f59e0b', bg: '#fef3c7' },
		completed: { label: 'Completed', color: '#059669', bg: '#d1fae5' },
		cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' }
	};

	interface StateHistoryEntry {
		status: OrderStatus;
		date: string;
	}

	interface OrderItem {
		id: number;
		name: string;
		qty: number;
		price: number;
	}

	interface Order {
		items: OrderItem[];
		total: number;
		date: string;
		status: OrderStatus;
		customer?: { name: string; phone: string };
		table?: { id: number; label: string };
		stateHistory?: StateHistoryEntry[];
	}

	const allOrders = $derived<Order[]>(purchasesStore.items as Order[]);

	// Exclude reserved orders (shown in Reservations page)
	const orders = $derived(allOrders.filter(order => order.status !== 'reserved'));

	// Group orders by date (just the date part, not time)
	const ordersByDate = $derived.by(() => {
		const groups: { date: string; orders: Order[] }[] = [];
		const dateMap = new Map<string, Order[]>();

		for (const order of orders) {
			// Extract just the date part (before the comma)
			const datePart = order.date.split(',')[0];
			if (!dateMap.has(datePart)) {
				dateMap.set(datePart, []);
			}
			dateMap.get(datePart)!.push(order);
		}

		// Convert map to array and sort by date (newest first)
		for (const [date, dateOrders] of dateMap) {
			groups.push({ date, orders: dateOrders });
		}

		return groups;
	});

	// Get time part from full date string
	function getTime(dateStr: string): string {
		const parts = dateStr.split(', ');
		return parts[1] || '';
	}

	function getStatusStyle(status: OrderStatus): string {
		const config = STATUS_CONFIG[status];
		if (!config) return 'color: #888; background: #f0f0f0;';
		return `color: ${config.color}; background: ${config.bg};`;
	}

	function getStatusLabel(status: OrderStatus): string {
		const config = STATUS_CONFIG[status];
		return config?.label ?? status ?? 'Unknown';
	}

	let selectedOrderIndex = $state<number | null>(null);

	const selectedOrder = $derived(selectedOrderIndex !== null ? allOrders[selectedOrderIndex] : null);

	function selectOrder(order: Order) {
		// Find the index in allOrders (not filtered orders)
		const index = allOrders.findIndex(o => o === order || (o.date === order.date && o.total === order.total && o.customer?.name === order.customer?.name));
		selectedOrderIndex = index >= 0 ? index : null;
	}

	function closeModal() {
		selectedOrderIndex = null;
	}

	const modalOpen = $derived(selectedOrderIndex !== null);

	function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
		if (currentStatus === 'cancelled' || currentStatus === 'completed') return null;
		const currentIndex = STATUS_FLOW.indexOf(currentStatus);
		if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
		return STATUS_FLOW[currentIndex + 1];
	}

	function advanceToNextState() {
		if (selectedOrderIndex === null || !selectedOrder) return;
		const nextStatus = getNextStatus(selectedOrder.status);
		if (!nextStatus) return;

		const now = new Date().toLocaleString();
		const newHistoryEntry: StateHistoryEntry = { status: nextStatus, date: now };

		// Get existing history or initialize it
		const existingHistory = selectedOrder.stateHistory || [{ status: selectedOrder.status, date: selectedOrder.date }];
		const newHistory = [...existingHistory, newHistoryEntry];

		// Update via the shared store
		purchasesStore.update(selectedOrderIndex, {
			status: nextStatus,
			stateHistory: newHistory
		});
	}

	function getStateHistory(order: Order): StateHistoryEntry[] {
		if (order.stateHistory && order.stateHistory.length > 0) {
			return order.stateHistory;
		}
		// If no history, return current state with order date
		return [{ status: order.status, date: order.date }];
	}

	const nextStatus = $derived(selectedOrder ? getNextStatus(selectedOrder.status) : null);
</script>

<Popup open={modalOpen} title="Order Details" onclose={closeModal} fullscreen>
	{#if selectedOrder}
		<div class="order-detail">
			<div class="order-meta">
				<span class="order-date">{selectedOrder.date}</span>
				{#if selectedOrder.table}
					<span class="order-table">{selectedOrder.table.label}</span>
				{/if}
			</div>

			{#if selectedOrder.customer}
				<div class="customer-info">
					<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
					<span>{selectedOrder.customer.name}</span>
					{#if selectedOrder.customer.phone}
						<span class="customer-phone">{selectedOrder.customer.phone}</span>
					{/if}
				</div>
			{/if}

			{#if selectedOrder.items.length > 0}
				<div class="items-list">
					<h2>Items</h2>
					{#each selectedOrder.items as item}
						<div class="item-row">
							<div class="item-info">
								<span class="item-name">{item.name}</span>
								<span class="item-qty">{item.qty} x {formatCurrency(item.price)}</span>
							</div>
							<span class="item-total">{formatCurrency(item.qty * item.price)}</span>
						</div>
					{/each}
				</div>

				<div class="order-total">
					<span>Total</span>
					<span class="total-price">{formatCurrency(selectedOrder.total)}</span>
				</div>
			{/if}

			<div class="state-history">
				<h2>Status History</h2>
				{#each getStateHistory(selectedOrder) as entry}
					<div class="history-entry">
						<span class="history-status" style={getStatusStyle(entry.status)}>
							{getStatusLabel(entry.status)}
						</span>
						<span class="history-date">{entry.date}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={closeModal}>Close</button>
			{#if nextStatus}
				<button class="btn primary" onclick={advanceToNextState}>
					{getStatusLabel(nextStatus)}
				</button>
			{/if}
		</div>
	{/snippet}
</Popup>

<h1>Orders</h1>
	<p class="subtitle">Purchase history</p>

	{#if orders.length === 0}
		<div class="empty-state">
			<svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
			<p>No orders yet</p>
		</div>
	{:else}
		{#each ordersByDate as group}
			<div class="date-section">
				<h2 class="date-header">{group.date}</h2>
				<div class="orders-list">
					{#each group.orders as order}
						<button class="order-card" onclick={() => selectOrder(order)}>
							<div class="order-header">
								<span class="order-time">{getTime(order.date)}</span>
								<span class="status-badge" style={getStatusStyle(order.status)}>
									{getStatusLabel(order.status)}
								</span>
								<span class="order-total-badge">{formatCurrency(order.total)}</span>
							</div>
							<div class="order-summary">
								{#if order.items.length > 0}
									<span class="order-items-count">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
								{/if}
								{#if order.table}
									<span class="order-table-badge">{order.table.label}</span>
								{/if}
								{#if order.customer}
									<span class="order-customer">{order.customer.name}</span>
								{/if}
							</div>
							{#if order.items.length > 0}
								<div class="order-items-preview">
									{order.items.map(i => i.name).join(', ')}
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	{/if}

<style>
	h1 {
		margin: 1.25rem 0 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.status-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.subtitle {
		color: #888;
		font-size: 0.9rem;
		margin: 0.25rem 0 1.5rem;
	}

	.date-section {
		margin-bottom: 1.5rem;
	}

	.date-header {
		font-size: 0.85rem;
		font-weight: 600;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e8e8e8;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: #999;
	}

	.empty-state svg {
		width: 3rem;
		height: 3rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	.orders-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.order-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 10px;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		width: 100%;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.order-card:hover {
		border-color: #d0d0d0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.order-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.order-header .order-total-badge {
		margin-left: auto;
	}

	.order-date {
		font-size: 0.8rem;
		color: #888;
	}

	.order-time {
		font-size: 0.8rem;
		color: #888;
		font-weight: 500;
	}

	.order-total-badge {
		font-size: 0.95rem;
		font-weight: 700;
		color: #6c63ff;
	}

	.order-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.order-items-count {
		font-size: 0.85rem;
		font-weight: 500;
		color: #555;
	}

	.order-table-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		background: #f0eeff;
		color: #6c63ff;
		border-radius: 4px;
	}

	.order-customer {
		font-size: 0.8rem;
		color: #666;
	}

	.order-items-preview {
		font-size: 0.8rem;
		color: #999;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Order Detail Modal */
	.order-detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.order-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.order-meta .order-date {
		font-size: 0.9rem;
		color: #888;
	}

	.order-meta .order-table {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		background: #f0eeff;
		color: #6c63ff;
		border-radius: 4px;
	}

	.customer-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		font-size: 0.9rem;
		color: #555;
	}

	.customer-info svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.customer-phone {
		color: #888;
		margin-left: auto;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.items-list h2 {
		font-size: 0.85rem;
		font-weight: 600;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.item-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.65rem 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.item-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: #222;
	}

	.item-qty {
		font-size: 0.8rem;
		color: #888;
	}

	.item-total {
		font-weight: 700;
		font-size: 0.9rem;
		color: #6c63ff;
	}

	.order-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		border-top: 1px solid #e0e0e0;
		font-weight: 600;
		font-size: 1rem;
		margin-top: 0.5rem;
	}

	.total-price {
		font-size: 1.25rem;
		font-weight: 700;
		color: #6c63ff;
	}

	.footer-buttons {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}

	.footer-buttons .btn {
		flex: 1;
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}

	.footer-buttons .btn.secondary {
		background: none;
		border: 1px solid #ccc;
		color: #555;
	}

	.footer-buttons .btn.secondary:hover {
		background: #f0f0f0;
	}

	.footer-buttons .btn.primary {
		background: #6c63ff;
		border: none;
		color: #fff;
	}

	.footer-buttons .btn.primary:hover {
		background: #5b54e0;
	}

	/* State History */
	.state-history {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.state-history h2 {
		font-size: 0.85rem;
		font-weight: 600;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.history-entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
	}

	.history-status {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.history-date {
		font-size: 0.8rem;
		color: #888;
	}
</style>
