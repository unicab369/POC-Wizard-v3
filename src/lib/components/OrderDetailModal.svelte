<script lang="ts">
	import { formatCurrency, purchasesStore, orderStatesStore, type OrderState } from '$lib/actions-store.svelte';
	import Popup from './Popup.svelte';

	type OrderStatus = 'reserved' | 'ordering' | 'preparing' | 'served' | 'billing' | 'completed' | 'cancelled' | 'removed';

	const STATUS_FLOW: OrderStatus[] = ['reserved', 'ordering', 'preparing', 'served', 'billing', 'completed'];

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

	// Check if user is a manager
	function isManager(): boolean {
		if (typeof sessionStorage === 'undefined') return false;
		const auth = sessionStorage.getItem('employee-auth');
		if (!auth) return false;
		try {
			const employee = JSON.parse(auth);
			return employee.role === 'Manager';
		} catch {
			return false;
		}
	}

	// Check if order is from today
	function isOrderFromToday(orderDate: string): boolean {
		const today = new Date();
		const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
		const orderDatePart = orderDate.split(',')[0];
		return orderDatePart === todayStr;
	}

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
		status: string;
		customer?: { name: string; phone: string };
		table?: { id: number; label: string };
		stateHistory?: StateHistoryEntry[];
	}

	interface Props {
		open: boolean;
		order: Order | null;
		orderIndex: number;
		onclose: () => void;
	}

	let { open, order: initialOrder, orderIndex, onclose }: Props = $props();

	// Derive the actual order from the store so it stays in sync when status changes
	const order = $derived(orderIndex >= 0 ? purchasesStore.items[orderIndex] as Order | undefined : initialOrder);

	// Delete confirmation
	let confirmDeleteOpen = $state(false);

	// Check if user can delete this order
	const canDelete = $derived(() => {
		if (!order) return false;
		// Managers can delete any order
		if (isManager()) return true;
		// Others can only delete orders from today
		return isOrderFromToday(order.date);
	});

	function openDeleteConfirm() {
		confirmDeleteOpen = true;
	}

	function cancelDelete() {
		confirmDeleteOpen = false;
	}

	function confirmDelete() {
		if (orderIndex >= 0) {
			// Mark as removed instead of actually deleting
			purchasesStore.update(orderIndex, { status: 'removed' });
			confirmDeleteOpen = false;
			onclose();
		}
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

	function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
		if (currentStatus === 'cancelled' || currentStatus === 'completed') return null;
		const currentIndex = STATUS_FLOW.indexOf(currentStatus);
		if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;

		for (let i = currentIndex + 1; i < STATUS_FLOW.length; i++) {
			const nextStatus = STATUS_FLOW[i];
			if (nextStatus === 'completed') return nextStatus;
			if (orderStatesStore.isEnabled(nextStatus as OrderState)) {
				return nextStatus;
			}
		}
		return 'completed';
	}

	function advanceToNextState() {
		if (orderIndex < 0 || !order) return;
		const nextStatus = getNextStatus(order.status as OrderStatus);
		if (!nextStatus) return;

		const now = new Date().toLocaleString();
		const newHistoryEntry: StateHistoryEntry = { status: nextStatus, date: now };

		const existingHistory = order.stateHistory || [{ status: order.status as OrderStatus, date: order.date }];
		const newHistory = [...existingHistory, newHistoryEntry];

		purchasesStore.update(orderIndex, {
			status: nextStatus,
			stateHistory: newHistory
		});

		if (nextStatus === 'completed') {
			onclose();
		}
	}

	function getStateHistory(order: Order): StateHistoryEntry[] {
		if (order.stateHistory && order.stateHistory.length > 0) {
			return order.stateHistory;
		}
		return [{ status: order.status as OrderStatus, date: order.date }];
	}

	const nextStatus = $derived(order ? getNextStatus(order.status as OrderStatus) : null);
</script>

<Popup {open} title="Order Details" {onclose} fullscreen>
	{#snippet headerAction()}
		{#if canDelete()}
			<button class="delete-btn" onclick={openDeleteConfirm} aria-label="Remove order">
				<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" /></svg>
			</button>
		{/if}
	{/snippet}
	{#if order}
		<div class="order-detail">
			<div class="order-meta">
				<span class="order-date">{order.date}</span>
				{#if order.table}
					<span class="order-table">{order.table.label}</span>
				{/if}
			</div>

			{#if order.customer}
				<div class="customer-info">
					<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
					<span>{order.customer.name}</span>
					{#if order.customer.phone}
						<span class="customer-phone">{order.customer.phone}</span>
					{/if}
				</div>
			{/if}

			{#if order.items.length > 0}
				<div class="items-list">
					<h2>Items</h2>
					{#each order.items as item}
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
					<span class="total-price">{formatCurrency(order.total)}</span>
				</div>
			{/if}

			<div class="state-history">
				<h2>Status History</h2>
				{#each getStateHistory(order) as entry}
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
			<button class="btn secondary" onclick={onclose}>Close</button>
			{#if nextStatus}
				<button class="btn primary" onclick={advanceToNextState}>
					{getStatusLabel(nextStatus)}
				</button>
			{/if}
		</div>
	{/snippet}
</Popup>

<!-- Remove confirmation popup -->
<Popup open={confirmDeleteOpen} title="Remove Order" onclose={cancelDelete} wide>
	<p class="confirm-text">Are you sure you want to remove this order? The order will be marked as removed.</p>
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={cancelDelete}>Cancel</button>
			<button class="btn danger" onclick={confirmDelete}>Remove</button>
		</div>
	{/snippet}
</Popup>

<style>
	.order-detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.order-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.delete-btn {
		padding: 0.4rem;
		background: none;
		border: 1px solid #e74c3c;
		border-radius: 6px;
		color: #e74c3c;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}

	.delete-btn:hover {
		background: #e74c3c;
		color: #fff;
	}

	.delete-btn svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.order-date {
		font-size: 0.9rem;
		color: #888;
	}

	.order-table {
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

	.confirm-text {
		text-align: center;
		color: #555;
		font-size: 0.95rem;
		margin: 1rem 0;
		line-height: 1.5;
	}

	.footer-buttons .btn.danger {
		background: #e74c3c;
		border: none;
		color: #fff;
	}

	.footer-buttons .btn.danger:hover {
		background: #c0392b;
	}
</style>
