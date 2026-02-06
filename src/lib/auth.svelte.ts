export interface AuthUser {
	email: string;
	isManager: boolean;
}

function loadAuth(): AuthUser | null {
	if (typeof localStorage === 'undefined') return null;
	const stored = localStorage.getItem('auth');
	if (!stored) return null;
	try {
		return JSON.parse(stored);
	} catch {
		// Legacy: if it's just a string email, treat as non-manager
		return { email: stored, isManager: false };
	}
}

let user = $state<AuthUser | null>(loadAuth());

export const auth = {
	get value() { return user?.email ?? null; },
	get user() { return user; },
	get isManager() { return user?.isManager ?? false; },

	signIn(email: string, isManager: boolean) {
		user = { email, isManager };
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('auth', JSON.stringify(user));
		}
	},

	signOut() {
		user = null;
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('auth');
		}
	},

	// Legacy setter for compatibility
	set value(v: string | null) {
		if (v) {
			this.signIn(v, false);
		} else {
			this.signOut();
		}
	}
};
