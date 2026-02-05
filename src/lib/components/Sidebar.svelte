<script lang="ts">
	import { page } from '$app/state';
	import type { NavItem } from '$lib/navigation';

	interface Props {
		items: NavItem[];
		open: boolean;
		onclose: () => void;
	}

	let { items, open, onclose }: Props = $props();

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	function handleLinkClick() {
		onclose();
	}
</script>

{#if open}
	<button class="backdrop" onclick={onclose} aria-label="Close sidebar"></button>
{/if}

<nav class="sidebar" class:open aria-label="Main navigation">
	<div class="sidebar-header">
		<span class="logo">MyApp</span>
	</div>
	<ul>
		{#each items as item}
			<li>
				<a
					href={item.href}
					class:active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
					onclick={handleLinkClick}
				>
					{#if item.icon}
						<span class="icon">{item.icon}</span>
					{/if}
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: 250px;
		height: 100vh;
		background-color: #1a1a2e;
		color: #e0e0e0;
		display: flex;
		flex-direction: column;
		z-index: 100;
		transition: transform 0.3s ease;
	}

	.sidebar-header {
		padding: 1.5rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo {
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
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: #b0b0c0;
		text-decoration: none;
		font-size: 0.95rem;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	li a:hover {
		background-color: rgba(255, 255, 255, 0.08);
		color: #fff;
	}

	li a:focus-visible {
		outline: 2px solid #6c63ff;
		outline-offset: -2px;
	}

	li a.active {
		background-color: rgba(108, 99, 255, 0.2);
		color: #fff;
		border-right: 3px solid #6c63ff;
	}

	.icon {
		font-size: 1.1rem;
		width: 1.5rem;
		text-align: center;
	}

	.backdrop {
		display: none;
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
	}
</style>
