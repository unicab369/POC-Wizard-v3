<script lang="ts">
	import { menuStore, type Menu } from '$lib/actions-store.svelte';
	import Popup from './Popup.svelte';
	import MenuDisplay from './MenuDisplay.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		menus?: Menu[];
	}

	let { open, onclose, menus }: Props = $props();

	// Use provided menus or fall back to store menus
	const displayMenus = $derived(menus ?? menuStore.menus);
</script>

<Popup {open} title="Menu Items" {onclose} fullscreen>
	<MenuDisplay menus={displayMenus} showTitle={false} />

	{#snippet footer()}
		<div class="footer-buttons">
			<button class="btn secondary" onclick={onclose}>Back</button>
		</div>
	{/snippet}
</Popup>

<style>
	.footer-buttons {
		display: flex;
		width: 100%;
		gap: 0.5rem;
	}

	.btn.secondary {
		flex: 1;
		padding: 0.55rem 1.2rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1.1rem;
		cursor: pointer;
		color: #555;
		font-family: inherit;
	}

	.btn.secondary:hover {
		background: #f0f0f0;
	}
</style>
