<script lang="ts">
	import { onMount } from 'svelte';
	import { type Card, type CardType, addCard, getCards, deleteCard, updateCard } from '$lib/scan-db';
	import { toDataURL } from '$lib/qr';
	import QRList, { type ListItem } from '$lib/components/QRList.svelte';
	import Popup from '$lib/components/Popup.svelte';
	import defaultCards from '$lib/test-data/custom-cards.json';

	let cards = $state<Card[]>([]);
	let newCardOpen = $state(false);
	let formType = $state<CardType | null>(null);
	let editing = $state(false);
	let editingCardId = $state<number | null>(null);

	let items = $derived<ListItem[]>(
		cards.map(c => ({ id: c.id, label: c.label, data: c.data, badge: c.type.toUpperCase(), timestamp: c.timestamp }))
	);

	let listRef: { closePopup: () => void } | undefined;

	// Form fields
	let urlName = $state('');
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
		urlName = '';
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
		editing = false;
		editingCardId = null;
		resetFields();
	}

	function buildData(): { label: string; data: string } {
		if (formType === 'url') {
			return { label: urlName || urlValue, data: urlValue };
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
			urlName = card.label;
			urlValue = card.data;
		} else if (card.type === 'vcard') {
			const lines = card.data.split('\n');
			vcardName = lines.find(l => l.startsWith('FN:'))?.slice(3) ?? '';
			vcardPhone = lines.find(l => l.startsWith('TEL:'))?.slice(4) ?? '';
			vcardEmail = lines.find(l => l.startsWith('EMAIL:'))?.slice(6) ?? '';
		} else if (card.type === 'wifi') {
			const m = card.data.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*)/);
			if (m) {
				wifiEncryption = m[1] as 'WPA' | 'WEP' | 'nopass';
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

	function startEdit(item: ListItem) {
		const card = cards.find(c => c.id === item.id);
		if (!card) return;
		listRef?.closePopup();
		loadFieldsFromCard(card);
		editing = true;
		editingCardId = card.id;
	}

	async function saveEdit() {
		if (editingCardId == null) return;
		const { label, data } = buildData();
		if (!data) return;
		await updateCard(editingCardId, { label, data });
		cards = (await getCards()).reverse();
		resetForm();
	}

	async function handleDelete(id: number) {
		await deleteCard(id);
		cards = cards.filter(c => c.id !== id);
		listRef?.closePopup();
	}

	onMount(async () => {
		let stored = await getCards();
		if (stored.length === 0) {
			// Seed from test data
			for (const c of defaultCards) {
				await addCard(c.type as CardType, c.label, c.data);
			}
			stored = await getCards();
		}
		cards = stored.reverse();
	});
</script>

<h1>Custom Cards</h1>

{#if formType}
	<div class="form-card">
		<h2 class="form-title">
			{editing ? 'Edit' : ''} {formType === 'url' ? 'URL' : formType === 'vcard' ? 'vCard' : 'WiFi'}
		</h2>

		{#if formType === 'url'}
			<label class="field"><span>Name</span>
				<input type="text" bind:value={urlName} placeholder="My Website" />
			</label>
			<label class="field"><span>URL</span>
				<input type="url" bind:value={urlValue} placeholder="https://example.com" />
			</label>
		{:else if formType === 'vcard'}
			<label class="field"><span>Name</span>
				<input type="text" bind:value={vcardName} placeholder="John Doe" />
			</label>
			<label class="field"><span>Phone</span>
				<input type="tel" bind:value={vcardPhone} placeholder="+1 234 567 890" />
			</label>
			<label class="field"><span>Email</span>
				<input type="email" bind:value={vcardEmail} placeholder="john@example.com" />
			</label>
		{:else if formType === 'wifi'}
			<label class="field"><span>SSID</span>
				<input type="text" bind:value={wifiSsid} placeholder="Network name" />
			</label>
			<label class="field"><span>Password</span>
				<input type="text" bind:value={wifiPassword} placeholder="Password" />
			</label>
			<label class="field"><span>Encryption</span>
				<select bind:value={wifiEncryption}>
					<option value="WPA">WPA/WPA2</option>
					<option value="WEP">WEP</option>
					<option value="nopass">None</option>
				</select>
			</label>
		{/if}

		<div class="form-actions">
			<button class="btn secondary" onclick={resetForm}>Cancel</button>
			{#if editing}
				<button class="btn primary" onclick={saveEdit}>Save</button>
			{:else}
				<button class="btn primary" onclick={handleGenerate}>Generate</button>
			{/if}
		</div>
	</div>
{:else}
	<QRList bind:this={listRef} {items} emptyText="No custom cards yet. Tap + to create one.">
		{#snippet actions({ item, close })}
			<button class="btn secondary" onclick={() => startEdit(item)}>Edit</button>
			<button class="btn danger" onclick={() => handleDelete(item.id)}>Remove</button>
		{/snippet}
	</QRList>

	<button class="fab" onclick={() => (newCardOpen = true)} aria-label="Add custom card">
		<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
	</button>
{/if}

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

<style>
	/* Form */
	.form-card {
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
