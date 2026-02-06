// Branch-specific test data
import mainMenu from './branches/main/menu-items.json';
import mainCustomers from './branches/main/customers.json';
import mainPurchases from './branches/main/purchases.json';
import mainTables from './branches/main/tables.json';

import downtownMenu from './branches/downtown/menu-items.json';
import downtownCustomers from './branches/downtown/customers.json';
import downtownPurchases from './branches/downtown/purchases.json';
import downtownTables from './branches/downtown/tables.json';

import defaultMenu from './branches/default/menu-items.json';
import defaultCustomers from './branches/default/customers.json';
import defaultPurchases from './branches/default/purchases.json';
import defaultTables from './branches/default/tables.json';

export interface BranchData {
	menu: typeof defaultMenu;
	customers: typeof defaultCustomers;
	purchases: typeof defaultPurchases;
	tables: typeof defaultTables;
}

const branchDataMap: Record<string, BranchData> = {
	main: {
		menu: mainMenu,
		customers: mainCustomers,
		purchases: mainPurchases,
		tables: mainTables
	},
	downtown: {
		menu: downtownMenu,
		customers: downtownCustomers,
		purchases: downtownPurchases,
		tables: downtownTables
	}
};

const defaultData: BranchData = {
	menu: defaultMenu,
	customers: defaultCustomers,
	purchases: defaultPurchases,
	tables: defaultTables
};

export function getBranchData(branchId: string): BranchData {
	return branchDataMap[branchId] || defaultData;
}

export function getAvailableBranches(): string[] {
	return Object.keys(branchDataMap);
}
