<script lang="ts">
	import { onMount } from 'svelte';
	import { type Card, type CardType, addCard, getCards, deleteCard, updateCard } from '$lib/scan-db';
	import { toDataURL } from '$lib/qr';
	import Popup from '$lib/components/Popup.svelte';

	let cards = $state<Card[]>([]);
	let newCardOpen = $state(false);
	let formType = $state<CardType | null>(null);

	// Detail popup
	let selectedCard = $state<Card | null>(null);
	let qrDataUrl = $state('');
	let editing = $state(false);

	// Form fields
	let urlValue = $state('');
	let vcardName = $state('');
	let vcardPhone = $state('');
	let vcardEmail = $state('');
	let wifiSsid = $state('');
	let wifiPassword = $state('');
	let wifiEncryption = $state<'WPA' | 'WEP' | 'nopass'>('WPA');

	function handleSelectType(type: CardType) {
		newCardOpen = false;
		formType = type;
		resetFields();
	}

	function resetFields() {
		urlValue = '';
		vcardName = '';
		vcardPhone = '';
		vcardEmail = '';
		wifiSsid = '';
		wifiPassword = '';
		wifiEncryption = 'WPA';
	}

	function resetForm() {
		formType = null;
		resetFields();
	}

	function buildData(): { label: string; data: string } {
		if (formType === 'url') {
			return { label: urlValue, data: urlValue };
		} else if (formType === 'vcard') {
			return {
				label: vcardName || 'Unnamed',
				data: [
					'BEGIN:VCARD',
					'VERSION:3.0',
					`FN:${vcardName}`,
					vcardPhone ? `TEL:${vcardPhone}` : '',
					vcardEmail ? `EMAIL:${vcardEmail}` : '',
					'END:VCARD'
				].filter(Boolean).join('\n')
			};
		} else {
			return {
				label: wifiSsid || 'Unnamed',
				data: `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`
			};
		}
	}

	function loadFieldsFromCard(card: Card) {
		formType = card.type;
		if (card.type === 'url') {
			urlValue = card.data;
		} else if (card.type === 'vcard') {
			const lines = card.data.split('\n');
			vcardName = lines.find(l => l.startsWith('FN:'))?.slice(3) ?? '';
			vcardPhone = lines.find(l => l.startsWith('TEL:'))?.slice(4) ?? '';
			vcardEmail = lines.find(l => l.startsWith('EMAIL:'))?.slice(6) ?? '';
		} else if (card.type === 'wifi') {
			const m = card.data.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*)/);
			if (m) {
				wifiEncryption = (m[1] as 'WPA' | 'WEP' | 'nopass');
				wifiSsid = m[2];
				wifiPassword = m[3];
			}
		}
	}

	async function handleGenerate() {
		const { label, data } = buildData();
		if (!data) return;
		await addCard(formType!, label, data);
		cards = (await getCards()).reverse();
		resetForm();
	}

	async function openCard(card: Card) {
		selectedCard = card;
		editing = false;
		qrDataUrl = await toDataURL(card.data);
	}

	function closeCard() {
		selectedCard = null;
		qrDataUrl = '';
		editing = false;
		resetFields();
	}

	function startEdit() {
		if (!selectedCard) return;
		loadFieldsFromCard(selectedCard);
		editing = true;
	}

	async function saveEdit() {
		if (!selectedCard) return;
		const { label, data } = buildData();
		if (!data) return;
		await updateCard(selectedCard.id, { label, data });
		cards = (await getCards()).reverse();
		const updated = cards.find(c => c.id === selectedCard!.id);
		if (updated) {
			selectedCard = updated;
			qrDataUrl = await toDataURL(updated.data);
		}
		editing = false;
		resetFields();
	}

	async function handleDelete() {
		if (!selectedCard) return;
		await deleteCard(selectedCard.id);
		cards = cards.filter(c => c.id !== selectedCard!.id);
		closeCard();
	}

	onMount(async () => {
		cards = (await getCards()).reverse();
	});
</script>

<h1>Custom Cards</h1>

{#if formType && !editing}
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
{:else if cards.length === 0}
	<p class="empty">No custom cards yet. Tap + to create one.</p>
{:else}
	<ul class="list">
		{#each cards as card (card.id)}
			<li>
				<button class="card-item" onclick={() => openCard(card)}>
					<span class="badge">{card.type.toUpperCase()}</span>
					<span class="card-label">{card.label}</span>
					<span class="card-date">{new Date(card.timestamp).toLocaleString()}</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}

<button class="fab" onclick={() => (newCardOpen = true)} aria-label="Add custom card">
	<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
</button>

<!-- New card type picker -->
<Popup open={newCardOpen} title="New Card" onclose={() => (newCardOpen = false)}>
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

<!-- Card detail with QR -->
<Popup open={!!selectedCard} title={selectedCard?.label ?? ''} onclose={closeCard}>
	{#if editing}
		<div class="edit-form">
			{#if formType === 'url'}
				<label class="field"><span>URL</span><input type="url" bind:value={urlValue} /></label>
			{:else if formType === 'vcard'}
				<label class="field"><span>Name</span><input type="text" bind:value={vcardName} /></label>
				<label class="field"><span>Phone</span><input type="tel" bind:value={vcardPhone} /></label>
				<label class="field"><span>Email</span><input type="email" bind:value={vcardEmail} /></label>
			{:else if formType === 'wifi'}
				<label class="field"><span>SSID</span><input type="text" bind:value={wifiSsid} /></label>
				<label class="field"><span>Password</span><input type="text" bind:value={wifiPassword} /></label>
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
				<button class="btn secondary" onclick={() => { editing = false; resetFields(); }}>Cancel</button>
				<button class="btn primary" onclick={saveEdit}>Save</button>
			</div>
		</div>
	{:else}
		<div class="qr-container">
			{#if qrDataUrl}
				<img src={qrDataUrl} alt="QR code for {selectedCard?.label}" class="qr-image" />
			{/if}
		</div>
		<div class="detail-actions">
			<button class="btn secondary" onclick={startEdit}>Edit</button>
			<button class="btn danger" onclick={handleDelete}>Remove</button>
		</div>
	{/if}
</Popup>

<style>
	.empty { color: #888; }

	.list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.card-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s;
	}

	.card-item:hover { border-color: #6c63ff; }

	.badge {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		background: #ede9fe;
		color: #6c63ff;
	}

	.card-label { word-break: break-all; font-size: 0.95rem; }
	.card-date { font-size: 0.75rem; color: #888; }

	/* Form */
	.form-card, .edit-form {
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-title { font-size: 1.1rem; margin: 0; }

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.field span { font-size: 0.8rem; font-weight: 600; color: #555; }

	.field input, .field select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
	}

	.form-actions, .detail-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.detail-actions {
		justify-content: center;
		padding-top: 0.5rem;
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

	/* QR */
	.qr-container {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.qr-image {
		width: 200px;
		height: 200px;
	}

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
