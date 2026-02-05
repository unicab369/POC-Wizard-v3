<script lang="ts">
	import { onMount } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';
	import { addScan } from '$lib/scan-db';

	let result = $state<string | null>(null);
	let error = $state<string | null>(null);
	let scanning = $state(false);
	let scanner: Html5Qrcode | null = null;

	onMount(() => {
		return () => {
			if (scanner?.isScanning) scanner.stop();
		};
	});

	async function startScan() {
		result = null;
		error = null;
		scanning = true;

		scanner = new Html5Qrcode('reader');

		try {
			await scanner.start(
				{ facingMode: 'environment' },
				{ fps: 10, qrbox: { width: 250, height: 250 } },
				async (text) => {
					result = text;
					scanner?.stop();
					scanning = false;
					await addScan(text);
				},
				() => {}
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Camera access denied';
			scanning = false;
		}
	}

	async function stopScan() {
		if (scanner?.isScanning) await scanner.stop();
		scanning = false;
	}
</script>

<h1>Barcode Scanner</h1>

<div id="reader" class="reader"></div>

{#if !scanning}
	<button class="btn" onclick={startScan}>Start scanning</button>
{:else}
	<button class="btn stop" onclick={stopScan}>Stop</button>
{/if}

{#if result}
	<div class="result">
		<strong>Scanned:</strong> {result}
	</div>
{/if}

{#if error}
	<div class="error">{error}</div>
{/if}

<style>
	.reader {
		max-width: 400px;
		margin-bottom: 1rem;
	}

	.btn {
		padding: 0.6rem 1.2rem;
		background: #6c63ff;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.btn:hover { background: #5a52d5; }
	.btn.stop { background: #e74c3c; }
	.btn.stop:hover { background: #c0392b; }

	.result {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #e8f5e9;
		border-radius: 6px;
		word-break: break-all;
	}

	.error {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #fdecea;
		color: #c0392b;
		border-radius: 6px;
	}
</style>
