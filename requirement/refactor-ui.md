ROLE
You are a senior frontend engineer working inside the existing SmartFactory React 19 + React Router 7 + Zustand codebase. Your task is a UI/UX-only refactor. You must not change any backend behavior.

SCOPE — STRICTLY UI/UX ONLY
- Do NOT modify API endpoints, request payloads, response shapes, or any data returned by the backend.
- Do NOT change business logic, RBAC rules, state machine transitions, validation rules enforced server-side, or any Zustand store logic that maps directly to API contracts.
- Do NOT rename, remove, or add fields to types/interfaces that mirror API responses.
- You MAY add local UI-only state (e.g. search text, selected filter, page number, page size, dark/light theme, dialog open/close, form draft values) as long as it never gets sent to the API in a way that changes the existing request contract.
- If a UI improvement seems to require a backend change (e.g. server-side pagination, sorting, or filtering), do NOT implement it — fall back to a frontend-only equivalent instead (see Pagination section) and leave a short TODO comment explaining what a future backend change would unlock.
- Every existing API call in the codebase must remain byte-for-byte the same: same method, same URL, same query params, same request body, same response parsing.

DESIGN SYSTEM — REUSE EXISTING TOKENS, DO NOT INVENT NEW COLORS
Read src/styles/tokens.css before making any visual change. Reuse these existing tokens as-is:
- --color-nav-surface: #11192d / --color-nav-content: #e2e8f0 (sidebar/header, stays dark in both themes — it's the brand navy, not a theme-dependent surface)
- --color-page-surface: #f6f8fb (light) 
- --color-surface-card: #ffffff (light)
- --radius-card: 12px
- --color-action-primary: #1d4ed8 / --color-action-primary-hover: #1a45be
- --font-sans: IBM Plex Sans
- --color-danger / --color-danger-bg, --color-info-bg, --color-warn-bg
If dark-mode equivalents for --color-page-surface, --color-surface-card, text, and borders don't exist yet, add them as new CSS variables under a [data-theme="dark"] (or prefers-color-scheme) selector, keeping the same variable names so components don't need conditional logic — components should only ever reference var(--color-*), never hardcoded hex.

COMPONENT LIBRARY
Use shadcn/ui components (Button, Dialog, AlertDialog, Select, Input, Textarea, Table, Badge, Switch, Tabs, Checkbox, Toast/Sonner) wherever the current code uses ad-hoc markup for these patterns. Install/configure shadcn/ui via its CLI if not already present, and wire its theme to the existing CSS variables above rather than shadcn's default palette.

REQUIRED UX CHANGES (apply consistently across all 39 pages listed in the architecture doc, prioritizing list/table-heavy pages first: ItemMasterPage, WorkOrderPage, InventoryPage, LotManagementPage, NcrPage, ChecksheetPage, etc.)

1. Pagination (client-side, since current API does not support server-side pagination)
   - Default page size: 10
   - Page size selector with options: 10 / 50 / 100
   - Show "Showing X–Y of Z records"
   - Prev/Next + first/last page controls
   - Resetting filters/search must reset to page 1
   - Implement as a single reusable hook/component (e.g. usePagination or <DataTablePagination />) so it isn't duplicated per page
   - This must operate purely on data already fetched from the existing API call — do not change how or when that data is fetched

2. CRUD confirmation behavior
   - Create/Update: after the user clicks Save, show a review/confirm step (inline in the same dialog or a second step) summarizing the values before actually committing the change
   - Deactivate/status-change actions (the app uses soft-delete only — see "Bất biến chung" note: no hard delete while FK references exist): require a mandatory "Reason for change" text field before the confirm button becomes enabled, matching the existing audit requirement that all changes are logged with an updated_reason
   - Use shadcn's AlertDialog for destructive/state-changing confirmations and Dialog for create/edit forms
   - Never change what data these actions actually send to the API — only add a confirmation UI step in front of the existing submit call

3. Light / dark mode
   - Add a theme toggle in the top header (sun/moon icon)
   - Theme preference should be held in a small UI-only context/store (not the API-facing Zustand stores) 
   - Sidebar/header navy stays constant across both themes; only the page canvas, cards, borders, and text colors switch
   - All existing standard UX states (loading, empty, no-result, permission-denied, error) must be re-skinned for dark mode too, not just the happy path

4. Friendly, consistent microcopy (Vietnamese, matching existing app language)
   - Empty states should invite action, not just say "no data"
   - Error states should say what happened and use the API's returned error code/message from the existing ERR_CODE pattern (do not change how errors are parsed, only how they're displayed)
   - Toasts confirm what happened in the same verb the button used (e.g. button "Lưu" → toast "Đã lưu")

DELIVERY EXPECTATIONS
- Work module by module. For each page you touch, list exactly which files changed and confirm no API call signatures were modified.
- Add or update Storybook/unit tests only for new UI components (pagination, confirm dialogs, theme toggle) — do not touch existing API/service tests.
- If you find a page where the current UI logic is tightly coupled to API-shape assumptions (e.g. pagination params sent to the backend that are unused), flag it instead of refactoring it, since that touches the data layer.
- Summarize, at the end, every design token or shadcn component you introduced so it can be reused consistently on remaining pages.