<script lang="ts">
	import { auth } from '$lib/auth.svelte';
	import { employeesStore } from '$lib/actions-store.svelte';

	let view = $state<'signin' | 'forgot'>('signin');
	let email = $state('');
	let password = $state('');

	function signin() {
		if (email && password) {
			// Check if email matches an employee and if they're a manager
			const employee = employeesStore.items.find(
				e => e.email.toLowerCase() === email.toLowerCase()
			);
			const isManager = employee?.role === 'Manager';
			auth.signIn(email, isManager);
			email = '';
			password = '';
		}
	}

	function signout() {
		auth.signOut();
		view = 'signin';
	}

	function resetPassword() {
		if (email) {
			alert(`Password reset link sent to ${email}`);
			view = 'signin';
		}
	}
</script>

<h1>Profile</h1>

{#if auth.value}
	<div class="card">
		<p>Signed in as <strong>{auth.value}</strong></p>
		{#if auth.isManager}
			<span class="role-badge manager">Manager</span>
		{:else}
			<span class="role-badge">Employee</span>
		{/if}
		<button class="btn" onclick={signout}>Sign out</button>
	</div>
{:else if view === 'forgot'}
	<div class="card">
		<h2>Reset password</h2>
		<form onsubmit={(e) => { e.preventDefault(); resetPassword(); }}>
			<label>
				Email
				<input type="email" bind:value={email} required />
			</label>
			<button class="btn" type="submit">Send reset link</button>
		</form>
		<button class="link" onclick={() => (view = 'signin')}>Back to sign in</button>
	</div>
{:else}
	<div class="card">
		<h2>Sign in</h2>
		<form onsubmit={(e) => { e.preventDefault(); signin(); }}>
			<label>
				Email
				<input type="email" bind:value={email} required />
			</label>
			<label>
				Password
				<input type="password" bind:value={password} required />
			</label>
			<button class="btn" type="submit">Sign in</button>
		</form>
		<button class="link" onclick={() => (view = 'forgot')}>Forgot password?</button>
	</div>
{/if}

<style>
	.card {
		max-width: 360px;
		background: #fff;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: #555;
	}

	input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.95rem;
	}

	input:focus {
		outline: 2px solid #6c63ff;
		outline-offset: -1px;
		border-color: transparent;
	}

	.btn {
		margin-top: 0.5rem;
		padding: 0.6rem;
		background: #6c63ff;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.btn:hover { background: #5a52d5; }

	.link {
		margin-top: 0.75rem;
		background: none;
		border: none;
		color: #6c63ff;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0;
	}

	.link:hover { text-decoration: underline; }

	.role-badge {
		display: inline-block;
		padding: 0.25rem 0.6rem;
		background: #e8e8e8;
		color: #555;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.role-badge.manager {
		background: #f0eeff;
		color: #6c63ff;
	}
</style>
