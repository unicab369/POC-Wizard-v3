<script lang="ts">
	import { page } from '$app/state';
	import { actionsStore, pageStore, hoursStore, tablesStore, menuDisplayStore, menuStore, ACTION_TYPES, TABLE_SHAPES, tableShapeLabel, tableShapeCss, branchStore, type QuickAction, type ActionType, type BusinessDay, type TableItem, type MenuDisplayMode } from '$lib/actions-store.svelte';
	import { getBranchInfo } from '$lib/test-data/branch-data';
	import ActionGrid from '$lib/components/ActionGrid.svelte';
	import BusinessHours from '$lib/components/BusinessHours.svelte';
	import Popup from '$lib/components/Popup.svelte';

	const branchId = $derived(page.params.branch_id || branchStore.id);
	const branchName = $derived(getBranchInfo(branchId).name);

	type View = 'select' | 'home' | 'menu' | 'tables';
	let view = $state<View>('select');

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
		// Pre-populate from existing actions
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

{#if view === 'select'}
	<a class="back-btn" href="/{branchId}/branches">
		<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
		Back to Branches
	</a>
	<div class="select-wrapper">
		<h2 class="select-title">Editing: {branchName}</h2>
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
	<button class="back-btn" onclick={() => (view = 'select')}>
		<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
		Back
	</button>

	<!-- Edit Home Page -->
	<div class="title-row">
		<h1>{pageStore.title}</h1>
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
	<button class="back-btn" onclick={() => (view = 'select')}>
		<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
		Back
	</button>
	<h2>Edit Menu</h2>

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

{:else if view === 'tables'}
	<button class="back-btn" onclick={() => (view = 'select')}>
		<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
		Back
	</button>
	<div class="grid-header">
		<span class="grid-label">Tables</span>
		<button class="btn-add" onclick={startAddTable}>+ Add Table</button>
	</div>

	<ul class="table-list">
		{#each tablesStore.items as t (t.id)}
			<li class="table-item">
				<div class="table-item-info">
					<span class="table-item-label">{t.label}</span>
					<span class="table-item-seats">{t.seats} seat{t.seats !== 1 ? 's' : ''}</span>
				</div>
				<span class="table-item-shape">{tableShapeLabel(t.shape)}</span>
				<div class="table-item-actions">
					<button class="btn-edit" onclick={() => startEditTable(t)} aria-label="Edit table">
						<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
					</button>
					<button class="btn-delete" onclick={() => tablesStore.remove(t.id)} aria-label="Remove table">
						<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
					</button>
				</div>
			</li>
		{/each}
	</ul>

	<!-- Edit table popup -->
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
		</div>
		{#snippet footer()}
			<div class="footer-buttons">
				<button class="btn primary" onclick={saveTable} disabled={!canSaveTable}>Save</button>
				<button class="btn secondary" onclick={() => (editingTable = null)}>Cancel</button>
			</div>
		{/snippet}
	</Popup>

	<!-- Add table popup -->
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

<style>
	.select-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 3rem;
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

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 1rem 0.75rem;
		background: #f0eeff;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		color: #6c63ff;
		cursor: pointer;
		font-family: inherit;
		text-decoration: none;
	}

	.back-btn:hover { background: #e4e0ff; }

	.back-btn svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

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
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
		resize: none;
		flex: 1;
	}

	.footer-buttons {
		display: flex;
		width: 100%;
		gap: 0.5rem;
	}

	.footer-buttons .btn { flex: 1; }

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.field span { font-size: 0.8rem; font-weight: 600; color: #555; }

	.field input {
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
		font-size: 0.9rem;
		cursor: pointer;
	}

	.btn.primary:hover:not(:disabled) { background: #5a52d5; }
	.btn.primary:disabled { opacity: 0.4; cursor: not-allowed; }

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

	.hours-fields {
		flex-direction: row;
		gap: 0.75rem;
	}

	.hours-fields .field { flex: 1; }

	/* Type checklist */
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
		justify-content: space-between;
		padding: 0.65rem 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
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

	.table-item-actions {
		display: flex;
		gap: 0.25rem;
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
</style>
