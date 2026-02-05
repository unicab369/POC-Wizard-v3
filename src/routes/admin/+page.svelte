<script lang="ts">
	import { actionsStore, pageStore, hoursStore, ACTION_TYPES, type QuickAction, type ActionType, type BusinessDay } from '$lib/actions-store.svelte';
	import ActionGrid from '$lib/components/ActionGrid.svelte';
	import Popup from '$lib/components/Popup.svelte';

	let columns = $state(4);

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

	function formatTime(t: string): string {
		if (!t) return '';
		const [h, m] = t.split(':').map(Number);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hr = h % 12 || 12;
		return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
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

<!-- Mirror home page layout -->
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

<ul class="hours-list">
	{#each hoursStore.items as day}
		<li class="hours-row">
			<span class="hours-day">{day.day}</span>
			<span class="hours-time" class:closed={day.closed}>
				{day.closed ? 'Closed' : `${formatTime(day.open)} – ${formatTime(day.close)}`}
			</span>
		</li>
	{/each}
</ul>

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

<style>
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

	/* Business hours */
	.hours-list {
		list-style: none;
		padding: 0;
		margin: 0;
		max-width: 500px;
	}

	.hours-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f0f0;
		font-size: 0.9rem;
	}

	.hours-row:last-child { border-bottom: none; }
	.hours-day { font-weight: 500; color: #333; }
	.hours-time { color: #555; }
	.hours-time.closed { color: #e74c3c; font-weight: 500; }

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
</style>
