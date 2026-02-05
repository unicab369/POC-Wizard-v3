<script lang="ts">
	import type { Snippet } from 'svelte';
	import { toDataURL } from '$lib/qr';
	import Popup from './Popup.svelte';

	export interface ListItem {
		id: number;
		label: string;
		data: string;
		badge?: string;
		timestamp: number;
	}

	interface Props {
		items: ListItem[];
		emptyText?: string;
		actions?: Snippet<[{ item: ListItem; close: () => void }]>;
	}

	let { items, emptyText = 'No items yet.', actions }: Props = $props();

	let selected = $state<ListItem | null>(null);
	let qrDataUrl = $state('');

	async function open(item: ListItem) {
		selected = item;
		qrDataUrl = await toDataURL(item.data);
	}

	function close() {
		selected = null;
		qrDataUrl = '';
	}

	export function getSelected() { return selected; }
	export function closePopup() { close(); }
</script>

{#if items.length === 0}
	<p class="empty">{emptyText}</p>
{:else}
	<ul class="list">
		{#each items as item (item.id)}
			<li>
				<button class="item" onclick={() => open(item)}>
					{#if item.badge}
						<span class="badge">{item.badge}</span>
					{/if}
					<span class="label">{item.label}</span>
					<span class="date">{new Date(item.timestamp).toLocaleString()}</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}

<Popup open={!!selected} title={selected?.label ?? ''} onclose={close}>
	<div class="qr-container">
		{#if qrDataUrl}
			<img src={qrDataUrl} alt="QR code" class="qr-image" />
		{/if}
	</div>
	{#if actions && selected}
		<div class="actions">
			{@render actions({ item: selected, close })}
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

	.item {
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

	.item:hover { border-color: #6c63ff; }

	.badge {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		background: #ede9fe;
		color: #6c63ff;
	}

	.label { word-break: break-all; font-size: 0.95rem; }
	.date { font-size: 0.75rem; color: #888; }

	.qr-container {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.qr-image { width: 200px; height: 200px; }

	.actions {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding-top: 0.5rem;
	}
</style>
