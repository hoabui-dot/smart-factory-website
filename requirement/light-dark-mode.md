ROLE
You are a senior UI/UX designer and frontend engineer refining the existing SmartFactory dark/light theme system. This is a visual/token-only change. Do not touch API calls, business logic, RBAC, or state machine behavior — only CSS variables, Tailwind classes, and component styling.

PROBLEM TO FIX
The current dark theme lacks a proper elevation system: the sidebar, page canvas, and cards all sit at nearly the same navy lightness, so users cannot visually separate navigation from content from cards. Borders are nearly invisible. Text hierarchy (primary/secondary/muted) is too flat to scan quickly. Semantic colors (danger/success/warning/info) reuse the same hex values as light mode, which reduces legibility on dark surfaces. Empty states have no visual weight. Icon colors are applied decoratively instead of semantically.

GOAL
Redesign the token system in src/styles/tokens.css around a 4-step elevation ramp for BOTH themes, and apply it consistently across the app via existing CSS variables — no component should hardcode a hex color; everything must reference var(--surface-*), var(--text-*), var(--border-*), etc.

TOKEN SPEC — implement exactly these values as CSS custom properties, keeping existing token names where they already exist and adding new ones where needed:

Light mode (:root):
--surface-0: #f4f6fb;   /* page canvas */
--surface-1: #ffffff;   /* in-flow card */
--surface-2: #eef1f6;   /* nested panel, table header row, input background */
--surface-3: #ffffff;   /* popover/modal — pair with a stronger box-shadow (--shadow-lg) since light mode can use shadows for depth */
--border-default: #e2e8f0;
--border-strong: #cbd5e1;
--text-primary: #0f172a;
--text-secondary: #475569;
--text-muted: #94a3b8;
--color-danger-text: #dc2626;
--color-success-text: #16a34a;
--color-warning-text: #d97706;
--color-info-text: #1d4ed8;

Dark mode ([data-theme="dark"]):
--surface-0: #0a0e1a;   /* page canvas — darkest */
--surface-1: #131a2b;   /* in-flow card — one step lighter than page */
--surface-2: #1a2338;   /* nested panel, table header row, input background — one more step lighter */
--surface-3: #202a42;   /* popover/modal/dropdown — lightest surface, since shadows barely read on dark backgrounds, depth here comes from lightness + border, not shadow */
--border-default: rgba(255,255,255,0.08);
--border-strong: rgba(255,255,255,0.16);
--text-primary: #f1f5f9;   /* not pure white — avoids glare */
--text-secondary: #a8b3c7;
--text-muted: #6b7690;
--color-danger-text: #f87171;   /* brighter than light mode's #dc2626 — needed for legibility on dark bg */
--color-success-text: #4ade80;
--color-warning-text: #fbbf24;
--color-info-text: #60a5fa;

Keep --color-nav-surface (#11192d) as-is in both themes — it's the fixed brand navy for the sidebar/header, not part of the elevation ramp; it should sit visually between --surface-0 and --surface-1 in perceived darkness so the sidebar reads as a distinct "frame" around the content, not as one more content layer.

APPLICATION RULES
1. Page background → --surface-0. Card/container background → --surface-1 with a 1px border in --border-default. Table header row, filter bar background, input fields, and any panel nested inside a card → --surface-2. Modals, dropdowns, tooltips, and popovers → --surface-3 with --border-strong.
2. Every text element must pick one of --text-primary / --text-secondary / --text-muted based on actual information hierarchy — headings and primary values use --text-primary, field labels and supporting copy use --text-secondary, placeholders/hints/timestamps use --text-muted. Audit every page for text colors that don't map to one of these three and fix them.
3. Badges, alert banners, and inline status text must use the *-text tokens above paired with their matching *-bg token (already defined for dark mode in tokens.css) — never reuse a light-mode semantic hex directly inside a dark surface.
4. Icon color discipline: green/red/amber are reserved exclusively for status meaning (active/inactive, success/error, warning) — action icons (create, search, filter, export) must use --color-action-primary (blue) or --text-secondary (neutral outline), never green/red/amber unless they represent a real status.
5. Empty states must include: a muted icon, a --text-primary headline naming the empty space (e.g. "Chưa có lô nạp dữ liệu"), and a --text-secondary one-line hint or CTA — not a single muted sentence floating in a table.
6. Add or confirm a visible focus-visible ring (2px solid var(--color-action-primary), 2px offset) on all interactive elements in both themes for keyboard accessibility.
7. Row hover/active states in tables: hover → --surface-2, active/selected row → --surface-2 plus a left accent border in --color-action-primary, so selection is visible without relying on color alone.

DELIVERY
- Update tokens.css with the full ramp above for both [data-theme="light"] (or :root) and [data-theme="dark"].
- Grep the codebase for hardcoded hex/rgb color values in components (bg-[#...], color: #..., inline styles) and replace them with the corresponding CSS variable.
- After the refactor, do a self-review pass on at least: ImportExportCenterPage, ItemMasterPage, WorkOrderPage, NcrPage, and the shared DataTablePagination/FilterBar/ConfirmDialog components, confirming each surface level, text tier, and semantic color follows the rules above in both themes.
- Do not change any component's props, data fetching, or API request/response handling — this is a pure visual token and class refactor.
- Summarize which files were touched and confirm no functional/API behavior changed.