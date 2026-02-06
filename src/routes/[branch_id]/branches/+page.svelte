<script lang="ts">
	import { goto } from '$app/navigation';
	import { branchStore } from '$lib/actions-store.svelte';
	import { getAvailableBranches } from '$lib/test-data/branch-data';

	const branches = getAvailableBranches();

	// Employee sign-in
	const EMP_KEY = 'employee-auth';

	interface EmpAuth { location: string; username: string; }

	function loadEmpAuth(): EmpAuth | null {
		if (typeof sessionStorage === 'undefined') return null;
		const raw = sessionStorage.getItem(EMP_KEY);
		if (!raw) return null;
		try { return JSON.parse(raw); } catch { return null; }
	}

	let empAuth = $state<EmpAuth | null>(loadEmpAuth());
	let loginLocation = $state('');
	let loginUsername = $state('');
	let loginPassword = $state('');
	let loginError = $state('');

	function signIn() {
		if (!loginLocation.trim() || !loginUsername.trim() || !loginPassword.trim()) {
			loginError = 'All fields are required.';
			return;
		}
		const auth: EmpAuth = { location: loginLocation.trim(), username: loginUsername.trim() };
		sessionStorage.setItem(EMP_KEY, JSON.stringify(auth));
		empAuth = auth;
		loginError = '';
	}

	function signOut() {
		sessionStorage.removeItem(EMP_KEY);
		empAuth = null;
		loginLocation = '';
		loginUsername = '';
		loginPassword = '';
	}

	function selectBranch(branchId: string) {
		branchStore.id = branchId;
		goto(`/${branchId}/manage`);
	}
</script>

{#if !empAuth}
	<div class="sign-in-wrapper">
		<div class="sign-in-card">
			<div class="sign-in-icon">
				<svg viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
			</div>
			<h2 class="sign-in-title">Employee Sign In</h2>
			<div class="sign-in-form">
				<label class="field"><span>Location Name</span>
					<input type="text" bind:value={loginLocation} placeholder="e.g. Downtown Branch" />
				</label>
				<label class="field"><span>User Name</span>
					<input type="text" bind:value={loginUsername} placeholder="Your username" />
				</label>
				<label class="field"><span>Password</span>
					<input type="password" bind:value={loginPassword} placeholder="Enter password"
						onkeydown={(e) => { if (e.key === 'Enter') signIn(); }} />
				</label>
				{#if loginError}
					<p class="login-error">{loginError}</p>
				{/if}
				<button class="btn primary sign-in-btn" onclick={signIn}>Sign In</button>
			</div>
		</div>
	</div>
{:else}
	<h1>My Branches</h1>
	<p class="subtitle">Select a branch to manage</p>

	<div class="branch-list">
		{#each branches as branch}
			<button
				class="branch-card"
				class:active={branchStore.id === branch.id}
				onclick={() => selectBranch(branch.id)}
			>
				<div class="branch-icon">
					<svg viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
				</div>
				<div class="branch-info">
					<span class="branch-name">{branch.name}</span>
					{#if branchStore.id === branch.id}
						<span class="branch-badge">Current</span>
					{/if}
				</div>
				<svg class="branch-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
			</button>
		{/each}
	</div>

	<div class="emp-bar">
		<span class="emp-info">{empAuth.username} @ {empAuth.location}</span>
		<button class="btn-signout" onclick={signOut}>Sign Out</button>
	</div>
{/if}

<style>
	.sign-in-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}

	.sign-in-card {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		padding: 2rem 1.5rem;
		width: 100%;
		max-width: 360px;
		text-align: center;
	}

	.sign-in-icon svg {
		width: 2.5rem;
		height: 2.5rem;
		fill: none;
		stroke: #6c63ff;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.sign-in-title {
		margin: 0.5rem 0 1.25rem;
		font-size: 1.15rem;
		font-weight: 600;
		color: #333;
	}

	.sign-in-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		text-align: left;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.field span { font-size: 0.8rem; font-weight: 600; color: #555; }

	.field input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.btn.primary {
		padding: 0.55rem 1.2rem;
		background: #6c63ff;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.btn.primary:hover { background: #5a52d5; }

	.sign-in-btn {
		margin-top: 0.25rem;
		width: 100%;
	}

	.login-error {
		margin: 0;
		font-size: 0.8rem;
		color: #e53935;
		text-align: center;
	}

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

	.emp-bar {
		position: fixed;
		bottom: 0;
		left: 250px;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f0eeff;
		border-top: 1px solid #d8d4ff;
		padding: 0.5rem 1rem;
		z-index: 50;
	}

	@media (max-width: 768px) {
		.emp-bar { left: 0; }
	}

	.emp-info {
		font-size: 0.85rem;
		font-weight: 500;
		color: #5a52d5;
	}

	.btn-signout {
		background: none;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 0.8rem;
		padding: 0.3rem 0.75rem;
		cursor: pointer;
		color: #555;
		font-family: inherit;
	}

	.btn-signout:hover { background: #f0f0f0; }
</style>
