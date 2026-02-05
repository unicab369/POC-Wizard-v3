<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();
	let open = $state(false);

	const links = [
		{ label: 'Home', href: '/' },
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Projects', href: '/projects' },
		{ label: 'Settings', href: '/settings' }
	];
</script>

{#if open}
	<button class="backdrop" onclick={() => (open = false)} aria-label="Close sidebar"></button>
{/if}

<nav class="sidebar" class:open aria-label="Main navigation">
	<div class="sidebar-header">MyApp</div>
	<ul>
		{#each links as link}
			<li>
				<a
					href={link.href}
					class:active={link.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(link.href)}
					onclick={() => (open = false)}
				>
					{link.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<button class="hamburger" onclick={() => (open = !open)} aria-label="Toggle menu">
	<span class="bar"></span>
	<span class="bar"></span>
	<span class="bar"></span>
</button>

<main class="content">
	{@render children()}
</main>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background-color: #f5f5f5;
		color: #333;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: 250px;
		height: 100vh;
		background-color: #1a1a2e;
		color: #e0e0e0;
		z-index: 100;
		transition: transform 0.3s ease;
	}

	.sidebar-header {
		padding: 1.5rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 1.25rem;
		font-weight: 700;
		color: #fff;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0.5rem 0;
	}

	li a {
		display: block;
		padding: 0.75rem 1rem;
		color: #b0b0c0;
		text-decoration: none;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	li a:hover {
		background-color: rgba(255, 255, 255, 0.08);
		color: #fff;
	}

	li a.active {
		background-color: rgba(108, 99, 255, 0.2);
		color: #fff;
		border-right: 3px solid #6c63ff;
	}

	.backdrop {
		display: none;
	}

	.content {
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

	@media (max-width: 768px) {
		.sidebar {
			transform: translateX(-100%);
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background-color: rgba(0, 0, 0, 0.5);
			z-index: 99;
			border: none;
			cursor: pointer;
		}

		.content {
			margin-left: 0;
		}

		.hamburger {
			display: flex;
		}
	}
</style>
