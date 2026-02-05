<script lang="ts">
	import { actionsStore, pageStore, ACTION_TYPES, type QuickAction, type ActionType } from '$lib/actions-store.svelte';
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

	// Action editing
	let editingAction = $state<QuickAction | null>(null);
	let showActionForm = $state(false);
	let pickerOpen = $state(false);
	let formType = $state<ActionType>('phone');
	let formLabel = $state('');
	let formValue = $state('');

	const typeEntries = Object.entries(ACTION_TYPES) as [ActionType, typeof ACTION_TYPES[ActionType]][];

	function pickType(type: ActionType) {
		pickerOpen = false;
		formType = type;
		formLabel = ACTION_TYPES[type].label;
		formValue = '';
		editingAction = null;
		showActionForm = true;
	}

	function openEdit(action: QuickAction) {
		editingAction = action;
		formType = action.type;
		formLabel = action.label;
		formValue = action.value;
		showActionForm = true;
	}

	function handleSave() {
		if (!formLabel.trim()) return;
		if (editingAction) {
			actionsStore.update(editingAction.id, { label: formLabel, value: formValue });
		} else {
			actionsStore.add(formType, formLabel, formValue);
		}
		showActionForm = false;
		editingAction = null;
	}

	function handleDelete() {
		if (!editingAction) return;
		actionsStore.remove(editingAction.id);
		showActionForm = false;
		editingAction = null;
	}
</script>

<!-- Mirror home page layout -->
{#if editingPage}
	<div class="inline-form">
		<label class="field"><span>Title</span>
			<input type="text" bind:value={draftTitle} />
		</label>
		<label class="field"><span>Description</span>
			<input type="text" bind:value={draftDesc} />
		</label>
		<div class="inline-actions">
			<button class="btn secondary" onclick={() => (editingPage = false)}>Cancel</button>
			<button class="btn primary" onclick={savePage}>Save</button>
		</div>
	</div>
{:else}
	<div class="editable-row">
		<h1>{pageStore.title}</h1>
		<button class="btn-edit" onclick={startEditPage} aria-label="Edit title and description">
			<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
		</button>
	</div>
	<p>{pageStore.description}</p>
{/if}

<div class="grid-header">
	<span class="grid-label">Quick Actions</span>
	<button class="btn-edit" onclick={() => (pickerOpen = true)} aria-label="Add action">
		<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
	</button>
</div>

{#if showActionForm}
	{@const typeDef = ACTION_TYPES[formType]}
	<div class="action-form">
		<div class="form-header">
			<svg viewBox="0 0 24 24" class="form-icon">{@html typeDef.icon}</svg>
			<h2 class="form-title">{editingAction ? 'Edit' : 'New'} {typeDef.label}</h2>
		</div>

		<label class="field"><span>Label</span>
			<input type="text" bind:value={formLabel} placeholder={typeDef.label} />
		</label>

		<label class="field"><span>{typeDef.inputLabel}</span>
			<input type={typeDef.inputType} bind:value={formValue} placeholder={typeDef.placeholder} />
		</label>

		<div class="inline-actions">
			<button class="btn secondary" onclick={() => { showActionForm = false; editingAction = null; }}>Cancel</button>
			{#if editingAction}
				<button class="btn danger" onclick={handleDelete}>Delete</button>
			{/if}
			<button class="btn primary" onclick={handleSave}>{editingAction ? 'Save' : 'Add'}</button>
		</div>

		{#if editingAction}
			<div class="reorder">
				<span class="reorder-label">Reorder</span>
				<button class="btn-icon" onclick={() => actionsStore.moveUp(editingAction!.id)} aria-label="Move up">
					<svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6" /></svg>
				</button>
				<button class="btn-icon" onclick={() => actionsStore.moveDown(editingAction!.id)} aria-label="Move down">
					<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
				</button>
			</div>
		{/if}
	</div>
{:else}
	<ActionGrid items={actionsStore.items} {columns} onselect={openEdit} />
{/if}

<Popup open={pickerOpen} title="Choose Type" onclose={() => (pickerOpen = false)}>
	<div class="options">
		{#each typeEntries as [type, def]}
			<button class="option" onclick={() => pickType(type)}>
				<svg viewBox="0 0 24 24">{@html def.icon}</svg>
				<span>{def.label}</span>
			</button>
		{/each}
	</div>
</Popup>

<style>
	.editable-row {
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

	.inline-form, .action-form {
		max-width: 450px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.form-icon {
		width: 1.5rem;
		height: 1.5rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.form-title { font-size: 1.1rem; margin: 0; }

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

	.inline-actions {
		display: flex;
		gap: 0.5rem;
	}

	.reorder {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.reorder-label { font-size: 0.8rem; color: #888; }

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

	.btn.danger {
		padding: 0.55rem 1.2rem;
		background: #e74c3c;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.btn.danger:hover { background: #c0392b; }

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: none;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
		color: #555;
		transition: background 0.15s, color 0.15s;
	}

	.btn-icon:hover { background: #f0f0f0; color: #333; }
	.btn-icon svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

	/* Type picker popup */
	.options {
		display: flex;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.option {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.5rem;
		background: #f9f9fb;
		border: 1px solid #e0e0e0;
		border-radius: 10px;
		cursor: pointer;
		font-size: 0.85rem;
		color: #555;
		transition: background 0.15s, border-color 0.15s;
	}

	.option:hover { background: #f0eeff; border-color: #6c63ff; color: #6c63ff; }
	.option:active { background: #e8e5ff; }
	.option svg { width: 1.5rem; height: 1.5rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
