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

## Navigation

| Term | Meaning |
|------|---------|
| **Link / Nav link** | A single clickable item in the sidebar |
| **Active link** | The nav link matching the current route, visually highlighted |
| **Route** | A URL path handled by a `+page.svelte` file (e.g. `/dashboard`) |
| **Links array** | The data-driven list of `{ label, href, icon }` objects defining the menu |

## Responsive Behavior

| Term | Meaning |
|------|---------|
| **Desktop mode** | Viewport wider than 768px — sidebar always visible |
| **Mobile mode** | Viewport 768px or narrower — sidebar hidden, hamburger visible |
| **Slide-in** | The CSS transform animation that reveals the sidebar on mobile |
| **Breakpoint** | The 768px width threshold between desktop and mobile modes |

## State

| Term | Meaning |
|------|---------|
| **`open`** | The boolean `$state` controlling whether the sidebar is visible on mobile |
| **Page state** | The reactive `page` object from `$app/state` used for active link detection |

## Files

| Term | Path |
|------|------|
| **Layout** | `src/routes/+layout.svelte` |
| **Home page** | `src/routes/+page.svelte` |
| **Dashboard page** | `src/routes/dashboard/+page.svelte` |
| **Projects page** | `src/routes/projects/+page.svelte` |
| **Settings page** | `src/routes/settings/+page.svelte` |
