<script lang="ts">
	import { employeesStore, customersStore, EMPLOYEE_ROLES, type Employee, type Customer } from '$lib/actions-store.svelte';
	import Popup from '$lib/components/Popup.svelte';

	type Tab = 'employees' | 'customers';
	let activeTab = $state<Tab>('employees');

	// Employee editing
	let editingEmployee = $state<Employee | null>(null);
	let addingEmployee = $state(false);
	let draftEmpName = $state('');
	let draftEmpRole = $state('');
	let draftEmpEmail = $state('');
	let draftEmpPhone = $state('');

	const canSaveEmployee = $derived(draftEmpName.trim() !== '' && draftEmpRole !== '');

	function startAddEmployee() {
		draftEmpName = '';
		draftEmpRole = '';
		draftEmpEmail = '';
		draftEmpPhone = '';
		addingEmployee = true;
	}

	function startEditEmployee(e: Employee) {
		editingEmployee = e;
		draftEmpName = e.name;
		draftEmpRole = e.role;
		draftEmpEmail = e.email;
		draftEmpPhone = e.phone;
	}

	function saveEmployee() {
		if (!canSaveEmployee) return;
		if (editingEmployee) {
			employeesStore.update(editingEmployee.id, {
				name: draftEmpName.trim(),
				role: draftEmpRole,
				email: draftEmpEmail.trim(),
				phone: draftEmpPhone.trim()
			});
			editingEmployee = null;
		}
	}

	let confirmDeleteEmployee = $state(false);

	function deleteEmployee() {
		if (editingEmployee) {
			employeesStore.remove(editingEmployee.id);
			editingEmployee = null;
			confirmDeleteEmployee = false;
		}
	}

	function addEmployee() {
		if (!canSaveEmployee) return;
		employeesStore.add({
			name: draftEmpName.trim(),
			role: draftEmpRole,
			email: draftEmpEmail.trim(),
			phone: draftEmpPhone.trim()
		});
		addingEmployee = false;
	}

	// Customer editing
	let editingCustomer = $state<Customer | null>(null);
	let addingCustomer = $state(false);
	let draftCustName = $state('');
	let draftCustPhone = $state('');

	const canSaveCustomer = $derived(draftCustName.trim() !== '');

	function startAddCustomer() {
		draftCustName = '';
		draftCustPhone = '';
		addingCustomer = true;
	}

	function startEditCustomer(c: Customer) {
		editingCustomer = c;
		draftCustName = c.name;
		draftCustPhone = c.phone;
	}

	function saveCustomer() {
		if (!canSaveCustomer) return;
		if (editingCustomer) {
			customersStore.update(editingCustomer.id, {
				name: draftCustName.trim(),
				phone: draftCustPhone.trim()
			});
			editingCustomer = null;
		}
	}

	let confirmDeleteCustomer = $state(false);

	function deleteCustomer() {
		if (editingCustomer) {
			customersStore.remove(editingCustomer.id);
			editingCustomer = null;
			confirmDeleteCustomer = false;
		}
	}

	function addCustomer() {
		if (!canSaveCustomer) return;
		customersStore.add({
			name: draftCustName.trim(),
			phone: draftCustPhone.trim()
		});
		addingCustomer = false;
	}
</script>

<h1>Users</h1>

<div class="tabs">
	<button class="tab" class:active={activeTab === 'employees'} onclick={() => (activeTab = 'employees')}>
		<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
		Employees
		<span class="tab-count">{employeesStore.items.length}</span>
	</button>
	<button class="tab" class:active={activeTab === 'customers'} onclick={() => (activeTab = 'customers')}>
		<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
		Customers
		<span class="tab-count">{customersStore.items.length}</span>
	</button>
</div>

{#if activeTab === 'employees'}
	<div class="section-header">
		<span class="section-title">Employees</span>
		<button class="btn-add" onclick={startAddEmployee}>+ Add Employee</button>
	</div>

	{#if employeesStore.items.length === 0}
		<div class="empty-state">
			<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
			<p>No employees yet</p>
			<button class="btn primary" onclick={startAddEmployee}>Add First Employee</button>
		</div>
	{:else}
		<ul class="user-list">
			{#each employeesStore.items as emp (emp.id)}
				<button class="user-item" onclick={() => startEditEmployee(emp)}>
					<div class="user-avatar">
						<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
					</div>
					<div class="user-info">
						<span class="user-name">{emp.name}</span>
						<span class="user-role">{emp.role}</span>
						<span class="user-contact">{emp.email}{emp.phone ? ` | ${emp.phone}` : ''}</span>
					</div>
					<svg class="user-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
				</button>
			{/each}
		</ul>
	{/if}

	<!-- Add Employee Modal -->
	<Popup open={addingEmployee} title="Add Employee" onclose={() => (addingEmployee = false)} fullscreen>
		<div class="form">
			<label class="field"><span>Name *</span>
				<input type="text" bind:value={draftEmpName} placeholder="Full name" />
			</label>
			<label class="field"><span>Role *</span>
				<select bind:value={draftEmpRole}>
					<option value="">Select role</option>
					{#each EMPLOYEE_ROLES as role}
						<option value={role}>{role}</option>
					{/each}
				</select>
			</label>
			<label class="field"><span>Email</span>
				<input type="email" bind:value={draftEmpEmail} placeholder="email@example.com" />
			</label>
			<label class="field"><span>Phone</span>
				<input type="tel" bind:value={draftEmpPhone} placeholder="Phone number" />
			</label>
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={addEmployee} disabled={!canSaveEmployee}>Add</button>
				<button class="btn secondary" onclick={() => (addingEmployee = false)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<!-- Edit Employee Modal -->
	<Popup open={editingEmployee !== null} title="Edit Employee" onclose={() => (editingEmployee = null)} fullscreen>
		<div class="form">
			<label class="field"><span>Name *</span>
				<input type="text" bind:value={draftEmpName} placeholder="Full name" />
			</label>
			<label class="field"><span>Role *</span>
				<select bind:value={draftEmpRole}>
					<option value="">Select role</option>
					{#each EMPLOYEE_ROLES as role}
						<option value={role}>{role}</option>
					{/each}
				</select>
			</label>
			<label class="field"><span>Email</span>
				<input type="email" bind:value={draftEmpEmail} placeholder="email@example.com" />
			</label>
			<label class="field"><span>Phone</span>
				<input type="tel" bind:value={draftEmpPhone} placeholder="Phone number" />
			</label>
			<button class="btn-delete" onclick={() => (confirmDeleteEmployee = true)}>
				<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
				Delete Employee
			</button>
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={saveEmployee} disabled={!canSaveEmployee}>Save</button>
				<button class="btn secondary" onclick={() => (editingEmployee = null)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<!-- Confirm Delete Employee Modal -->
	<Popup open={confirmDeleteEmployee} title="Delete Employee" onclose={() => (confirmDeleteEmployee = false)} wide>
		<p class="confirm-text">Are you sure you want to delete <strong>{editingEmployee?.name}</strong>? This action cannot be undone.</p>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn secondary" onclick={() => (confirmDeleteEmployee = false)}>Cancel</button>
				<button class="btn danger" onclick={deleteEmployee}>Delete</button>
			</div>
		{/snippet}
	</Popup>

{:else}
	<div class="section-header">
		<span class="section-title">Customers</span>
		<button class="btn-add" onclick={startAddCustomer}>+ Add Customer</button>
	</div>

	{#if customersStore.items.length === 0}
		<div class="empty-state">
			<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
			<p>No customers yet</p>
			<button class="btn primary" onclick={startAddCustomer}>Add First Customer</button>
		</div>
	{:else}
		<ul class="user-list">
			{#each customersStore.items as cust (cust.id)}
				<button class="user-item" onclick={() => startEditCustomer(cust)}>
					<div class="user-avatar customer">
						<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
					</div>
					<div class="user-info">
						<span class="user-name">{cust.name}</span>
						<span class="user-contact">{cust.phone || 'No phone'}</span>
					</div>
					<svg class="user-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
				</button>
			{/each}
		</ul>
	{/if}

	<!-- Add Customer Modal -->
	<Popup open={addingCustomer} title="Add Customer" onclose={() => (addingCustomer = false)} fullscreen>
		<div class="form">
			<label class="field"><span>Name *</span>
				<input type="text" bind:value={draftCustName} placeholder="Full name" />
			</label>
			<label class="field"><span>Phone</span>
				<input type="tel" bind:value={draftCustPhone} placeholder="Phone number" />
			</label>
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={addCustomer} disabled={!canSaveCustomer}>Add</button>
				<button class="btn secondary" onclick={() => (addingCustomer = false)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<!-- Edit Customer Modal -->
	<Popup open={editingCustomer !== null} title="Edit Customer" onclose={() => (editingCustomer = null)} fullscreen>
		<div class="form">
			<label class="field"><span>Name *</span>
				<input type="text" bind:value={draftCustName} placeholder="Full name" />
			</label>
			<label class="field"><span>Phone</span>
				<input type="tel" bind:value={draftCustPhone} placeholder="Phone number" />
			</label>
			<button class="btn-delete" onclick={() => (confirmDeleteCustomer = true)}>
				<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
				Delete Customer
			</button>
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={saveCustomer} disabled={!canSaveCustomer}>Save</button>
				<button class="btn secondary" onclick={() => (editingCustomer = null)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<!-- Confirm Delete Customer Modal -->
	<Popup open={confirmDeleteCustomer} title="Delete Customer" onclose={() => (confirmDeleteCustomer = false)} wide>
		<p class="confirm-text">Are you sure you want to delete <strong>{editingCustomer?.name}</strong>? This action cannot be undone.</p>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn secondary" onclick={() => (confirmDeleteCustomer = false)}>Cancel</button>
				<button class="btn danger" onclick={deleteCustomer}>Delete</button>
			</div>
		{/snippet}
	</Popup>
{/if}

<style>
	h1 { margin: 1rem 0 1.25rem; }

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #e0e0e0;
		padding-bottom: 0.5rem;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		background: none;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		color: #666;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		font-family: inherit;
	}

	.tab:hover { background: #f0f0f0; }

	.tab.active {
		background: #f0eeff;
		color: #6c63ff;
	}

	.tab svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.tab-count {
		font-size: 0.75rem;
		font-weight: 600;
		background: #e0e0e0;
		padding: 0.15rem 0.4rem;
		border-radius: 10px;
	}

	.tab.active .tab-count {
		background: #6c63ff;
		color: #fff;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.btn-add {
		padding: 0.4rem 0.75rem;
		background: #6c63ff;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-add:hover { background: #5a52d5; }

	.user-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 600px;
	}

	.user-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 10px;
		width: 100%;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.user-item:hover {
		border-color: #6c63ff;
		box-shadow: 0 2px 8px rgba(108, 99, 255, 0.15);
	}

	.user-avatar {
		width: 2.5rem;
		height: 2.5rem;
		background: #f0eeff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-avatar.customer {
		background: #e8f5e9;
	}

	.user-avatar svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.user-avatar.customer svg {
		stroke: #4caf50;
	}

	.user-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.95rem;
		color: #222;
	}

	.user-role {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6c63ff;
		background: #f0eeff;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		width: fit-content;
	}

	.user-contact {
		font-size: 0.8rem;
		color: #888;
	}

	.user-arrow {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: #ccc;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}

	.user-item:hover .user-arrow {
		stroke: #6c63ff;
	}

	.btn-delete {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		margin-top: 1rem;
		background: none;
		border: 1px solid #e74c3c;
		border-radius: 8px;
		color: #e74c3c;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s, color 0.15s;
	}

	.btn-delete:hover {
		background: #e74c3c;
		color: #fff;
	}

	.btn-delete svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
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
		opacity: 0.5;
		margin-bottom: 0.75rem;
	}

	.empty-state p {
		margin: 0 0 1rem;
		font-size: 0.95rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field span {
		font-size: 0.8rem;
		font-weight: 600;
		color: #555;
	}

	.field input, .field select {
		padding: 0.55rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.field select {
		background: #fff;
		cursor: pointer;
	}

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
		font-family: inherit;
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
		font-family: inherit;
	}

	.btn.secondary:hover { background: #f0f0f0; }

	.btn.danger {
		padding: 0.55rem 1.2rem;
		background: #e74c3c;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
	}

	.btn.danger:hover { background: #c0392b; }

	.confirm-text {
		text-align: center;
		color: #555;
		font-size: 0.95rem;
		margin: 1rem 0;
		line-height: 1.5;
	}

	.confirm-text strong {
		color: #222;
	}
</style>
