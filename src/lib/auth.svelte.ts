let value = $state<string | null>(
	typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null
);

export const auth = {
	get value() { return value; },
	set value(v: string | null) {
		value = v;
		if (typeof localStorage !== 'undefined') {
			v ? localStorage.setItem('auth', v) : localStorage.removeItem('auth');
		}
	}
};
