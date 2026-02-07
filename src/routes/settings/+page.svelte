<script lang="ts">
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'settings-draft';

	let displayName = $state('');
	let darkMode = $state(false);
	let saved = $state(false);
	let cleared = $state(false);

	onMount(() => {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (raw) {
			try {
				const draft = JSON.parse(raw);
				displayName = draft.displayName ?? '';
				darkMode = draft.darkMode ?? false;
			} catch {}
		}
	});

	function persistDraft() {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ displayName, darkMode }));
		saved = false;
	}

	function handleSave() {
		sessionStorage.removeItem(STORAGE_KEY);
		saved = true;
	}

	function clearAllStorage() {
		localStorage.clear();
		sessionStorage.clear();
		cleared = true;
		setTimeout(() => {
			window.location.reload();
		}, 500);
	}
</script>

<h1>Settings</h1>
<p>Configure your preferences here. Unsaved changes are kept for this tab session.</p>

<form class="form" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
	<label class="field">
		<span>Display name</span>
		<input type="text" bind:value={displayName} oninput={persistDraft} placeholder="Enter your name" />
	</label>

	<label class="field toggle">
		<span>Dark mode</span>
		<input type="checkbox" bind:checked={darkMode} onchange={persistDraft} />
	</label>

	<button class="btn" type="submit">Save</button>
	{#if saved}
		<span class="confirmation">Preferences saved!</span>
	{/if}
</form>

<div class="debug-section">
	<h2>Debug</h2>
	<p class="debug-hint">Developer tools for testing and troubleshooting.</p>
	<button class="btn danger" onclick={clearAllStorage}>
		Clear All Storage
	</button>
	{#if cleared}
		<span class="confirmation">Storage cleared! Reloading...</span>
	{/if}
</div>

<style>
	.form {
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field span {
		font-size: 0.875rem;
		font-weight: 600;
		color: #555;
	}

	.field input[type='text'] {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
	}

	.toggle {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle input[type='checkbox'] {
		width: 1.1rem;
		height: 1.1rem;
		accent-color: #6c63ff;
	}

	.btn {
		align-self: flex-start;
		padding: 0.6rem 1.2rem;
		background: #6c63ff;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.btn:hover { background: #5a52d5; }

	.confirmation {
		color: #2e7d32;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.debug-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #e0e0e0;
		max-width: 400px;
	}

	.debug-section h2 {
		font-size: 1rem;
		color: #666;
		margin: 0 0 0.25rem;
	}

	.debug-hint {
		font-size: 0.8rem;
		color: #999;
		margin: 0 0 1rem;
	}

	.btn.danger {
		background: #e74c3c;
	}

	.btn.danger:hover {
		background: #c0392b;
	}
</style>
