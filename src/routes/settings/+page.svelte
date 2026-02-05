<script lang="ts">
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'settings-draft';

	let displayName = $state('');
	let darkMode = $state(false);
	let saved = $state(false);

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
</style>
