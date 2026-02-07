<script lang="ts">
	import { branchStore, tablesStore } from '$lib/actions-store.svelte';
	import { getBranchData } from '$lib/test-data/branch-data';
	import Popup from '$lib/components/Popup.svelte';

	interface Reservation {
		id: number;
		date: string;
		partySize: number;
		customer: { name: string; phone: string };
		table?: { id: number; label: string };
		notes?: string;
	}

	const baseReservations = $derived<Reservation[]>(getBranchData(branchStore.id).reservations as Reservation[]);

	// Local state for new reservations added during session
	let addedReservations = $state<Reservation[]>([]);

	const reservations = $derived([...baseReservations, ...addedReservations]);

	// Group reservations by date
	const reservationsByDate = $derived.by(() => {
		const groups: { date: string; items: Reservation[] }[] = [];
		const dateMap = new Map<string, Reservation[]>();

		for (const res of reservations) {
			const datePart = res.date.split(',')[0];
			if (!dateMap.has(datePart)) {
				dateMap.set(datePart, []);
			}
			dateMap.get(datePart)!.push(res);
		}

		for (const [date, items] of dateMap) {
			groups.push({ date, items });
		}

		return groups;
	});

	function getTime(dateStr: string): string {
		const parts = dateStr.split(', ');
		return parts[1] || '';
	}

	let selectedReservation = $state<Reservation | null>(null);

	function selectReservation(res: Reservation) {
		selectedReservation = res;
	}

	function goBack() {
		selectedReservation = null;
	}

	// New reservation modal
	let createOpen = $state(false);
	let newName = $state('');
	let newPhone = $state('');
	let newDate = $state('');
	let newTime = $state('');
	let newPartySize = $state(2);
	let newTableId = $state<number | null>(null);
	let newNotes = $state('');

	function openCreate() {
		newName = '';
		newPhone = '';
		newDate = '';
		newTime = '';
		newPartySize = 2;
		newTableId = null;
		newNotes = '';
		createOpen = true;
	}

	function createReservation() {
		if (!newName.trim() || !newDate || !newTime) return;

		const dateStr = `${newDate.replace(/-/g, '/')}, ${formatTime(newTime)}`;
		const table = newTableId ? tablesStore.items.find(t => t.id === newTableId) : null;

		const newRes: Reservation = {
			id: Date.now(),
			date: dateStr,
			partySize: newPartySize,
			customer: { name: newName.trim(), phone: newPhone.trim() },
			table: table ? { id: table.id, label: table.label } : undefined,
			notes: newNotes.trim() || undefined
		};

		addedReservations = [...addedReservations, newRes];
		createOpen = false;
	}

	function formatTime(time24: string): string {
		const [h, m] = time24.split(':').map(Number);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hour = h % 12 || 12;
		return `${hour}:${m.toString().padStart(2, '0')}:00 ${ampm}`;
	}

	const canCreate = $derived(newName.trim() !== '' && newDate !== '' && newTime !== '');
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

		<div class="customer-info">
			<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
			<span>{selectedReservation.customer.name}</span>
			{#if selectedReservation.customer.phone}
				<span class="customer-phone">{selectedReservation.customer.phone}</span>
			{/if}
		</div>

		<div class="info-row">
			<span class="info-label">Party Size</span>
			<span class="info-value">{selectedReservation.partySize} guests</span>
		</div>

		{#if selectedReservation.notes}
			<div class="info-row">
				<span class="info-label">Notes</span>
				<span class="info-value">{selectedReservation.notes}</span>
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
					{#each group.items as reservation}
						<button class="reservation-card" onclick={() => selectReservation(reservation)}>
							<div class="reservation-header">
								<span class="reservation-time">{getTime(reservation.date)}</span>
								<span class="party-badge">{reservation.partySize} guests</span>
								{#if reservation.table}
									<span class="table-badge">{reservation.table.label}</span>
								{/if}
							</div>
							<div class="reservation-customer">
								<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
								<span>{reservation.customer.name}</span>
								<span class="customer-phone">{reservation.customer.phone}</span>
							</div>
							{#if reservation.notes}
								<div class="reservation-notes">{reservation.notes}</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	{/if}

	<!-- FAB for creating new reservation -->
	<button class="fab" onclick={openCreate} aria-label="Create new reservation">
		<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
	</button>
{/if}

<!-- Create Reservation Modal -->
<Popup open={createOpen} title="New Reservation" onclose={() => (createOpen = false)} fullscreen>
	<div class="create-form">
		<label class="field">
			<span>Customer Name *</span>
			<input type="text" bind:value={newName} placeholder="Enter name" />
		</label>
		<label class="field">
			<span>Phone</span>
			<input type="tel" bind:value={newPhone} placeholder="Enter phone number" />
		</label>
		<div class="field-row">
			<label class="field">
				<span>Date *</span>
				<input type="date" bind:value={newDate} />
			</label>
			<label class="field">
				<span>Time *</span>
				<input type="time" bind:value={newTime} />
			</label>
		</div>
		<label class="field">
			<span>Party Size</span>
			<input type="number" min="1" bind:value={newPartySize} />
		</label>
		<label class="field">
			<span>Table</span>
			<select bind:value={newTableId}>
				<option value={null}>No table assigned</option>
				{#each tablesStore.items as table}
					<option value={table.id}>{table.label} ({table.seats} seats)</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span>Notes</span>
			<textarea bind:value={newNotes} placeholder="Special requests, occasion, etc."></textarea>
		</label>
	</div>
	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={() => (createOpen = false)}>Cancel</button>
			<button class="btn primary" onclick={createReservation} disabled={!canCreate}>Create</button>
		</div>
	{/snippet}
</Popup>

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

	/* Info rows */
	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: #f9f9fb;
		border-radius: 8px;
	}

	.info-label {
		font-size: 0.85rem;
		color: #888;
	}

	.info-value {
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
	}

	.party-badge {
		font-size: 0.75rem;
		font-weight: 500;
		color: #666;
		background: #f0f0f0;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
	}

	.reservation-notes {
		font-size: 0.8rem;
		color: #888;
		font-style: italic;
	}

	/* FAB */
	.fab {
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

	.fab:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 16px rgba(108, 99, 255, 0.5);
	}

	.fab svg {
		width: 1.5rem;
		height: 1.5rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Create form */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.field span {
		font-size: 0.8rem;
		font-weight: 600;
		color: #555;
	}

	.field input,
	.field select,
	.field textarea {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.field textarea {
		min-height: 80px;
		resize: vertical;
	}

	.field select {
		background: #fff;
		cursor: pointer;
	}

	.field-row {
		display: flex;
		gap: 0.75rem;
	}

	.field-row .field {
		flex: 1;
	}

	.footer-buttons {
		display: flex;
		width: 100%;
		gap: 0.5rem;
	}

	.footer-buttons .btn {
		flex: 1;
		padding: 0.55rem 1.2rem;
		border-radius: 6px;
		font-size: 1.1rem;
		cursor: pointer;
		font-family: inherit;
	}

	.btn.primary {
		background: #6c63ff;
		color: #fff;
		border: none;
	}

	.btn.primary:hover:not(:disabled) {
		background: #5a52d5;
	}

	.btn.primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn.secondary {
		background: none;
		border: 1px solid #ccc;
		color: #555;
	}

	.btn.secondary:hover {
		background: #f0f0f0;
	}
</style>
