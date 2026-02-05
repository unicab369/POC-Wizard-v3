<script lang="ts">
	import { actionsStore, pageStore, hoursStore, ACTION_TYPES, type QuickAction, type ActionType, type BusinessDay } from '$lib/actions-store.svelte';
	import ActionGrid from '$lib/components/ActionGrid.svelte';
	import BusinessHours from '$lib/components/BusinessHours.svelte';
	import Popup from '$lib/components/Popup.svelte';

	// Employee sign-in
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

	function signIn() {
		if (!loginLocation.trim() || !loginUsername.trim() || !loginPassword.trim()) {
			loginError = 'All fields are required.';
			return;
		}
		const auth: EmpAuth = { location: loginLocation.trim(), username: loginUsername.trim() };
		sessionStorage.setItem(EMP_KEY, JSON.stringify(auth));
		empAuth = auth;
		loginError = '';
	}

	function signOut() {
		sessionStorage.removeItem(EMP_KEY);
		empAuth = null;
		loginLocation = '';
		loginUsername = '';
		loginPassword = '';
	}

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
			<h2 class="sign-in-title">Employee Sign In</h2>
			<div class="sign-in-form">
				<label class="field"><span>Location Name</span>
					<input type="text" bind:value={loginLocation} placeholder="e.g. Downtown Branch" />
				</label>
				<label class="field"><span>User Name</span>
					<input type="text" bind:value={loginUsername} placeholder="Your username" />
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

<div class="emp-bar">
	<span class="emp-info">{empAuth.username} @ {empAuth.location}</span>
	<button class="btn-signout" onclick={signOut}>Sign Out</button>
</div>

{/if}

<style>
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
		margin: 0.5rem 0 1.25rem;
		font-size: 1.15rem;
		font-weight: 600;
		color: #333;
	}

	.sign-in-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		text-align: left;
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
	}

	.btn-signout:hover { background: #f0f0f0; }

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
