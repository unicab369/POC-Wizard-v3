export type ActionType = 'phone' | 'navigation' | 'link' | 'social';

export interface ActionTypeDef {
	label: string;
	icon: string;
	placeholder: string;
	inputType: string;
	inputLabel: string;
}

export const ACTION_TYPES: Record<ActionType, ActionTypeDef> = {
	phone: {
		label: 'Phone',
		icon: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />',
		placeholder: '+1 234 567 890',
		inputType: 'tel',
		inputLabel: 'Phone Number'
	},
	navigation: {
		label: 'Navigation',
		icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />',
		placeholder: '123 Main St, City',
		inputType: 'text',
		inputLabel: 'Location / Address'
	},
	link: {
		label: 'Website',
		icon: '<circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />',
		placeholder: 'https://example.com',
		inputType: 'url',
		inputLabel: 'URL'
	},
	social: {
		label: 'Social Media',
		icon: '<path d="M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5z" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />',
		placeholder: 'https://instagram.com/username',
		inputType: 'url',
		inputLabel: 'Profile URL'
	}
};

export interface QuickAction {
	id: number;
	type: ActionType;
	label: string;
	icon: string;
	value: string;
	href: string;
}

export function buildHref(type: ActionType, value: string): string {
	switch (type) {
		case 'phone': return `tel:${value}`;
		case 'navigation': return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
		case 'link': return value;
		case 'social': return value;
	}
}

// Business hours
const HOURS_KEY = 'business-hours';

export interface BusinessDay {
	day: string;
	open: string;
	close: string;
	closed: boolean;
}

const defaultHours: BusinessDay[] = [
	{ day: 'Monday', open: '09:00', close: '17:00', closed: false },
	{ day: 'Tuesday', open: '09:00', close: '17:00', closed: false },
	{ day: 'Wednesday', open: '09:00', close: '17:00', closed: false },
	{ day: 'Thursday', open: '09:00', close: '17:00', closed: false },
	{ day: 'Friday', open: '09:00', close: '17:00', closed: false },
	{ day: 'Saturday', open: '10:00', close: '14:00', closed: false },
	{ day: 'Sunday', open: '', close: '', closed: true }
];

function loadHours(): BusinessDay[] {
	if (typeof localStorage === 'undefined') return defaultHours;
	const raw = localStorage.getItem(HOURS_KEY);
	if (!raw) return defaultHours;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length === 7) return parsed;
		return defaultHours;
	} catch { return defaultHours; }
}

function saveHours(h: BusinessDay[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(HOURS_KEY, JSON.stringify(h));
	}
}

let hours = $state<BusinessDay[]>(loadHours());

export const hoursStore = {
	get items() { return hours; },
	set items(v: BusinessDay[]) { hours = v; saveHours(v); }
};

// Menu items
const MENU_KEY = 'menu-items';

export interface MenuItem {
	id: number;
	name: string;
	description: string;
	price: string;
	category: string;
}

import defaultMenu from '$lib/test-data/menu-items.json';

function loadMenu(): MenuItem[] {
	if (typeof localStorage === 'undefined') return defaultMenu;
	const raw = localStorage.getItem(MENU_KEY);
	if (!raw) return defaultMenu;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) return parsed;
		return defaultMenu;
	} catch { return defaultMenu; }
}

function saveMenu(m: MenuItem[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(MENU_KEY, JSON.stringify(m));
	}
}

let menuItems = $state<MenuItem[]>(loadMenu());

export const menuStore = {
	get items() { return menuItems; },
	set items(v: MenuItem[]) { menuItems = v; saveMenu(v); },

	add(item: Omit<MenuItem, 'id'>) {
		const id = menuItems.length > 0 ? Math.max(...menuItems.map(m => m.id)) + 1 : 1;
		menuItems = [...menuItems, { id, ...item }];
		saveMenu(menuItems);
	},

	update(id: number, fields: Partial<Omit<MenuItem, 'id'>>) {
		menuItems = menuItems.map(m => m.id === id ? { ...m, ...fields } : m);
		saveMenu(menuItems);
	},

	remove(id: number) {
		menuItems = menuItems.filter(m => m.id !== id);
		saveMenu(menuItems);
	}
};

const STORAGE_KEY = 'quick-actions';
const PAGE_KEY = 'quick-actions-page';

interface PageConfig {
	title: string;
	description: string;
}

const defaultPage: PageConfig = { title: 'Home', description: 'Welcome to MyApp. Use the sidebar to navigate between pages.' };

function loadPage(): PageConfig {
	if (typeof localStorage === 'undefined') return defaultPage;
	const raw = localStorage.getItem(PAGE_KEY);
	if (!raw) return defaultPage;
	try { return { ...defaultPage, ...JSON.parse(raw) }; } catch { return defaultPage; }
}

function savePage(p: PageConfig) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(PAGE_KEY, JSON.stringify(p));
	}
}

let pageConfig = $state<PageConfig>(loadPage());

export const pageStore = {
	get title() { return pageConfig.title; },
	set title(v: string) { pageConfig = { ...pageConfig, title: v }; savePage(pageConfig); },
	get description() { return pageConfig.description; },
	set description(v: string) { pageConfig = { ...pageConfig, description: v }; savePage(pageConfig); }
};

const defaults: QuickAction[] = [
	{ id: 1, type: 'phone', label: 'Phone', icon: ACTION_TYPES.phone.icon, value: '', href: '' },
	{ id: 2, type: 'navigation', label: 'Navigation', icon: ACTION_TYPES.navigation.icon, value: '', href: '' },
	{ id: 3, type: 'social', label: 'Social Media', icon: ACTION_TYPES.social.icon, value: '', href: '' },
	{ id: 4, type: 'link', label: 'Website', icon: ACTION_TYPES.link.icon, value: '', href: '' }
];

function isValid(arr: unknown[]): arr is QuickAction[] {
	return arr.every(a => typeof a === 'object' && a !== null && 'type' in a && (a as QuickAction).type in ACTION_TYPES);
}

function load(): QuickAction[] {
	if (typeof localStorage === 'undefined') return defaults;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return defaults;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && isValid(parsed)) return parsed;
		localStorage.removeItem(STORAGE_KEY);
		return defaults;
	} catch { return defaults; }
}

function save(items: QuickAction[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}
}

let items = $state<QuickAction[]>(load());

export const actionsStore = {
	get items() { return items; },

	add(type: ActionType, label: string, value: string) {
		const id = items.length > 0 ? Math.max(...items.map(a => a.id)) + 1 : 1;
		const icon = ACTION_TYPES[type].icon;
		const href = buildHref(type, value);
		items = [...items, { id, type, label, icon, value, href }];
		save(items);
	},

	update(id: number, fields: { label: string; value: string }) {
		items = items.map(a => {
			if (a.id !== id) return a;
			return { ...a, label: fields.label, value: fields.value, href: buildHref(a.type, fields.value) };
		});
		save(items);
	},

	remove(id: number) {
		items = items.filter(a => a.id !== id);
		save(items);
	},

	moveUp(id: number) {
		const idx = items.findIndex(a => a.id === id);
		if (idx <= 0) return;
		const copy = [...items];
		[copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
		items = copy;
		save(items);
	},

	moveDown(id: number) {
		const idx = items.findIndex(a => a.id === id);
		if (idx < 0 || idx >= items.length - 1) return;
		const copy = [...items];
		[copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
		items = copy;
		save(items);
	}
};
