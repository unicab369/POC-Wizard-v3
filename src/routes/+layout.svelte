<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { navItems } from '$lib/navigation';

	let { children } = $props();
	let sidebarOpen = $state(false);

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-layout">
	<Sidebar items={navItems} open={sidebarOpen} onclose={closeSidebar} />

	<button class="hamburger" onclick={() => (sidebarOpen = !sidebarOpen)} aria-label="Toggle menu">
		<span class="bar"></span>
		<span class="bar"></span>
		<span class="bar"></span>
	</button>

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
			sans-serif;
		background-color: #f5f5f5;
		color: #333;
	}

	.app-layout {
		display: flex;
		min-height: 100vh;
	}

	.content {
		flex: 1;
		margin-left: 250px;
		padding: 2rem;
	}

	.hamburger {
		display: none;
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 101;
		background: #1a1a2e;
		border: none;
		border-radius: 6px;
		padding: 0.5rem;
		cursor: pointer;
		flex-direction: column;
		gap: 4px;
	}

	.hamburger .bar {
		display: block;
		width: 22px;
		height: 2px;
		background-color: #fff;
		border-radius: 1px;
	}

	.hamburger:focus-visible {
		outline: 2px solid #6c63ff;
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.content {
			margin-left: 0;
		}

		.hamburger {
			display: flex;
		}
	}
</style>
