<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth.svelte';
	import { branchStore } from '$lib/actions-store.svelte';
	import { getBranchInfo } from '$lib/test-data/branch-data';

	let { children } = $props();
	let open = $state(false);

	// Get branch_id from URL or use current branch
	const branchId = $derived(page.params.branch_id || branchStore.id);
	const branchName = $derived(getBranchInfo(branchId).name);

	const icons = {
		home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
		dashboard: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
		folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
		settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
		profile: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
		profileFilled: 'M12 11a4 4 0 100-8 4 4 0 000 8zm0 2c-5 0-9 2.5-9 6v1h18v-1c0-3.5-4-6-9-6z',
		bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
		barcode: 'M1 1h7v7H1zM2 2h5v5H2zM3 3h3v3H3zM15 1h7v7h-7zM16 2h5v5h-5zM17 3h3v3h-3zM1 15h7v7H1zM2 16h5v5H2zM3 17h3v3H3zM10 1h2v2h-2zM12 3h2v2h-2zM1 10h2v2H1zM3 12h2v2H3zM10 10h2v2h-2zM14 10h2v2h-2zM18 10h2v2h-2zM12 12h2v2h-2zM16 12h2v2h-2zM20 12h2v2h-2zM10 14h2v2h-2zM14 14h2v2h-2zM18 14h2v2h-2zM12 16h2v2h-2zM16 16h2v2h-2zM20 16h2v2h-2zM10 18h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM12 20h2v2h-2zM16 20h2v2h-2zM20 20h2v2h-2z',
		admin: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
		store: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
	};

	// Links with dynamic branch_id for branch-specific routes
	const links = $derived([
		{ label: 'Home', href: `/${branchId}`, icon: icons.home, sublinks: [
			{ label: 'Home', href: `/${branchId}` },
			{ label: 'Menu', href: `/${branchId}/menu` }
		]},
		{ label: 'QR Barcode', href: '/scanner', icon: icons.barcode, filled: true, sublinks: [
			{ label: 'Scan', href: '/scanner' },
			{ label: 'History', href: '/scanner/history' },
			{ label: 'Cards', href: '/scanner/cards' }
		]},
		{ label: 'Dashboard', href: '/dashboard', icon: icons.dashboard, sublinks: [
			{ label: 'Overview', href: '/dashboard' },
			{ label: 'Analytics', href: '/dashboard/analytics' }
		]},
		{ label: 'Users', href: `/${branchId}/users`, icon: icons.profile, sublinks: [
			{ label: 'Employees', href: `/${branchId}/users` },
			{ label: 'Customers', href: `/${branchId}/users` }
		]},
		{ label: 'Branches', href: `/${branchId}/branches`, icon: icons.admin, sublinks: [
			{ label: 'Branches', href: `/${branchId}/branches` }
		]},
		{ label: 'Settings', href: '/settings', icon: icons.settings, sublinks: [
			{ label: 'General', href: '/settings' },
			{ label: 'Account', href: '/settings/account' }
		]}
	]);

	// Find the most specific matching link (longest href that matches)
	const currentSublinks = $derived.by(() => {
		const pathname = page.url.pathname;
		let bestMatch: typeof links[0] | null = null;
		let bestLength = 0;

		for (const l of links) {
			const fullHref = base + l.href;
			if (pathname === fullHref || pathname.startsWith(fullHref + '/')) {
				if (fullHref.length > bestLength) {
					bestMatch = l;
					bestLength = fullHref.length;
				}
			}
			// Also check sublinks for exact match
			if (l.sublinks.some(s => pathname === base + s.href)) {
				if (l.href.length > bestLength) {
					bestMatch = l;
					bestLength = l.href.length;
				}
			}
		}
		return bestMatch?.sublinks ?? [];
	});
</script>

{#if open}
	<button aria-label="backdrop" class="backdrop" onclick={() => (open = false)}></button>
{/if}

<nav class="sidebar" class:open>
	<div class="header">
		<span class="app-name">MyApp</span>
		<span class="branch-badge">
			<svg viewBox="0 0 24 24"><path d={icons.store} /></svg>
			{branchName}
		</span>
	</div>
	{#each links as link}
		<a href="{base}{link.href}" class:active={page.url.pathname.startsWith(base + link.href)} onclick={() => (open = false)}
		>
			<svg viewBox="0 0 24 24" class:filled={link.filled}><path d={link.icon} /></svg>
			{link.label}
		</a>
	{/each}
</nav>

<header class="topbar">
	<button class="hamburger" onclick={() => (open = !open)} aria-label="Toggle menu">
		<span></span><span></span><span></span>
	</button>
	<nav class="sublinks">
		{#each currentSublinks as sub}
			<a href="{base}{sub.href}">{sub.label}</a>
		{/each}
	</nav>
	<nav class="topbar-links">
		<a href="{base}/notifications" aria-label="Notifications" class:active={page.url.pathname.startsWith(base + '/notifications')}>
			<svg viewBox="0 0 24 24"><path d={icons.bell} /></svg>
		</a>
		<a href="{base}/profile" aria-label="Profile" class:active={page.url.pathname.startsWith(base + '/profile')}>
			{#if auth.value}
				<svg viewBox="0 0 24 24" class="filled"><path d={icons.profileFilled} /></svg>
			{:else}
				<svg viewBox="0 0 24 24"><path d={icons.profile} /></svg>
			{/if}
		</a>
	</nav>
</header>

<main class="content">
	{@render children()}
</main>

<style>
	:global(*) { box-sizing: border-box; }
	:global(html, body) {
		margin: 0;
		height: 100%;
		height: 100dvh;
		overflow: hidden;
		overscroll-behavior: none;
		touch-action: pan-x pan-y;
		font-family: system-ui, sans-serif;
		background: #f5f5f5;
		color: #333;
		-webkit-overflow-scrolling: touch;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: 250px;
		height: 100vh;
		height: 100dvh;
		background: #1a1a2e;
		z-index: 100;
		transition: transform 0.3s ease;
		overscroll-behavior: contain;
	}

	.header {
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.app-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: #fff;
	}

	.branch-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.6rem;
		background: rgba(108, 99, 255, 0.2);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #a5a0ff;
	}

	.branch-badge svg {
		width: 0.85rem;
		height: 0.85rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.sidebar a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: #b0b0c0;
		text-decoration: none;
		transition: background 0.15s, color 0.15s;
	}

	.sidebar a:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
	.sidebar a.active { background: rgba(108, 99, 255, 0.2); color: #fff; border-right: 3px solid #6c63ff; }
	.sidebar a svg { width: 1.25rem; height: 1.25rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
	.sidebar a svg.filled { fill: currentColor; stroke: none; fill-rule: evenodd; }

	.backdrop { display: none; }

	.topbar {
		position: fixed;
		top: 0;
		left: 250px;
		right: 0;
		height: 3.5rem;
		background: #fff;
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		z-index: 50;
	}

	.sublinks {
		display: flex;
		gap: 0.25rem;
		margin-right: auto;
	}

	.sublinks a {
		padding: 0.4rem 0.75rem;
		color: #555;
		text-decoration: none;
		font-size: 0.875rem;
		border-radius: 6px;
		transition: background 0.15s, color 0.15s;
	}

	.sublinks a:hover { background: #f0f0f0; color: #111; }

	.topbar-links {
		display: flex;
		gap: 0.25rem;
	}

	.topbar-links a {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		color: #555;
		text-decoration: none;
		font-size: 0.875rem;
		border-radius: 6px;
		transition: background 0.15s, color 0.15s;
	}

	.topbar-links a:hover { background: #f0f0f0; color: #111; }
	.topbar-links a svg.filled { fill: currentColor; stroke: none; }
	.topbar-links a.active { background: rgba(108, 99, 255, 0.1); color: #6c63ff; }
	.topbar-links a svg { width: 1.125rem; height: 1.125rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

	.content { margin-left: 250px; padding: 3rem 2rem 2rem; height: 100dvh; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }

	.hamburger {
		display: none;
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		flex-direction: column;
		gap: 4px;
	}

	.hamburger span { display: block; width: 22px; height: 2px; background: #333; border-radius: 1px; }

	@media (max-width: 768px) {
		.sidebar { transform: translateX(-100%); }
		.sidebar.open { transform: translateX(0); }
		.backdrop { display: block; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 99; border: none; cursor: pointer; }
		.topbar { left: 0; }
		.content { margin-left: 0; }
		.hamburger { display: flex; }
	}
</style>
