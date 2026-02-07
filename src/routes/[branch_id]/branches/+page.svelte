<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { branchStore, actionsStore, pageStore, hoursStore, tablesStore, menuDisplayStore, menuStore, menuSettingsStore, ACTION_TYPES, TABLE_SHAPES, LANGUAGES, CURRENCIES, tableShapeLabel, type ActionType, type BusinessDay, type TableItem, type MenuDisplayMode, type Employee } from '$lib/actions-store.svelte';
	import { getAvailableBranches, getBranchInfo, getBranchData } from '$lib/test-data/branch-data';
	import { auth } from '$lib/auth.svelte';
	import ActionGrid from '$lib/components/ActionGrid.svelte';
	import BusinessHours from '$lib/components/BusinessHours.svelte';
	import Popup from '$lib/components/Popup.svelte';

	const branches = getAvailableBranches();

	// Get all employees across all branches for manager sign-in
	function getAllEmployees(): Employee[] {
		const all: Employee[] = [];
		for (const b of branches) {
			all.push(...getBranchData(b.id).employees);
		}
		return all;
	}

	// Track if we're doing a branch switch (should go to select view)
	let pendingSelect = $state(false);

	// Reset view when navigating to this page
	afterNavigate(() => {
		if (pendingSelect) {
			view = 'select';
			pendingSelect = false;
		} else {
			view = 'list';
		}
	});

	// Employee sign-in (checks for manager role)
	const EMP_KEY = 'employee-auth';

	interface EmpAuth { location: string; username: string; }

	function loadEmpAuth(): EmpAuth | null {
		if (typeof sessionStorage === 'undefined') return null;
		const raw = sessionStorage.getItem(EMP_KEY);
		if (!raw) return null;
		try { return JSON.parse(raw); } catch { return null; }
	}

	let empAuth = $state<EmpAuth | null>(loadEmpAuth());
	let loginLocation = $state('');
	let loginUsername = $state('');
	let loginPassword = $state('');
	let loginError = $state('');

	// Restore auth state on load if empAuth exists
	if (empAuth) {
		const allEmps = getAllEmployees();
		const employee = allEmps.find(
			e => e.email.toLowerCase() === empAuth.username.toLowerCase()
		);
		if (employee?.role === 'Manager') {
			auth.signIn(employee.name, true);
		}
	}

	function signIn() {
		if (!loginLocation.trim() || !loginUsername.trim() || !loginPassword.trim()) {
			loginError = 'All fields are required.';
			return;
		}
		// Check if email matches an employee with Manager role (across all branches)
		const allEmps = getAllEmployees();
		const employee = allEmps.find(
			e => e.email.toLowerCase() === loginUsername.trim().toLowerCase()
		);
		if (!employee) {
			loginError = 'Employee not found.';
			return;
		}
		if (employee.role !== 'Manager') {
			loginError = 'Only managers can access branch settings.';
			return;
		}
		const empData: EmpAuth = { location: loginLocation.trim(), username: loginUsername.trim() };
		sessionStorage.setItem(EMP_KEY, JSON.stringify(empData));
		empAuth = empData;
		auth.signIn(employee.name, true);
		loginError = '';
	}

	function signOut() {
		sessionStorage.removeItem(EMP_KEY);
		empAuth = null;
		auth.signOut();
		loginLocation = '';
		loginUsername = '';
		loginPassword = '';
	}

	// View management
	type View = 'list' | 'select' | 'home' | 'menu' | 'tables';
	let view = $state<View>('list');

	const selectedBranchName = $derived(getBranchInfo(branchStore.id).name);

	function selectBranch(branchId: string) {
		// Navigate to the new branch's URL so the layout effect syncs correctly
		pendingSelect = true;
		goto(`${base}/${branchId}/branches`);
	}

	function goBack() {
		if (view === 'select') {
			view = 'list';
		} else {
			view = 'select';
		}
	}

	// Table editing
	let editingTable = $state<TableItem | null>(null);
	let draftTableLabel = $state('');
	let draftTableSeats = $state(2);
	let draftTableShape = $state<number>(-1);
	let addingTable = $state(false);

	function startEditTable(t: TableItem) {
		editingTable = t;
		draftTableLabel = t.label;
		draftTableSeats = t.seats;
		draftTableShape = t.shape;
	}

	function saveTable() {
		if (!editingTable || !canSaveTable) return;
		tablesStore.update(editingTable.id, { label: draftTableLabel.trim(), seats: draftTableSeats, shape: draftTableShape });
		editingTable = null;
	}

	const canSaveTable = $derived(draftTableLabel.trim() !== '' && draftTableSeats >= 1 && draftTableShape >= 0);

	function startAddTable() {
		draftTableLabel = '';
		draftTableSeats = 2;
		draftTableShape = -1;
		addingTable = true;
	}

	function addTable() {
		if (!canSaveTable) return;
		tablesStore.add({ label: draftTableLabel.trim(), seats: draftTableSeats, shape: draftTableShape });
		addingTable = false;
	}

	let confirmDeleteTable = $state(false);

	function deleteTable() {
		if (editingTable) {
			tablesStore.remove(editingTable.id);
			editingTable = null;
			confirmDeleteTable = false;
		}
	}

	let columns = $state(4);

	// Menu import/export
	let fileInput = $state<HTMLInputElement | null>(null);

	function exportMenuToExcel() {
		const items = menuStore.items;
		const header = 'Name\tDescription\tPrice\tCategory';
		const rows = items.map(i => `${i.name}\t${i.description}\t${i.price}\t${i.category}`);
		const tsv = [header, ...rows].join('\n');
		const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'menu.tsv';
		a.click();
		URL.revokeObjectURL(url);
	}

	function importMenuFromFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			const lines = text.trim().split('\n');
			if (lines.length < 2) return;
			const sep = lines[0].includes('\t') ? '\t' : ',';
			const imported = lines.slice(1).map((line, i) => {
				const cols = line.split(sep).map(c => c.trim());
				return { id: i + 1, name: cols[0] || '', description: cols[1] || '', price: cols[2] || '0', category: cols[3] || 'Other' };
			}).filter(item => item.name);
			if (imported.length > 0) menuStore.items = imported;
		};
		reader.readAsText(file);
		if (fileInput) fileInput.value = '';
	}

	// Page editing
	let editingPage = $state(false);
	let draftTitle = $state('');
	let draftDesc = $state('');

	function startEditPage() {
		draftTitle = pageStore.title;
		draftDesc = pageStore.description;
		editingPage = true;
	}

	function savePage() {
		pageStore.title = draftTitle;
		pageStore.description = draftDesc;
		editingPage = false;
	}

	let editOpen = $state(false);

	const typeEntries = Object.entries(ACTION_TYPES) as [ActionType, typeof ACTION_TYPES[ActionType]][];

	interface Draft { checked: boolean; label: string; value: string; existingId?: number; }
	let drafts = $state<Record<ActionType, Draft>>({
		phone: { checked: false, label: '', value: '' },
		navigation: { checked: false, label: '', value: '' },
		link: { checked: false, label: '', value: '' },
		social: { checked: false, label: '', value: '' }
	});

	function openEditActions() {
		const fresh: Record<ActionType, Draft> = {
			phone: { checked: false, label: ACTION_TYPES.phone.label, value: '' },
			navigation: { checked: false, label: ACTION_TYPES.navigation.label, value: '' },
			link: { checked: false, label: ACTION_TYPES.link.label, value: '' },
			social: { checked: false, label: ACTION_TYPES.social.label, value: '' }
		};
		for (const action of actionsStore.items) {
			if (action.type in fresh) {
				fresh[action.type] = { checked: true, label: action.label, value: action.value, existingId: action.id };
			}
		}
		drafts = fresh;
		editOpen = true;
	}

	// Business hours editing
	let editHoursOpen = $state(false);
	let draftHours = $state<BusinessDay[]>([]);

	function openEditHours() {
		draftHours = hoursStore.items.map(d => ({ ...d }));
		editHoursOpen = true;
	}

	function saveHours() {
		hoursStore.items = draftHours;
		editHoursOpen = false;
	}

	function saveActions() {
		for (const [type, draft] of Object.entries(drafts) as [ActionType, Draft][]) {
			if (draft.checked && draft.label.trim()) {
				if (draft.existingId != null) {
					actionsStore.update(draft.existingId, { label: draft.label, value: draft.value });
				} else {
					actionsStore.add(type, draft.label, draft.value);
				}
			} else if (!draft.checked && draft.existingId != null) {
				actionsStore.remove(draft.existingId);
			}
		}
		editOpen = false;
	}
</script>

{#if !empAuth}
	<div class="sign-in-wrapper">
		<div class="sign-in-card">
			<div class="sign-in-icon">
				<svg viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
			</div>
			<h2 class="sign-in-title">Manager Sign In</h2>
			<p class="access-message">Sign in with your manager credentials to edit branches.</p>
			<div class="sign-in-form">
				<label class="field"><span>Location Name</span>
					<input type="text" bind:value={loginLocation} placeholder="e.g. Downtown Branch" />
				</label>
				<label class="field"><span>Email</span>
					<input type="email" bind:value={loginUsername} placeholder="Your employee email" />
				</label>
				<label class="field"><span>Password</span>
					<input type="password" bind:value={loginPassword} placeholder="Enter password"
						onkeydown={(e) => { if (e.key === 'Enter') signIn(); }} />
				</label>
				{#if loginError}
					<p class="login-error">{loginError}</p>
				{/if}
				<button class="btn primary sign-in-btn" onclick={signIn}>Sign In</button>
			</div>
		</div>
	</div>
{:else}

<div class="branches-content">
{#if view === 'list'}
	<h1>My Branches</h1>
	<p class="subtitle">Select a branch to manage</p>

	<div class="branch-list">
		{#each branches as branch}
			<button
				class="branch-card"
				class:active={branchStore.id === branch.id}
				onclick={() => selectBranch(branch.id)}
			>
				<div class="branch-icon">
					<svg viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
				</div>
				<div class="branch-info">
					<span class="branch-name">{branch.name}</span>
					{#if branchStore.id === branch.id}
						<span class="branch-badge">Current</span>
					{/if}
				</div>
				<svg class="branch-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
			</button>
		{/each}
	</div>

{:else if view === 'select'}
	<div class="select-wrapper">
		<h2 class="select-title">Editing: {selectedBranchName}</h2>
		<div class="select-buttons">
			<button class="select-btn" onclick={() => (view = 'home')}>
				<svg viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
				<span>Edit Home Page</span>
			</button>
			<button class="select-btn" onclick={() => (view = 'menu')}>
				<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
				<span>Edit Menu</span>
			</button>
			<button class="select-btn" onclick={() => (view = 'tables')}>
				<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 16v4M17 16v4" /></svg>
				<span>Edit Tables</span>
			</button>
		</div>
	</div>
{:else if view === 'home'}
	<h2>Edit Home Page</h2>
	<p class="editing-branch">{selectedBranchName}</p>
	<div class="title-row">
		<h3>{pageStore.title}</h3>
		<button class="btn-edit" onclick={startEditPage} aria-label="Edit title and description">
			<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
		</button>
	</div>
	<p>{pageStore.description}</p>

	<Popup open={editingPage} title="Edit Page" onclose={() => (editingPage = false)} fullscreen>
		<div class="popup-form">
			<label class="field"><span>Title</span>
				<input type="text" bind:value={draftTitle} />
			</label>
			<label class="field"><span>Description</span>
				<textarea bind:value={draftDesc}></textarea>
			</label>
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={savePage}>Save</button>
				<button class="btn secondary" onclick={() => (editingPage = false)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<div class="grid-header">
		<span class="grid-label">Quick Actions</span>
		<button class="btn-edit" onclick={openEditActions} aria-label="Edit actions">
			<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
		</button>
	</div>

	<ActionGrid items={actionsStore.items} {columns} />

	<div class="grid-header">
		<span class="grid-label">Business Hours</span>
		<button class="btn-edit" onclick={openEditHours} aria-label="Edit business hours">
			<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
		</button>
	</div>

	<BusinessHours items={hoursStore.items} />

	<Popup open={editHoursOpen} title="Edit Business Hours" onclose={() => (editHoursOpen = false)} fullscreen>
		<ul class="type-list">
			{#each draftHours as day, i}
				<li class="type-item">
					<label class="type-check">
						<input type="checkbox" checked={!day.closed} onchange={() => { draftHours[i].closed = !draftHours[i].closed; }} />
						<span class="type-label">{day.day}</span>
					</label>
					{#if !day.closed}
						<div class="type-fields hours-fields">
							<label class="field"><span>Open</span>
								<input type="time" bind:value={draftHours[i].open} />
							</label>
							<label class="field"><span>Close</span>
								<input type="time" bind:value={draftHours[i].close} />
							</label>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={saveHours}>Save</button>
				<button class="btn secondary" onclick={() => (editHoursOpen = false)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<Popup open={editOpen} title="Edit Actions" onclose={() => (editOpen = false)} fullscreen>
		<ul class="type-list">
			{#each typeEntries as [type, def]}
				<li class="type-item">
					<label class="type-check">
						<input type="checkbox" bind:checked={drafts[type].checked} />
						<span class="type-label">{def.label}</span>
						<svg viewBox="0 0 24 24" class="type-icon">{@html def.icon}</svg>
					</label>
					{#if drafts[type].checked}
						<div class="type-fields">
							<label class="field"><span>Label</span>
								<input type="text" bind:value={drafts[type].label} placeholder={def.label} />
							</label>
							<label class="field"><span>{def.inputLabel}</span>
								<input type={def.inputType} bind:value={drafts[type].value} placeholder={def.placeholder} />
							</label>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={saveActions}>Save</button>
				<button class="btn secondary" onclick={() => (editOpen = false)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

{:else if view === 'menu'}
	<h2>Edit Menu</h2>
	<p class="editing-branch">{selectedBranchName}</p>

	<div class="menu-edit-section">
		<span class="section-label">Menu Data</span>
		<div class="menu-edit-buttons">
			<button class="menu-edit-btn" onclick={exportMenuToExcel}>
				<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
				Export Menu to Excel
			</button>
			<button class="menu-edit-btn" onclick={() => fileInput?.click()}>
				<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
				Import Excel Menu
			</button>
			<input type="file" accept=".csv,.tsv,.txt" bind:this={fileInput} onchange={importMenuFromFile} hidden />
		</div>
	</div>

	<div class="menu-edit-section">
		<span class="section-label">Available Menus</span>
		<p class="section-hint">Select which menus to show on the Menu page</p>
		{#if menuStore.menus.length === 0}
			<p class="no-menus">No menus found.</p>
		{:else}
			<ul class="menu-list">
				{#each menuStore.menus as menu (menu.id)}
					<li class="menu-item">
						<label class="menu-check">
							<input
								type="checkbox"
								checked={menuStore.enabledMenus.includes(menu.id)}
								disabled={menuStore.enabledMenus.includes(menu.id) && menuStore.enabledMenus.length === 1}
								onchange={() => menuStore.toggleMenu(menu.id)}
							/>
							<span class="menu-name">{menu.name}</span>
							<span class="menu-count">{menu.items.length} items</span>
						</label>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="menu-edit-section">
		<span class="section-label">Region Settings</span>
		<div class="region-fields">
			<label class="field">
				<span>Language</span>
				<select value={menuSettingsStore.language} onchange={(e) => (menuSettingsStore.language = (e.target as HTMLSelectElement).value)}>
					{#each LANGUAGES as lang}
						<option value={lang.code}>{lang.name}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Currency</span>
				<select value={menuSettingsStore.currency} onchange={(e) => (menuSettingsStore.currency = (e.target as HTMLSelectElement).value)}>
					{#each CURRENCIES as c}
						<option value={c.code}>{c.symbol} {c.name}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>

	<div class="menu-edit-section">
		<span class="section-label">Display Mode</span>
		<div class="radio-list">
			{#each ['list', 'grid', 'both'] as mode}
				<label class="radio-option">
					<input type="radio" name="displayMode" value={mode} checked={menuDisplayStore.mode === mode} onchange={() => (menuDisplayStore.mode = mode as MenuDisplayMode)} />
					<span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
				</label>
			{/each}
		</div>
	</div>

	<div class="menu-edit-section">
		<span class="section-label">Checkout Options</span>
		<label class="checkbox-option">
			<input type="checkbox" checked={menuSettingsStore.requireTable} onchange={(e) => (menuSettingsStore.requireTable = (e.target as HTMLInputElement).checked)} />
			<span>Require table selection before checkout</span>
		</label>
	</div>

{:else if view === 'tables'}
	<h2>Edit Tables</h2>
	<p class="editing-branch">{selectedBranchName}</p>
	<div class="grid-header">
		<span class="grid-label">Tables</span>
		<button class="btn-add" onclick={startAddTable}>+ Add Table</button>
	</div>

	<ul class="table-list">
		{#each tablesStore.items as t (t.id)}
			<button class="table-item" onclick={() => startEditTable(t)}>
				<div class="table-item-info">
					<span class="table-item-label">{t.label}</span>
					<span class="table-item-seats">{t.seats} seat{t.seats !== 1 ? 's' : ''}</span>
				</div>
				<span class="table-item-shape">{tableShapeLabel(t.shape)}</span>
				<svg class="table-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
			</button>
		{/each}
	</ul>

	<Popup open={editingTable !== null} title="Edit Table" onclose={() => (editingTable = null)} fullscreen>
		<div class="popup-form-inline">
			<label class="field"><span>Label</span>
				<input type="text" bind:value={draftTableLabel} />
			</label>
			<label class="field"><span>Seats</span>
				<input type="number" min="1" bind:value={draftTableSeats} />
			</label>
			<div class="field"><span>Shape</span>
				<div class="shape-picker">
					{#each TABLE_SHAPES as s}
						<button
							class="shape-option"
							class:active={draftTableShape === s.value}
							onclick={() => (draftTableShape = s.value)}
						>
							<span class="shape-icon shape-{s.css}"></span>
							<span>{s.label}</span>
						</button>
					{/each}
				</div>
			</div>
			<button class="btn-delete-full" onclick={() => (confirmDeleteTable = true)}>
				<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
				Delete Table
			</button>
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={saveTable} disabled={!canSaveTable}>Save</button>
				<button class="btn secondary" onclick={() => (editingTable = null)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<!-- Confirm Delete Table Modal -->
	<Popup open={confirmDeleteTable} title="Delete Table" onclose={() => (confirmDeleteTable = false)} wide>
		<p class="confirm-text">Are you sure you want to delete <strong>{editingTable?.label}</strong>? This action cannot be undone.</p>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn secondary" onclick={() => (confirmDeleteTable = false)}>Cancel</button>
				<button class="btn danger" onclick={deleteTable}>Delete</button>
			</div>
		{/snippet}
	</Popup>

	<Popup open={addingTable} title="Add Table" onclose={() => (addingTable = false)} fullscreen>
		<div class="popup-form-inline">
			<label class="field"><span>Label</span>
				<input type="text" bind:value={draftTableLabel} placeholder="e.g. Table 9" />
			</label>
			<label class="field"><span>Seats</span>
				<input type="number" min="1" bind:value={draftTableSeats} />
			</label>
			<div class="field"><span>Shape</span>
				<div class="shape-picker">
					{#each TABLE_SHAPES as s}
						<button
							class="shape-option"
							class:active={draftTableShape === s.value}
							onclick={() => (draftTableShape = s.value)}
						>
							<span class="shape-icon shape-{s.css}"></span>
							<span>{s.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={addTable} disabled={!canSaveTable}>Add</button>
				<button class="btn secondary" onclick={() => (addingTable = false)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

{/if}
</div>

	<div class="emp-bar">
		{#if view === 'list'}
			<span class="emp-info">{empAuth.username} @ {empAuth.location}</span>
			<button class="btn-signout" onclick={signOut}>Sign Out</button>
		{:else}
			<button class="btn secondary back-footer-btn" onclick={goBack}>
				{view === 'select' ? 'Back to Branches' : 'Back'}
			</button>
		{/if}
	</div>
{/if}

<style>
	.branches-content {
		padding-bottom: 4rem;
	}

	.sign-in-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}

	.sign-in-card {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		padding: 2rem 1.5rem;
		width: 100%;
		max-width: 360px;
		text-align: center;
	}

	.sign-in-icon svg {
		width: 2.5rem;
		height: 2.5rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.sign-in-title {
		margin: 0.5rem 0 1rem;
		font-size: 1.15rem;
		font-weight: 600;
		color: #333;
	}

	.access-message {
		font-size: 0.9rem;
		color: #666;
		margin: 0 0 1.25rem;
		line-height: 1.5;
	}

	.sign-in-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		text-align: left;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.field span { font-size: 0.8rem; font-weight: 600; color: #555; }

	.field input, .field textarea {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
	}

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

	.sign-in-btn {
		margin-top: 0.25rem;
		width: 100%;
	}

	.login-error {
		margin: 0;
		font-size: 0.8rem;
		color: #e53935;
		text-align: center;
	}

	h1 {
		margin: 1rem 0 0.25rem;
	}

	h2 {
		margin: 0.5rem 0 0;
	}

	h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.editing-branch {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0.25rem 0 1rem;
		padding: 0.25rem 0.6rem;
		background: #f0eeff;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #6c63ff;
	}

	.subtitle {
		color: #888;
		font-size: 0.9rem;
		margin: 0 0 1.5rem;
	}

	.branch-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 500px;
	}

	.branch-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 10px;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.branch-card:hover {
		border-color: #6c63ff;
		box-shadow: 0 2px 8px rgba(108, 99, 255, 0.15);
	}

	.branch-card.active {
		border-color: #6c63ff;
		background: #f8f7ff;
	}

	.branch-icon {
		width: 2.5rem;
		height: 2.5rem;
		background: #f0eeff;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.branch-icon svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.branch-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.branch-name {
		font-size: 1rem;
		font-weight: 600;
		color: #333;
	}

	.branch-badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		color: #6c63ff;
		background: #f0eeff;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		width: fit-content;
	}

	.branch-arrow {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: #ccc;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.branch-card:hover .branch-arrow {
		stroke: #6c63ff;
	}

	.emp-bar {
		position: fixed;
		bottom: 0;
		left: 250px;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f0eeff;
		border-top: 1px solid #d8d4ff;
		padding: 0.5rem 1rem;
		z-index: 50;
	}

	@media (max-width: 768px) {
		.emp-bar { left: 0; }
	}

	.emp-info {
		font-size: 0.85rem;
		font-weight: 500;
		color: #5a52d5;
	}

	.btn-signout {
		background: none;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.8rem;
		padding: 0.3rem 0.75rem;
		cursor: pointer;
		color: #555;
		font-family: inherit;
	}

	.btn-signout:hover { background: #f0f0f0; }

	.back-footer-btn {
		width: 100%;
	}

	/* Edit options */
	.select-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 2rem;
	}

	.select-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		margin: 0 0 1.5rem;
	}

	.select-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		width: 100%;
		max-width: 550px;
	}

	@media (max-width: 768px) {
		.select-buttons {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
	}

	.select-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.select-btn:hover {
		border-color: #6c63ff;
		box-shadow: 0 2px 8px rgba(108, 99, 255, 0.15);
	}

	.select-btn svg {
		width: 2rem;
		height: 2rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.select-btn span {
		font-size: 0.9rem;
		font-weight: 600;
		color: #333;
	}

	/* Home editing */
	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-edit {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: none;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		color: #888;
		transition: color 0.15s, border-color 0.15s;
	}

	.btn-edit:hover { color: #6c63ff; border-color: #6c63ff; }
	.btn-edit svg { width: 0.9rem; height: 0.9rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

	.grid-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		max-width: 500px;
	}

	.grid-label {
		font-weight: 600;
		font-size: 1rem;
	}

	.popup-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
	}

	.popup-form .field:last-child {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.popup-form textarea {
		resize: none;
		flex: 1;
	}

	.footer-buttons {
		display: flex;
		width: 100%;
		gap: 0.5rem;
	}

	.footer-buttons .btn { flex: 1; }

	.hours-fields {
		flex-direction: row;
		gap: 0.75rem;
	}

	.hours-fields .field { flex: 1; }

	.type-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.type-item {
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
	}

	.type-check {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		cursor: pointer;
	}

	.type-check .type-icon { margin-left: auto; }

	.type-check input[type="checkbox"] {
		width: 1.1rem;
		height: 1.1rem;
		accent-color: #6c63ff;
		flex-shrink: 0;
	}

	.type-icon {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}

	.type-label {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.type-fields {
		padding: 0 1rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-top: 1px solid #f0f0f0;
		padding-top: 0.75rem;
		margin-top: -0.25rem;
	}

	/* Tables editing */
	.btn-add {
		padding: 0.35rem 0.75rem;
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

	.table-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 500px;
	}

	.table-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		width: 100%;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.table-item:hover {
		border-color: #6c63ff;
		box-shadow: 0 2px 8px rgba(108, 99, 255, 0.15);
	}

	.table-arrow {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: #ccc;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}

	.table-item:hover .table-arrow {
		stroke: #6c63ff;
	}

	.table-item-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.table-item-label {
		font-weight: 600;
		font-size: 0.9rem;
		color: #222;
	}

	.table-item-seats {
		font-size: 0.75rem;
		color: #999;
	}

	.btn-delete {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: none;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		color: #ccc;
		transition: color 0.15s, border-color 0.15s;
	}

	.btn-delete:hover { color: #e74c3c; border-color: #e74c3c; }
	.btn-delete svg { width: 0.9rem; height: 0.9rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

	.btn-delete-full {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		margin-top: 0.5rem;
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

	.btn-delete-full:hover {
		background: #e74c3c;
		color: #fff;
	}

	.btn-delete-full svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.popup-form-inline {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.table-item-shape {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #6c63ff;
		background: #f0eeff;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		flex-shrink: 0;
		margin-right: 10px;
	}

	.shape-picker {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.shape-option {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fff;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.85rem;
		color: #666;
		transition: border-color 0.15s, background 0.15s;
	}

	.shape-option:hover { border-color: #6c63ff; }

	.shape-option.active {
		border-color: #6c63ff;
		background: #f0eeff;
		color: #6c63ff;
		font-weight: 600;
	}

	.shape-icon {
		display: block;
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid currentColor;
	}

	.shape-square { border-radius: 2px; }
	.shape-round { border-radius: 50%; }
	.shape-rectangle { width: 2.2rem; height: 1.2rem; border-radius: 3px; }
	.shape-bar { width: 2.5rem; height: 0.7rem; border-radius: 3px; }

	/* Menu edit */
	.menu-edit-section {
		margin-top: 1.25rem;
		max-width: 400px;
	}

	.section-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #999;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.region-fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.field select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
		background: #fff;
		cursor: pointer;
		width: 100%;
	}

	.field select:focus {
		outline: none;
		border-color: #6c63ff;
	}

	.menu-edit-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.menu-edit-btn {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.65rem 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.15s, background 0.15s;
	}

	.menu-edit-btn:hover {
		border-color: #6c63ff;
		background: #f0eeff;
		color: #6c63ff;
	}

	.menu-edit-btn svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}

	.radio-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}

	.radio-option:has(input:checked) {
		border-color: #6c63ff;
		background: #f0eeff;
	}

	.radio-option input[type="radio"] {
		accent-color: #6c63ff;
		width: 1rem;
		height: 1rem;
	}

	.radio-option span {
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.75rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
		margin-top: 0.5rem;
		transition: border-color 0.15s, background 0.15s;
	}

	.checkbox-option:has(input:checked) {
		border-color: #6c63ff;
		background: #f0eeff;
	}

	.checkbox-option input[type="checkbox"] {
		accent-color: #6c63ff;
		width: 1.1rem;
		height: 1.1rem;
	}

	.checkbox-option span {
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
	}

	/* Available Menus */
	.section-hint {
		font-size: 0.8rem;
		color: #888;
		margin: 0.25rem 0 0.5rem;
	}

	.menu-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.menu-item {
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
	}

	.menu-check {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		cursor: pointer;
	}

	.menu-check input[type="checkbox"] {
		width: 1.1rem;
		height: 1.1rem;
		accent-color: #6c63ff;
		flex-shrink: 0;
	}

	.menu-check input[type="checkbox"]:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.menu-name {
		flex: 1;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
	}

	.menu-count {
		font-size: 0.75rem;
		color: #888;
		background: #f5f5f5;
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
	}

	.no-menus {
		color: #e74c3c;
		font-size: 0.85rem;
		padding: 0.5rem;
		background: #fdecea;
		border-radius: 6px;
	}
</style>
