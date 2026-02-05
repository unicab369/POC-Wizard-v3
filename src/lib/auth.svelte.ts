let value = $state<string | null>(null);

export const auth = {
	get value() { return value; },
	set value(v: string | null) { value = v; }
};
