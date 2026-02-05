# Design Language

Terms we use to communicate about the design and architecture of this app.

## Layout & Structure

| Term | Meaning |
|------|---------|
| **Shell** | The outermost layout wrapping every page (`+layout.svelte`) |
| **Sidebar** | The fixed left-hand navigation panel (250px) |
| **Content area** | The `<main>` region to the right of the sidebar where page content renders |
| **Header** | The top section of the sidebar showing the app name |
| **Backdrop** | The semi-transparent overlay behind the sidebar on mobile |
| **Hamburger** | The three-line toggle button that opens/closes the sidebar on mobile |
| **Topbar** | The fixed horizontal bar above the content area containing sublinks and topbar links |

## Navigation

| Term | Meaning |
|------|---------|
| **Link / Nav link** | A single clickable item in the sidebar |
| **Active link** | The nav link matching the current route, visually highlighted |
| **Route** | A URL path handled by a `+page.svelte` file (e.g. `/dashboard`) |
| **Links array** | The data-driven list of `{ label, href, icon }` objects defining the menu |
| **Sublinks** | Left-aligned topbar links that change based on the current route (e.g. Home1, Home2 on `/`) |
| **Sublinks map** | The `sublinks` record in the script keyed by route prefix, mapping each route to its sub-links |
| **Topbar links** | Right-aligned icon links in the topbar (Notifications, Profile) that are always visible |

