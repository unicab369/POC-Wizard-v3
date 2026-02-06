<script lang="ts">
	import { goto } from '$app/navigation';
	import { branchStore } from '$lib/actions-store.svelte';
	import { getAvailableBranches } from '$lib/test-data/branch-data';

	const branches = getAvailableBranches();

	function selectBranch(branchId: string) {
		branchStore.id = branchId;
		goto(`/${branchId}/menu`);
	}
</script>

<h1>My Branches</h1>
<p class="subtitle">Select a branch to manage</p>

<div class="branch-list">
	{#each branches as branch}
		<button
			class="branch-card"
			class:active={branchStore.id === branch}
			onclick={() => selectBranch(branch)}
		>
			<div class="branch-icon">
				<svg viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
			</div>
			<div class="branch-info">
				<span class="branch-name">{branch}</span>
				{#if branchStore.id === branch}
					<span class="branch-badge">Current</span>
				{/if}
			</div>
			<svg class="branch-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
		</button>
	{/each}
</div>

<style>
	h1 {
		margin: 1rem 0 0.25rem;
	}

	.subtitle {
		color: #888;
		font-size: 0.9rem;
		margin: 0 0 1.5rem;
	}

	.branch-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 500px;
	}

	.branch-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 10px;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.branch-card:hover {
		border-color: #6c63ff;
		box-shadow: 0 2px 8px rgba(108, 99, 255, 0.15);
	}

	.branch-card.active {
		border-color: #6c63ff;
		background: #f8f7ff;
	}

	.branch-icon {
		width: 2.5rem;
		height: 2.5rem;
		background: #f0eeff;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.branch-icon svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.branch-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.branch-name {
		font-size: 1rem;
		font-weight: 600;
		color: #333;
		text-transform: capitalize;
	}

	.branch-badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		color: #6c63ff;
		background: #f0eeff;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		width: fit-content;
	}

	.branch-arrow {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: #ccc;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.branch-card:hover .branch-arrow {
		stroke: #6c63ff;
	}
</style>
