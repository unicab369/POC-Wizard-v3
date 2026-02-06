// Branch-specific test data using numeric IDs

// Branch 1 - Main Street
import branch1Info from './branches/1/branch.json';
import branch1Menu from './branches/1/menu-items.json';
import branch1Customers from './branches/1/customers.json';
import branch1Purchases from './branches/1/purchases.json';
import branch1Tables from './branches/1/tables.json';

// Branch 2 - Downtown Plaza
import branch2Info from './branches/2/branch.json';
import branch2Menu from './branches/2/menu-items.json';
import branch2Customers from './branches/2/customers.json';
import branch2Purchases from './branches/2/purchases.json';
import branch2Tables from './branches/2/tables.json';

// Default branch (ID 0) - for new/unknown branches
import defaultBranchInfo from './branches/0/branch.json';
import defaultMenu from './branches/0/menu-items.json';
import defaultCustomers from './branches/0/customers.json';
import defaultPurchases from './branches/0/purchases.json';
import defaultTables from './branches/0/tables.json';

export interface BranchInfo {
	id: string;
	name: string;
	address: string;
	phone: string;
	email: string;
	description: string;
	hours: Record<string, { open: string; close: string; closed?: boolean }>;
	features: string[];
	socialMedia: Record<string, string>;
}

export interface BranchData {
	info: BranchInfo;
	menu: typeof defaultMenu;
	customers: typeof defaultCustomers;
	purchases: typeof defaultPurchases;
	tables: typeof defaultTables;
}

const branchDataMap: Record<string, BranchData> = {
	'1': {
		info: branch1Info as BranchInfo,
		menu: branch1Menu,
		customers: branch1Customers,
		purchases: branch1Purchases,
		tables: branch1Tables
	},
	'2': {
		info: branch2Info as BranchInfo,
		menu: branch2Menu,
		customers: branch2Customers,
		purchases: branch2Purchases,
		tables: branch2Tables
	},
	// Legacy name mappings for backwards compatibility
	'main': {
		info: branch1Info as BranchInfo,
		menu: branch1Menu,
		customers: branch1Customers,
		purchases: branch1Purchases,
		tables: branch1Tables
	},
	'downtown': {
		info: branch2Info as BranchInfo,
		menu: branch2Menu,
		customers: branch2Customers,
		purchases: branch2Purchases,
		tables: branch2Tables
	}
};

const defaultData: BranchData = {
	info: defaultBranchInfo as BranchInfo,
	menu: defaultMenu,
	customers: defaultCustomers,
	purchases: defaultPurchases,
	tables: defaultTables
};

export function getBranchData(branchId: string): BranchData {
	return branchDataMap[branchId] || defaultData;
}

export function getBranchInfo(branchId: string): BranchInfo {
	return (branchDataMap[branchId]?.info || defaultData.info);
}

export function getAvailableBranches(): { id: string; name: string }[] {
	return [
		{ id: '1', name: branch1Info.name },
		{ id: '2', name: branch2Info.name }
	];
}
