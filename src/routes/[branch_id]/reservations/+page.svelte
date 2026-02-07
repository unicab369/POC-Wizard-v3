<script lang="ts">
	import { branchStore, formatCurrency } from '$lib/actions-store.svelte';
	import { getBranchData } from '$lib/test-data/branch-data';

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
	}

	const allOrders = $derived<Order[]>(getBranchData(branchStore.id).purchases as Order[]);

	// Filter to only show reserved orders
	const reservations = $derived(allOrders.filter(order => order.status === 'reserved'));

	// Group reservations by date
	const reservationsByDate = $derived.by(() => {
		const groups: { date: string; orders: Order[] }[] = [];
		const dateMap = new Map<string, Order[]>();

		for (const order of reservations) {
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

	let selectedReservation = $state<Order | null>(null);

	function selectReservation(order: Order) {
		selectedReservation = order;
	}

	function goBack() {
		selectedReservation = null;
	}
</script>

{#if selectedReservation}
	<div class="reservation-detail">
		<div class="detail-header">
			<h1>Reservation Details</h1>
			<span class="status-badge">Reserved</span>
		</div>
		<div class="reservation-meta">
			<span class="reservation-date">{selectedReservation.date}</span>
			{#if selectedReservation.table}
				<span class="reservation-table">{selectedReservation.table.label}</span>
			{/if}
		</div>

		{#if selectedReservation.customer}
			<div class="customer-info">
				<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
				<span>{selectedReservation.customer.name}</span>
				{#if selectedReservation.customer.phone}
					<span class="customer-phone">{selectedReservation.customer.phone}</span>
				{/if}
			</div>
		{/if}

		{#if selectedReservation.items.length > 0}
			<div class="items-list">
				<h2>Pre-ordered Items</h2>
				{#each selectedReservation.items as item}
					<div class="item-row">
						<div class="item-info">
							<span class="item-name">{item.name}</span>
							<span class="item-qty">{item.qty} x {formatCurrency(item.price)}</span>
						</div>
						<span class="item-total">{formatCurrency(item.qty * item.price)}</span>
					</div>
				{/each}
				<div class="order-total">
					<span>Total</span>
					<span class="total-price">{formatCurrency(selectedReservation.total)}</span>
				</div>
			</div>
		{/if}
	</div>

	<div class="footer-bar">
		<button class="btn secondary back-btn" onclick={goBack}>Back</button>
	</div>
{:else}
	<h1>Reservations</h1>
	<p class="subtitle">Upcoming table reservations</p>

	{#if reservations.length === 0}
		<div class="empty-state">
			<svg viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
			<p>No reservations</p>
		</div>
	{:else}
		{#each reservationsByDate as group}
			<div class="date-section">
				<h2 class="date-header">{group.date}</h2>
				<div class="reservations-list">
					{#each group.orders as reservation}
						<button class="reservation-card" onclick={() => selectReservation(reservation)}>
							<div class="reservation-header">
								<span class="reservation-time">{getTime(reservation.date)}</span>
								<span class="status-badge">Reserved</span>
								{#if reservation.table}
									<span class="table-badge">{reservation.table.label}</span>
								{/if}
							</div>
							{#if reservation.customer}
								<div class="reservation-customer">
									<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
									<span>{reservation.customer.name}</span>
									<span class="customer-phone">{reservation.customer.phone}</span>
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
{/if}

<style>
	h1 {
		margin: 1.25rem 0 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.detail-header h1 {
		margin: 0;
	}

	.status-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		color: #0ea5e9;
		background: #e0f2fe;
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

	.reservations-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reservation-card {
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

	.reservation-card:hover {
		border-color: #d0d0d0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.reservation-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.reservation-time {
		font-size: 0.9rem;
		color: #333;
		font-weight: 600;
	}

	.table-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		background: #f0eeff;
		color: #6c63ff;
		border-radius: 4px;
		margin-left: auto;
	}

	.reservation-customer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #555;
	}

	.reservation-customer svg {
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

	/* Detail View */
	.reservation-detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 4rem;
	}

	.reservation-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.reservation-date {
		font-size: 0.9rem;
		color: #888;
	}

	.reservation-table {
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
		background: #f9f9fb;
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

	.customer-info .customer-phone {
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
		margin: 0.5rem 0 0;
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

	.footer-bar {
		position: fixed;
		bottom: 0;
		left: 250px;
		right: 0;
		display: flex;
		align-items: center;
		background: #f0eeff;
		border-top: 1px solid #d8d4ff;
		padding: 0.5rem 1rem;
		padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
		z-index: 50;
	}

	@media (max-width: 768px) {
		.footer-bar { left: 0; }
	}

	.back-btn {
		width: 100%;
		padding: 0.6rem 1.2rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		color: #555;
		font-family: inherit;
		transition: background 0.15s;
	}

	.back-btn:hover {
		background: #f0f0f0;
	}
</style>
