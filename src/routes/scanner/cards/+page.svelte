<script lang="ts">
	import { onMount } from 'svelte';
	import { type Scan, getScans, deleteScan, clearScans } from '$lib/scan-db';
	import { type Card, type CardType, addCard, getCards, deleteCard } from '$lib/scan-db';
	import Popup from '$lib/components/Popup.svelte';

	type Tab = 'history' | 'custom';

	let activeTab = $state<Tab>('history');
	let scans = $state<Scan[]>([]);
	let cards = $state<Card[]>([]);
	let popupOpen = $state(false);
	let formType = $state<CardType | null>(null);

	// Form fields
	let urlValue = $state('');
	let vcardName = $state('');
	let vcardPhone = $state('');
	let vcardEmail = $state('');
	let wifiSsid = $state('');
	let wifiPassword = $state('');
	let wifiEncryption = $state<'WPA' | 'WEP' | 'nopass'>('WPA');

	async function handleDeleteScan(id: number) {
		await deleteScan(id);
		scans = scans.filter((s) => s.id !== id);
	}

	async function handleClearAll() {
		await clearScans();
		scans = [];
	}

	function handleSelectType(type: CardType) {
		popupOpen = false;
		formType = type;
	}

	function resetForm() {
		formType = null;
		urlValue = '';
		vcardName = '';
		vcardPhone = '';
		vcardEmail = '';
		wifiSsid = '';
		wifiPassword = '';
		wifiEncryption = 'WPA';
	}

	async function handleGenerate() {
		let label = '';
		let data = '';

		if (formType === 'url') {
			label = urlValue;
			data = urlValue;
		} else if (formType === 'vcard') {
			label = vcardName || 'Unnamed';
			data = [
				'BEGIN:VCARD',
				'VERSION:3.0',
				`FN:${vcardName}`,
				vcardPhone ? `TEL:${vcardPhone}` : '',
				vcardEmail ? `EMAIL:${vcardEmail}` : '',
				'END:VCARD'
			].filter(Boolean).join('\n');
		} else if (formType === 'wifi') {
			label = wifiSsid || 'Unnamed';
			data = `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
		}

		if (!data) return;

		await addCard(formType!, label, data);
		cards = (await getCards()).reverse();
		resetForm();
		activeTab = 'custom';
	}

	async function handleDeleteCard(id: number) {
		await deleteCard(id);
		cards = cards.filter((c) => c.id !== id);
	}

	onMount(async () => {
		scans = (await getScans()).reverse();
		cards = (await getCards()).reverse();
	});
</script>

<h1>Cards</h1>

<div class="tabs">
	<button class="tab" class:active={activeTab === 'history'} onclick={() => (activeTab = 'history')}>
		History
	</button>
	<button class="tab" class:active={activeTab === 'custom'} onclick={() => (activeTab = 'custom')}>
		Custom Cards
	</button>
</div>

{#if formType}
	<div class="form-card">
		<h2 class="form-title">
			{formType === 'url' ? 'URL' : formType === 'vcard' ? 'vCard' : 'WiFi'}
		</h2>

		{#if formType === 'url'}
			<label class="field">
				<span>URL</span>
				<input type="url" bind:value={urlValue} placeholder="https://example.com" />
			</label>
		{:else if formType === 'vcard'}
			<label class="field">
				<span>Name</span>
				<input type="text" bind:value={vcardName} placeholder="John Doe" />
			</label>
			<label class="field">
				<span>Phone</span>
				<input type="tel" bind:value={vcardPhone} placeholder="+1 234 567 890" />
			</label>
			<label class="field">
				<span>Email</span>
				<input type="email" bind:value={vcardEmail} placeholder="john@example.com" />
			</label>
		{:else if formType === 'wifi'}
			<label class="field">
				<span>SSID</span>
				<input type="text" bind:value={wifiSsid} placeholder="Network name" />
			</label>
			<label class="field">
				<span>Password</span>
				<input type="text" bind:value={wifiPassword} placeholder="Password" />
			</label>
			<label class="field">
				<span>Encryption</span>
				<select bind:value={wifiEncryption}>
					<option value="WPA">WPA/WPA2</option>
					<option value="WEP">WEP</option>
					<option value="nopass">None</option>
				</select>
			</label>
		{/if}

		<div class="form-actions">
			<button class="btn secondary" onclick={resetForm}>Cancel</button>
			<button class="btn primary" onclick={handleGenerate}>Generate</button>
		</div>
	</div>
{:else if activeTab === 'history'}
	{#if scans.length === 0}
		<p class="empty">No scans yet. Go scan something!</p>
	{:else}
		<button class="btn danger" onclick={handleClearAll}>Clear all</button>
		<ul class="list">
			{#each scans as scan (scan.id)}
				<li class="entry">
					<div class="info">
						<span class="text">{scan.text}</span>
						<span class="date">{new Date(scan.timestamp).toLocaleString()}</span>
					</div>
					<button class="btn-delete" onclick={() => handleDeleteScan(scan.id)}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
{:else}
	{#if cards.length === 0}
		<p class="empty">No custom cards yet. Tap + to create one.</p>
	{:else}
		<ul class="list">
			{#each cards as card (card.id)}
				<li class="entry">
					<div class="info">
						<span class="badge">{card.type.toUpperCase()}</span>
						<span class="text">{card.label}</span>
						<span class="date">{new Date(card.timestamp).toLocaleString()}</span>
					</div>
					<button class="btn-delete" onclick={() => handleDeleteCard(card.id)}>Delete</button>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<button class="fab" onclick={() => (popupOpen = true)} aria-label="Add custom card">
	<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
</button>

<Popup open={popupOpen} title="New Card" onclose={() => (popupOpen = false)}>
	<div class="options">
		<button class="option" onclick={() => handleSelectType('url')}>
			<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
			<span>URL</span>
		</button>
		<button class="option" onclick={() => handleSelectType('vcard')}>
			<svg viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
			<span>vCard</span>
		</button>
		<button class="option" onclick={() => handleSelectType('wifi')}>
			<svg viewBox="0 0 24 24"><path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M4.93 13.222a9.003 9.003 0 0114.142 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
			<span>WiFi</span>
		</button>
	</div>
</Popup>

<style>
	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 2px solid #e0e0e0;
		margin-bottom: 1rem;
	}

	.tab {
		flex: 1;
		padding: 0.6rem 1.2rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		font-size: 0.95rem;
		color: #888;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab:hover { color: #333; }
	.tab.active { color: #6c63ff; border-bottom-color: #6c63ff; font-weight: 600; }

	.empty { color: #888; }

	/* Shared list */
	.list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.text { word-break: break-all; font-size: 0.95rem; }
	.date { font-size: 0.75rem; color: #888; }

	.badge {
		display: inline-block;
		align-self: flex-start;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		background: #ede9fe;
		color: #6c63ff;
	}

	.btn-delete {
		padding: 0.3rem 0.7rem;
		background: none;
		border: 1px solid #e74c3c;
		color: #e74c3c;
		border-radius: 4px;
		font-size: 0.8rem;
		cursor: pointer;
		flex-shrink: 0;
	}

	.btn-delete:hover { background: #fdecea; }

	.btn.danger {
		padding: 0.4rem 0.9rem;
		background: #e74c3c;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
		margin-bottom: 1rem;
	}

	.btn.danger:hover { background: #c0392b; }

	/* Form */
	.form-card {
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-title {
		font-size: 1.1rem;
		margin: 0;
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

	.field input, .field select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
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

	/* FAB */
	.fab {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background: #6c63ff;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		z-index: 10;
	}

	.fab:hover { background: #5a52d5; }
	.fab svg { width: 1.5rem; height: 1.5rem; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; }

	/* Popup options */
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
