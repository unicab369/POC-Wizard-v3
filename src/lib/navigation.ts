export interface NavItem {
	label: string;
	href: string;
	icon?: string;
}

export const navItems: NavItem[] = [
	{ label: 'Home', href: '/', icon: '🏠' },
	{ label: 'Dashboard', href: '/dashboard', icon: '📊' },
	{ label: 'Projects', href: '/projects', icon: '📁' },
	{ label: 'Settings', href: '/settings', icon: '⚙️' }
];
