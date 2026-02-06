<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
		fullscreen?: boolean;
		wide?: boolean;
	}

	let { open, title, onclose, children, footer, fullscreen = false, wide = false }: Props = $props();
</script>

{#if open}
	<div class="popup-overlay" role="presentation" onclick={onclose}></div>
	<div class="popup" class:fullscreen class:wide role="dialog" aria-modal="true">
		{#if title}
			<div class="popup-header">
				<span class="popup-title">{title}</span>
			</div>
		{/if}
		<div class="popup-body">
			{@render children()}
		</div>
		<div class="popup-footer">
			{#if footer}
				{@render footer()}
			{:else}
				<button class="popup-close" onclick={onclose}>CLOSE</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.popup-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 100;
	}

	.popup {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #fff;
		border-radius: 10px;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
		z-index: 101;
		min-width: 260px;
		max-width: 90vw;
		display: flex;
		flex-direction: column;
	}

	.popup.wide {
		width: 85vw;
		max-width: 400px;
	}

	.popup.fullscreen {
		inset: 0;
		width: 100%;
		height: 100dvh;
		max-width: 100%;
		max-height: 100dvh;
		top: 0;
		left: 0;
		transform: none;
		border-radius: 0;
	}

	.popup-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e0e0e0;
		text-align: center;
	}

	.popup.fullscreen .popup-header {
		padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));
	}

	.popup-title {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.popup-body {
		padding: 0.5rem;
		flex: 1;
		overflow-y: auto;
	}

	.popup-footer {
		border-top: 1px solid #e0e0e0;
		padding: 0.5rem;
		text-align: center;
	}

	.popup.fullscreen .popup-footer {
		padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
	}

	.popup-close {
		background: none;
		border: none;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		color: #888;
		padding: 0.4rem 1rem;
		letter-spacing: 0.05em;
		border-radius: 6px;
	}

	.popup-close:hover { color: #333; background: #f0f0f0; }
</style>
