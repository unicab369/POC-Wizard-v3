<script lang="ts">
	import { onMount } from 'svelte';

	interface Scan { id: number; text: string; timestamp: number; }

	let scans = $state<Scan[]>([]);

	function openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open('scanner-db', 1);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains('scans')) {
					db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
				}
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async function getScans(): Promise<Scan[]> {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction('scans', 'readonly');
			const req = tx.objectStore('scans').getAll();
			req.onsuccess = () => { db.close(); resolve(req.result); };
			req.onerror = () => { db.close(); reject(req.error); };
		});
	}

	async function deleteScan(id: number) {
		const db = await openDB();
		const tx = db.transaction('scans', 'readwrite');
		tx.objectStore('scans').delete(id);
		await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
		db.close();
		scans = scans.filter((s) => s.id !== id);
	}

	async function clearAll() {
		const db = await openDB();
		const tx = db.transaction('scans', 'readwrite');
		tx.objectStore('scans').clear();
		await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
		db.close();
		scans = [];
	}

	onMount(async () => {
		scans = (await getScans()).reverse();
	});
</script>

<h1>Scan History</h1>

{#if scans.length === 0}
	<p class="empty">No scans yet. Go scan something!</p>
{:else}
	<button class="btn danger" onclick={clearAll}>Clear all</button>
	<ul class="list">
		{#each scans as scan (scan.id)}
			<li class="entry">
				<div class="info">
					<span class="text">{scan.text}</span>
					<span class="date">{new Date(scan.timestamp).toLocaleString()}</span>
				</div>
				<button class="btn-delete" onclick={() => deleteScan(scan.id)}>Delete</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty {
		color: #888;
	}

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

	.text {
		word-break: break-all;
		font-size: 0.95rem;
	}

	.date {
		font-size: 0.75rem;
		color: #888;
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
</style>
