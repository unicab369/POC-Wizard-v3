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

// Branch management
const BRANCH_KEY = 'current-branch';
const DEFAULT_BRANCH = '1';

function loadBranchId(): string {
	if (typeof localStorage === 'undefined') return DEFAULT_BRANCH;
	return localStorage.getItem(BRANCH_KEY) || DEFAULT_BRANCH;
}

let currentBranchId = $state<string>(loadBranchId());

export const branchStore = {
	get id() { return currentBranchId; },
	set id(v: string) {
		currentBranchId = v;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(BRANCH_KEY, v);
		}
		// Reload all branch-specific data
		reloadAllStores();
	}
};

function branchKey(key: string): string {
	return `${currentBranchId}:${key}`;
}

// Helper to reload all stores when branch changes
function reloadAllStores() {
	hours = loadHours();
	menuData = loadMenuData();
	displayMode = loadDisplayMode();
	menuSettings = loadMenuSettings();
	tableItems = loadTables();
	employeeItems = loadEmployees();
	customerItems = loadCustomers();
	pageConfig = loadPage();
	items = load();
	purchaseItems = loadPurchases();
	orderStates = loadOrderStates();
	// Clear cart when switching branches
	cartItems = [];
}

// Business hours
export interface BusinessDay {
	day: string;
	open: string;
	close: string;
	closed: boolean;
}

const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getDefaultHours(): BusinessDay[] {
	const branchInfo = getBranchInfo(currentBranchId);
	return dayNames.map((day, i) => {
		const h = branchInfo.hours[day];
		return {
			day: dayLabels[i],
			open: h?.open || '09:00',
			close: h?.close || '17:00',
			closed: h?.closed || false
		};
	});
}

function loadHours(): BusinessDay[] {
	const defaultHours = getDefaultHours();
	if (typeof localStorage === 'undefined') return defaultHours;
	const raw = localStorage.getItem(branchKey('business-hours'));
	if (!raw) return defaultHours;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length === 7) return parsed;
		return defaultHours;
	} catch { return defaultHours; }
}

function saveHours(h: BusinessDay[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('business-hours'), JSON.stringify(h));
	}
}

let hours = $state<BusinessDay[]>(loadHours());

export const hoursStore = {
	get items() { return hours; },
	set items(v: BusinessDay[]) { hours = v; saveHours(v); }
};

// Menu items
export interface MenuItem {
	id: number;
	name: string;
	description: string;
	price: number;
	category: string;
}

export interface Menu {
	id: number;
	name: string;
	items: MenuItem[];
}

export interface MenuData {
	menus: Menu[];
	enabledMenus: number[];
}

import { getBranchData, getBranchInfo } from '$lib/test-data/branch-data';

function getDefaultMenuData(): MenuData {
	const data = getBranchData(currentBranchId).menu;
	// Ensure we have valid structure
	if (!data || !data.menus || !Array.isArray(data.menus)) {
		return { menus: [], enabledMenus: [] };
	}
	return data as MenuData;
}

function loadMenuData(): MenuData {
	const defaultData = getDefaultMenuData();
	if (typeof localStorage === 'undefined') return defaultData;

	// Try new format first
	const raw = localStorage.getItem(branchKey('menu-data'));
	if (raw) {
		try {
			const parsed = JSON.parse(raw);
			if (parsed.menus && Array.isArray(parsed.menus)) return parsed;
		} catch { /* fall through */ }
	}

	// Clear old format if exists (migration)
	const oldRaw = localStorage.getItem(branchKey('menu-items'));
	if (oldRaw) {
		localStorage.removeItem(branchKey('menu-items'));
	}

	return defaultData;
}

function saveMenuData(data: MenuData) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('menu-data'), JSON.stringify(data));
	}
}

let menuData = $state<MenuData>(loadMenuData());

// Get all items from enabled menus (flat list for cart/order processing)
function getAllEnabledItems(): MenuItem[] {
	const enabled = menuData.enabledMenus;
	return menuData.menus
		.filter(m => enabled.includes(m.id))
		.flatMap(m => m.items);
}

export const menuStore = {
	// All menus (for configuration)
	get menus() { return menuData.menus || []; },
	get enabledMenus() { return menuData.enabledMenus || []; },

	// Enabled menus only (for display)
	get enabledMenusList() {
		const menus = menuData.menus || [];
		const enabled = menuData.enabledMenus || [];
		return menus.filter(m => enabled.includes(m.id));
	},

	// All items from enabled menus (flat list for cart compatibility)
	get items() { return getAllEnabledItems(); },

	// Get items for a specific menu
	getMenuItems(menuId: number): MenuItem[] {
		const menu = menuData.menus.find(m => m.id === menuId);
		return menu ? menu.items : [];
	},

	// Toggle menu enabled state
	toggleMenu(menuId: number) {
		if (menuData.enabledMenus.includes(menuId)) {
			// Don't disable if it's the last one
			if (menuData.enabledMenus.length > 1) {
				menuData = { ...menuData, enabledMenus: menuData.enabledMenus.filter(id => id !== menuId) };
			}
		} else {
			menuData = { ...menuData, enabledMenus: [...menuData.enabledMenus, menuId] };
		}
		saveMenuData(menuData);
	},

	setEnabledMenus(ids: number[]) {
		menuData = { ...menuData, enabledMenus: ids.length > 0 ? ids : [menuData.menus[0]?.id || 1] };
		saveMenuData(menuData);
	},

	// Item operations (operates on all menus)
	add(menuId: number, item: Omit<MenuItem, 'id'>) {
		const allItems = menuData.menus.flatMap(m => m.items);
		const id = allItems.length > 0 ? Math.max(...allItems.map(m => m.id)) + 1 : 1;
		menuData = {
			...menuData,
			menus: menuData.menus.map(m =>
				m.id === menuId ? { ...m, items: [...m.items, { id, ...item }] } : m
			)
		};
		saveMenuData(menuData);
	},

	update(id: number, fields: Partial<Omit<MenuItem, 'id'>>) {
		menuData = {
			...menuData,
			menus: menuData.menus.map(m => ({
				...m,
				items: m.items.map(item => item.id === id ? { ...item, ...fields } : item)
			}))
		};
		saveMenuData(menuData);
	},

	remove(id: number) {
		menuData = {
			...menuData,
			menus: menuData.menus.map(m => ({
				...m,
				items: m.items.filter(item => item.id !== id)
			}))
		};
		saveMenuData(menuData);
	}
};

// Menu display mode
export type MenuDisplayMode = 'list' | 'grid' | 'both';

function loadDisplayMode(): MenuDisplayMode {
	if (typeof localStorage === 'undefined') return 'both';
	const raw = localStorage.getItem(branchKey('menu-display-mode'));
	if (raw === 'list' || raw === 'grid' || raw === 'both') return raw;
	return 'both';
}

function loadDefaultView(): 'list' | 'grid' {
	if (typeof localStorage === 'undefined') return 'list';
	const raw = localStorage.getItem(branchKey('menu-default-view'));
	if (raw === 'list' || raw === 'grid') return raw;
	return 'list';
}

let displayMode = $state<MenuDisplayMode>(loadDisplayMode());
let defaultView = $state<'list' | 'grid'>(loadDefaultView());

export const menuDisplayStore = {
	get mode() { return displayMode; },
	set mode(v: MenuDisplayMode) { displayMode = v; if (typeof localStorage !== 'undefined') localStorage.setItem(branchKey('menu-display-mode'), v); },
	get defaultView() { return defaultView; },
	set defaultView(v: 'list' | 'grid') { defaultView = v; if (typeof localStorage !== 'undefined') localStorage.setItem(branchKey('menu-default-view'), v); }
};

// Menu settings (language/currency/checkout options)
export interface MenuSettings {
	language: string;
	currency: string;
	requireTable: boolean;
}

import localeOptions from '$lib/test-data/locale-options.json';

export const LANGUAGES = localeOptions.languages;
export const CURRENCIES = localeOptions.currencies;

export interface CurrencyInfo {
	code: string;
	symbol: string;
	name: string;
	prefix: number;
	divisor: number;
	separator: string;
}

export function getCurrencyInfo(code: string): CurrencyInfo {
	return (CURRENCIES as CurrencyInfo[]).find(c => c.code === code) || {
		code: 'USD', symbol: '$', name: 'US Dollar', prefix: 1, divisor: 100, separator: '.'
	};
}

export function formatCurrency(amount: number, currencyCode?: string): string {
	const code = currencyCode ?? menuSettings.currency;
	const info = getCurrencyInfo(code);
	const value = amount / info.divisor;

	// Format the number with proper decimal places
	const decimals = info.divisor === 1 ? 0 : 2;
	let formatted: string;

	if (info.divisor === 1) {
		// No decimals - add thousand separators
		formatted = Math.round(value).toLocaleString('en-US').replace(/,/g, info.separator);
	} else {
		// With decimals
		const [intPart, decPart] = value.toFixed(decimals).split('.');
		const intFormatted = parseInt(intPart).toLocaleString('en-US').replace(/,/g, info.separator === ',' ? '.' : ',');
		formatted = `${intFormatted}${info.separator}${decPart}`;
	}

	// Apply prefix or suffix
	return info.prefix ? `${info.symbol}${formatted}` : `${formatted}${info.symbol}`;
}

function getDefaultMenuSettings(): MenuSettings {
	const branchInfo = getBranchInfo(currentBranchId);
	return {
		language: branchInfo.language || 'en',
		currency: branchInfo.currency || 'USD',
		requireTable: branchInfo.requireTable ?? false
	};
}

function loadMenuSettings(): MenuSettings {
	const defaults = getDefaultMenuSettings();
	if (typeof localStorage === 'undefined') return defaults;
	const raw = localStorage.getItem(branchKey('menu-settings'));
	if (!raw) return defaults;
	try {
		return { ...defaults, ...JSON.parse(raw) };
	} catch { return defaults; }
}

function saveMenuSettings(s: MenuSettings) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('menu-settings'), JSON.stringify(s));
	}
}

let menuSettings = $state<MenuSettings>(loadMenuSettings());

export const menuSettingsStore = {
	get language() { return menuSettings.language; },
	set language(v: string) { menuSettings = { ...menuSettings, language: v }; saveMenuSettings(menuSettings); },
	get currency() { return menuSettings.currency; },
	set currency(v: string) { menuSettings = { ...menuSettings, currency: v }; saveMenuSettings(menuSettings); },
	get requireTable() { return menuSettings.requireTable; },
	set requireTable(v: boolean) { menuSettings = { ...menuSettings, requireTable: v }; saveMenuSettings(menuSettings); }
};

// Tables
export const TABLE_SHAPES: { value: number; label: string; css: string }[] = [
	{ value: 0, label: 'Square', css: 'square' },
	{ value: 1, label: 'Round', css: 'round' },
	{ value: 2, label: 'Rectangle', css: 'rectangle' },
	{ value: 3, label: 'Bar', css: 'bar' }
];

export function tableShapeLabel(shape: number): string {
	return TABLE_SHAPES.find(s => s.value === shape)?.label ?? 'Unknown';
}

export function tableShapeCss(shape: number): string {
	return TABLE_SHAPES.find(s => s.value === shape)?.css ?? 'square';
}

export interface TableItem {
	id: number;
	label: string;
	seats: number;
	shape: number;
}

function getDefaultTables(): TableItem[] {
	return getBranchData(currentBranchId).tables;
}

function loadTables(): TableItem[] {
	const defaultTables = getDefaultTables();
	if (typeof localStorage === 'undefined') return defaultTables;
	const raw = localStorage.getItem(branchKey('tables'));
	if (!raw) return defaultTables;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].label) return parsed;
		return defaultTables;
	} catch { return defaultTables; }
}

function saveTables(t: TableItem[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('tables'), JSON.stringify(t));
	}
}

let tableItems = $state<TableItem[]>(loadTables());

export const tablesStore = {
	get items() { return tableItems; },
	set items(v: TableItem[]) { tableItems = v; saveTables(v); },

	add(item: Omit<TableItem, 'id'>) {
		const id = tableItems.length > 0 ? Math.max(...tableItems.map(t => t.id)) + 1 : 1;
		tableItems = [...tableItems, { id, ...item }];
		saveTables(tableItems);
	},

	update(id: number, fields: Partial<Omit<TableItem, 'id'>>) {
		tableItems = tableItems.map(t => t.id === id ? { ...t, ...fields } : t);
		saveTables(tableItems);
	},

	remove(id: number) {
		tableItems = tableItems.filter(t => t.id !== id);
		saveTables(tableItems);
	}
};

// Employees
export interface Employee {
	id: number;
	name: string;
	role: string;
	email: string;
	phone: string;
}

export const EMPLOYEE_ROLES = ['Manager', 'Barista', 'Server', 'Cashier', 'Chef', 'Host'];

function getDefaultEmployees(): Employee[] {
	return getBranchData(currentBranchId).employees;
}

function loadEmployees(): Employee[] {
	const defaults = getDefaultEmployees();
	if (typeof localStorage === 'undefined') return defaults;
	const raw = localStorage.getItem(branchKey('employees'));
	if (!raw) return defaults;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed;
		return defaults;
	} catch { return defaults; }
}

function saveEmployees(e: Employee[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('employees'), JSON.stringify(e));
	}
}

let employeeItems = $state<Employee[]>(loadEmployees());

export const employeesStore = {
	get items() { return employeeItems; },
	set items(v: Employee[]) { employeeItems = v; saveEmployees(v); },

	add(item: Omit<Employee, 'id'>) {
		const id = employeeItems.length > 0 ? Math.max(...employeeItems.map(e => e.id)) + 1 : 1;
		employeeItems = [...employeeItems, { id, ...item }];
		saveEmployees(employeeItems);
	},

	update(id: number, fields: Partial<Omit<Employee, 'id'>>) {
		employeeItems = employeeItems.map(e => e.id === id ? { ...e, ...fields } : e);
		saveEmployees(employeeItems);
	},

	remove(id: number) {
		employeeItems = employeeItems.filter(e => e.id !== id);
		saveEmployees(employeeItems);
	}
};

// Customers
export interface Customer {
	id: number;
	name: string;
	phone: string;
}

function getDefaultCustomers(): Customer[] {
	return getBranchData(currentBranchId).customers;
}

function loadCustomers(): Customer[] {
	const defaults = getDefaultCustomers();
	if (typeof localStorage === 'undefined') return defaults;
	const raw = localStorage.getItem(branchKey('customers'));
	if (!raw) return defaults;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed;
		return defaults;
	} catch { return defaults; }
}

function saveCustomers(c: Customer[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('customers'), JSON.stringify(c));
	}
}

let customerItems = $state<Customer[]>(loadCustomers());

export const customersStore = {
	get items() { return customerItems; },
	set items(v: Customer[]) { customerItems = v; saveCustomers(v); },

	add(item: Omit<Customer, 'id'>) {
		const id = customerItems.length > 0 ? Math.max(...customerItems.map(c => c.id)) + 1 : 1;
		customerItems = [...customerItems, { id, ...item }];
		saveCustomers(customerItems);
	},

	update(id: number, fields: Partial<Omit<Customer, 'id'>>) {
		customerItems = customerItems.map(c => c.id === id ? { ...c, ...fields } : c);
		saveCustomers(customerItems);
	},

	remove(id: number) {
		customerItems = customerItems.filter(c => c.id !== id);
		saveCustomers(customerItems);
	}
};

// Cart (not persisted, cleared on branch switch)
export interface CartItem { item: MenuItem; qty: number; }

let cartItems = $state<CartItem[]>([]);

export const cartStore = {
	get items() { return cartItems; },
	set items(v: CartItem[]) { cartItems = v; },

	get count() { return cartItems.reduce((sum, c) => sum + c.qty, 0); },
	get total() { return cartItems.reduce((sum, c) => sum + c.qty * c.item.price, 0); },

	add(item: MenuItem, qty: number) {
		const existing = cartItems.find(c => c.item.id === item.id);
		if (existing) {
			existing.qty += qty;
			cartItems = [...cartItems];
		} else {
			cartItems = [...cartItems, { item, qty }];
		}
	},

	set(item: MenuItem, qty: number) {
		if (qty <= 0) {
			cartItems = cartItems.filter(c => c.item.id !== item.id);
			return;
		}
		const existing = cartItems.find(c => c.item.id === item.id);
		if (existing) {
			existing.qty = qty;
			cartItems = [...cartItems];
		} else {
			cartItems = [...cartItems, { item, qty }];
		}
	},

	qtyOf(id: number): number {
		return cartItems.find(c => c.item.id === id)?.qty ?? 0;
	},

	remove(id: number) {
		cartItems = cartItems.filter(c => c.item.id !== id);
	},

	clear() {
		cartItems = [];
	}
};

// Purchases
export interface PurchaseItem {
	id: number;
	name: string;
	qty: number;
	price: number;
}

export interface StateHistoryEntry {
	status: string;
	date: string;
}

export interface Purchase {
	items: PurchaseItem[];
	total: number;
	date: string;
	status: string;
	customer?: { name: string; phone: string };
	table?: { id: number; label: string };
	reservationId?: number;
	stateHistory?: StateHistoryEntry[];
}

function getDefaultPurchases(): Purchase[] {
	return getBranchData(currentBranchId).purchases as Purchase[];
}

function loadPurchases(): Purchase[] {
	const defaults = getDefaultPurchases();
	if (typeof localStorage === 'undefined') return defaults;
	const raw = localStorage.getItem(branchKey('purchases'));
	if (!raw) return defaults;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed;
		return defaults;
	} catch { return defaults; }
}

function savePurchases(p: Purchase[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('purchases'), JSON.stringify(p));
	}
}

let purchaseItems = $state<Purchase[]>(loadPurchases());

export const purchasesStore = {
	get items() { return purchaseItems; },
	set items(v: Purchase[]) { purchaseItems = v; savePurchases(v); },

	add(purchase: Purchase) {
		purchaseItems = [purchase, ...purchaseItems];
		savePurchases(purchaseItems);
	},

	update(index: number, fields: Partial<Purchase>) {
		purchaseItems = purchaseItems.map((p, i) => i === index ? { ...p, ...fields } : p);
		savePurchases(purchaseItems);
	},

	remove(index: number) {
		purchaseItems = purchaseItems.filter((_, i) => i !== index);
		savePurchases(purchaseItems);
	}
};

// Order States (which states are enabled for order flow)
export type OrderState = 'preparing' | 'served' | 'billing';

export const ALL_ORDER_STATES: { value: OrderState; label: string }[] = [
	{ value: 'preparing', label: 'Preparing' },
	{ value: 'served', label: 'Served' },
	{ value: 'billing', label: 'Billing' }
];

function getDefaultOrderStates(): OrderState[] {
	return ['preparing', 'served', 'billing'];
}

function loadOrderStates(): OrderState[] {
	const defaults = getDefaultOrderStates();
	if (typeof localStorage === 'undefined') return defaults;
	const raw = localStorage.getItem(branchKey('order-states'));
	if (!raw) return defaults;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed;
		return defaults;
	} catch { return defaults; }
}

function saveOrderStates(states: OrderState[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('order-states'), JSON.stringify(states));
	}
}

let orderStates = $state<OrderState[]>(loadOrderStates());

export const orderStatesStore = {
	get states() { return orderStates; },
	set states(v: OrderState[]) { orderStates = v; saveOrderStates(v); },

	isEnabled(state: OrderState): boolean {
		return orderStates.includes(state);
	},

	toggle(state: OrderState) {
		if (orderStates.includes(state)) {
			orderStates = orderStates.filter(s => s !== state);
		} else {
			orderStates = [...orderStates, state];
		}
		saveOrderStates(orderStates);
	}
};

// Page config
interface PageConfig {
	title: string;
	description: string;
}

function getDefaultPage(): PageConfig {
	const branchInfo = getBranchInfo(currentBranchId);
	return {
		title: branchInfo.name || 'Home',
		description: branchInfo.description || 'Welcome to MyApp. Use the sidebar to navigate between pages.'
	};
}

function loadPage(): PageConfig {
	const defaultPage = getDefaultPage();
	if (typeof localStorage === 'undefined') return defaultPage;
	const raw = localStorage.getItem(branchKey('quick-actions-page'));
	if (!raw) return defaultPage;
	try { return { ...defaultPage, ...JSON.parse(raw) }; } catch { return defaultPage; }
}

function savePage(p: PageConfig) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('quick-actions-page'), JSON.stringify(p));
	}
}

let pageConfig = $state<PageConfig>(loadPage());

export const pageStore = {
	get title() { return pageConfig.title; },
	set title(v: string) { pageConfig = { ...pageConfig, title: v }; savePage(pageConfig); },
	get description() { return pageConfig.description; },
	set description(v: string) { pageConfig = { ...pageConfig, description: v }; savePage(pageConfig); }
};

// Quick actions
function getDefaultActions(): QuickAction[] {
	const branchInfo = getBranchInfo(currentBranchId);
	const socialUrl = branchInfo.socialMedia?.instagram || branchInfo.socialMedia?.facebook || branchInfo.socialMedia?.twitter || '';
	return [
		{ id: 1, type: 'phone', label: 'Phone', icon: ACTION_TYPES.phone.icon, value: branchInfo.phone || '', href: branchInfo.phone ? buildHref('phone', branchInfo.phone) : '' },
		{ id: 2, type: 'navigation', label: 'Address', icon: ACTION_TYPES.navigation.icon, value: branchInfo.address || '', href: branchInfo.address ? buildHref('navigation', branchInfo.address) : '' },
		{ id: 3, type: 'social', label: 'Social Media', icon: ACTION_TYPES.social.icon, value: socialUrl, href: socialUrl },
		{ id: 4, type: 'link', label: 'Email', icon: ACTION_TYPES.link.icon, value: branchInfo.email ? `mailto:${branchInfo.email}` : '', href: branchInfo.email ? `mailto:${branchInfo.email}` : '' }
	];
}

function isValid(arr: unknown[]): arr is QuickAction[] {
	return arr.every(a => typeof a === 'object' && a !== null && 'type' in a && (a as QuickAction).type in ACTION_TYPES);
}

function load(): QuickAction[] {
	const defaults = getDefaultActions();
	if (typeof localStorage === 'undefined') return defaults;
	const raw = localStorage.getItem(branchKey('quick-actions'));
	if (!raw) return defaults;
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && isValid(parsed)) return parsed;
		localStorage.removeItem(branchKey('quick-actions'));
		return defaults;
	} catch { return defaults; }
}

function save(items: QuickAction[]) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(branchKey('quick-actions'), JSON.stringify(items));
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
