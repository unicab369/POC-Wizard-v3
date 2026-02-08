<script lang="ts">
	import { formatCurrency, purchasesStore } from '$lib/actions-store.svelte';
	import OrderDetailModal from '$lib/components/OrderDetailModal.svelte';

	type OrderStatus = 'reserved' | 'ordering' | 'preparing' | 'served' | 'billing' | 'completed' | 'cancelled' | 'removed';

	const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
		reserved: { label: 'Reserved', color: '#0ea5e9', bg: '#e0f2fe' },
		ordering: { label: 'Ordering', color: '#f59e0b', bg: '#fef3c7' },
		preparing: { label: 'Preparing', color: '#f59e0b', bg: '#fef3c7' },
		served: { label: 'Served', color: '#f59e0b', bg: '#fef3c7' },
		billing: { label: 'Billing', color: '#f59e0b', bg: '#fef3c7' },
		completed: { label: 'Completed', color: '#059669', bg: '#d1fae5' },
		cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
		removed: { label: 'Removed', color: '#6b7280', bg: '#f3f4f6' }
	};

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
	}

	const allOrders = $derived<Order[]>(purchasesStore.items as Order[]);

	// Exclude reserved orders (shown in Reservations page)
	const orders = $derived(allOrders.filter(order => order.status !== 'reserved'));

	// Group orders by date (just the date part, not time)
	const ordersByDate = $derived.by(() => {
		const groups: { date: string; orders: Order[] }[] = [];
		const dateMap = new Map<string, Order[]>();

		for (const order of orders) {
			const datePart = order.date.split(',')[0];
			if (!dateMap.has(datePart)) {
				dateMap.set(datePart, []);
			}
			dateMap.get(datePart)!.push(order);
		}

		for (const [date, dateOrders] of dateMap) {
			groups.push({ date, orders: dateOrders });
		}

		return groups;
	});

	function getTime(dateStr: string): string {
		const parts = dateStr.split(', ');
		return parts[1] || '';
	}

	function getStatusStyle(status: OrderStatus): string {
		if (!status) {
			const completed = STATUS_CONFIG['completed'];
			return `color: ${completed.color}; background: ${completed.bg};`;
		}
		const config = STATUS_CONFIG[status];
		if (!config) {
			const completed = STATUS_CONFIG['completed'];
			return `color: ${completed.color}; background: ${completed.bg};`;
		}
		return `color: ${config.color}; background: ${config.bg};`;
	}

	function getStatusLabel(status: OrderStatus): string {
		if (!status) return 'Completed';
		const config = STATUS_CONFIG[status];
		return config?.label ?? 'Completed';
	}

	let selectedOrderIndex = $state<number | null>(null);

	const selectedOrder = $derived(selectedOrderIndex !== null ? allOrders[selectedOrderIndex] : null);

	function selectOrder(order: Order) {
		const index = allOrders.findIndex(o => o === order || (o.date === order.date && o.total === order.total && o.customer?.name === order.customer?.name));
		selectedOrderIndex = index >= 0 ? index : null;
	}

	function closeModal() {
		selectedOrderIndex = null;
	}

	const modalOpen = $derived(selectedOrderIndex !== null);
</script>

<OrderDetailModal
	open={modalOpen}
	order={selectedOrder}
	orderIndex={selectedOrderIndex ?? -1}
	onclose={closeModal}
/>

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
</style>
