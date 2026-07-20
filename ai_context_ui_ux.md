# AI Context: SmartFactory UI/UX Architecture & Page Directory

This document provides a comprehensive overview of the UI/UX architecture, layout patterns, reusable components, and directory of all **39 pages** in the SmartFactory web application codebase. It is designed to serve as an AI context file for developers and AI assistants to understand the design system, navigation routes, user roles, state management, and view structures across the application.

---

## 1. Global UI/UX Framework

The SmartFactory frontend is built using **React 19**, **React Router 7**, **Zustand**, and **CSS variables (semantic design tokens)** with build-time compilation enabled by **Tailwind CSS v4** (`@tailwindcss/vite`).

### A. Design Tokens (`src/styles/tokens.css`)
The application defines standard visual constants at `:root`:
- **Navigation Surface**: Dark navy background (`--color-nav-surface: #11192d`) with slate white text (`--color-nav-content: #e2e8f0`).
- **Page Canvas**: Soft grey-blue background (`--color-page-surface: #f6f8fb`).
- **Cards & Containers**: Clean white cards (`--color-surface-card: #ffffff`) with rounded corners (`--radius-card: 12px`) and subtle shadows.
- **Primary Actions**: Deep blue button color (`--color-action-primary: #1d4ed8`) and hover state (`--color-action-primary-hover: #1a45be`).
- **Typography**: `IBM Plex Sans` as primary font family (`--font-sans`).
- **Feedback States**:
  - Danger/Errors: Red alerts (`--color-danger: #dc2626`, `--color-danger-bg: #fef2f2`).
  - Info: Soft blue banners (`--color-info-bg: #eff6ff`).
  - Warnings: Soft orange banners (`--color-warn-bg: #fff7ed`).

#### Dark Mode Overrides (`[data-theme="dark"]`):
When the theme state changes to dark, page canvases, borders, text, and helper alert boxes adapt automatically:
- `--color-page-surface`: `#0b0f19`
- `--color-surface-card`: `#151d30`
- `--color-text-primary`: `#f8fafc`
- `--color-text-secondary`: `#cbd5e1`
- `--color-border-default`: `#1e293b`
- `--color-row-active`: `#1e293b`
- `--color-danger-bg`: `#2d1313`
- `--color-info-bg`: `#0c1c38`
- `--color-warn-bg`: `#301f0c`

### B. Master Layout: App Shell (`src/shared/components/layout/AppLayout.tsx`)
All authenticated pages are wrapped in `AppLayout`. This component provides:
- **Left Sidebar**: 
  - Brand header displaying the **SmartFactory** logo.
  - Scrollable navigation list of `NAV_ITEMS`.
  - Responsive collapse: On screens **<= 900px**, the sidebar transitions into a top-horizontal wrapping navbar (`AppLayout.css`).
  - Active path highlighting using `NavLink` active classes.
- **Top Header**:
  - Displays the active page `title`.
  - Holds a **Theme Toggle** (sun/moon icon button) to toggle between light and dark themes using the `useTheme` hook.
  - Shows current user session info: `Full Name (User Code)`.
  - Includes a "Sign Out" (Đăng xuất) button.

---

## 2. Reusable UI Components & Hooks

To enforce consistent UX behaviors without modifying the backend APIs, the following reusable files are defined:

### A. Theme Utility (`src/shared/lib/useTheme.ts`)
- Manages local UI-only theme state (`light` vs. `dark`).
- Persists user preferences in `localStorage` as `sf-theme`.
- Automatically toggles the `data-theme` attribute on the root document element.

### B. Client-Side Pagination (`src/shared/lib/usePagination.ts` & `src/shared/components/DataTablePagination.tsx`)
Because backend APIs do not support server-side pagination for all tables, client-side pagination splits loaded lists:
- **`usePagination` Hook**: Manages page size, page math, sliced item sets, and automatically resets the current page to 1 whenever filters change or the data list size updates.
- **`<DataTablePagination />` Component**:
  - Displays records info: `"Hiển thị X–Y trong số Z bản ghi"`.
  - Offers a dropdown selector for page size (10 / 50 / 100).
  - Includes pagination buttons (First Page, Prev, Next, Last Page) utilizing Lucide icons.

### C. CRUD Confirmation Dialogs (`src/shared/components/ConfirmDialog.tsx` & `.css`)
A unified overlay dialog that prompts users before committing write mutations:
1. **`confirm-only` Mode**: Shows a summary panel listing all key-value changes (e.g. quantities, item codes, dates) to let users double-check input before saving.
2. **`reason-required` Mode**: Standardizes deactivations, voids, and status modifications. Displays a mandatory textarea asking for a "Reason for change" (Lý do thay đổi); the confirm button is disabled unless the input is at least 3 characters long. All changes are logged with an audit trail, keeping raw API requests identical.

### D. Reusable Filter Bar Component (`src/shared/components/ui/FilterBar.tsx`)
A highly generic, declarative search and filtering component:
- **Declarative Inputs**: Renders fields configured dynamically via `fields` configuration objects (`type: 'text'`, `type: 'select'`, or `type: 'radio'`).
- **Conditional Layout**: Stacks fields as a multi-column responsive grid when top labels are specified (e.g., Event Monitor), or falls back to a compact, inline single-row alignment (`flex-row items-center p-1.5 h-12`) when no labels are specified (e.g., Audit Logs, WMS Locations, My Work), saving significant screen space.
- **Action Modernization**: Features compact Lucide `<Filter size={20} />` (Apply) and `<FilterX size={20} />` (Reset) action icon buttons wrapped inside standard hover-triggered `<Tooltip />` boxes displaying clean Vietnamese descriptions ("Áp dụng lọc" / "Xóa bộ lọc").
- **Theme-Aware Style**: Seamlessly supports light and dark themes using a CSS outline ring, adaptive borders (`border-slate-200 dark:border-slate-800`), and card surfaces (`bg-white dark:bg-slate-900`).

---

## 3. Page Directory by Business Module

The application routing is declared in `src/routes/index.tsx`. The pages are grouped into logical business modules:

### Module A: Core & Infrastructure

#### 1. LoginPage
- **Path**: `/login`
- **Component**: [LoginPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/identity_access_management/pages/LoginPage.tsx)
- **Role**: Guest (Unauthenticated)
- **Layout**: Two-column layout (55% brand story / illustration blueprint panel on left, 45% login card on right) on desktop, single centered card on tablet, single column on mobile.
- **UX Features**: IBM Plex Sans typography, product branding (SmartFactory, MES, WMS, QMS), Caps Lock activation indicators, show/hide password buttons, localStorage remember-email toggles, inline errors, loading spinners, and complete removal of backend internal parameters.

#### 2. ShellHomePage
- **Path**: `/home`
- **Component**: `ShellHomePage` in [shell.tsx](file:///Users/hoabui/Desktop/smartfactory-web/src/routes/shell.tsx)
- **Role**: All authenticated roles
- **Layout**: Simple dashboard greeting card.
- **UX Features**: Provides routing gateways and system overview guidelines.

#### 3. ShellAdminPage
- **Path**: `/admin`
- **Component**: `ShellAdminPage` in [shell.tsx](file:///Users/hoabui/Desktop/smartfactory-web/src/routes/shell.tsx)
- **Role**: `system_admin` or manager roles
- **Layout**: Categorized multi-column dashboard grid layout.
- **UX Features**: Administrative directory utilizing standard `PageHeader` with breadcrumbs, linking directly to all configuration, IAM, audit, log sub-pages, production (MES), inventory (WMS), and quality (QMS).

#### 4. IdentityAdminPage
- **Path**: `/web/admin/users`
- **Component**: [IdentityAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/identity_access_management/pages/IdentityAdminPage.tsx)
- **Role**: `system_admin` only
- **Layout**: Full-width tabbed tables with details modal dialogs.
- **UX Features**:
  - Leverages the common `PageHeader` component with dynamic action buttons (Create User / Create Device).
  - Formatted tables using common Tailwind `<Table />` component and custom `Badge` indicators.
  - Dialog modals overlay (`Dialog`) for editing user details, roles checkboxes, locations, block reasons, and device registrations.
  - Custom select dropdown selector for device types.

#### 5. RbacAdminPage
- **Path**: `/web/admin/rbac`
- **Component**: [RbacAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/rbac_engine/pages/RbacAdminPage.tsx)
- **Role**: `system_admin`
- **Layout**: Toolbar top, paginated permission matrix table below.
- **UX Features**:
- Employs standard `PageHeader` layout with integrated actions.
- Dynamically alerts unsaved changes using animated badges and houses standard secondary cancel and primary save capability buttons.
- Displays permissions utilizing the generic `GenericDataTable` layout, client-side pagination (15 items per page), and checkbox matrices for roles configuration mapping.
- Features select dropdown controls for role switching.

#### 6. AuditViewerPage
- **Path**: `/web/admin/audit-logs`
- **Component**: [AuditViewerPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/audit_log/pages/AuditViewerPage.tsx)
- **Role**: `system_admin`
- **Layout**: Toolbar top, unified Table below, with modal Dialog overlays.
- **UX Features**: Logs table of `activity_events` utilizing `GenericDataTable` with client-side pagination (15 items per page). Search filters use the inline `FilterBar` component with Vietnamese placeholders and compact, hover-triggered Lucide filter action icons. Selecting a row opens a details modal overlay (`Dialog`) showing occurrences, actor labels, IP addresses, JSON state transitions, and async export triggers.

#### 7. FileStorageAdminPage
- **Path**: `/web/admin/files`
- **Component**: [FileStorageAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/file_storage/pages/FileStorageAdminPage.tsx)
- **Role**: Admin
- **Layout**: Search toolbar top, unified Table below, with modal Dialog overlays.
- **UX Features**: Size/extension metadata tags, soft-delete action buttons, file downloads. Clicking a row opens a file details modal (`Dialog`) showing checksum values, download links, and confirm-archive reason input forms.

#### 8. PrintQueueAdminPage
- **Path**: `/web/admin/print-queue`
- **Component**: [PrintQueueAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/label_printing/pages/PrintQueueAdminPage.tsx)
- **Role**: Admin / Warehouse Operator
- **Layout**: Header tab switcher (Print jobs, Printers, Templates), form panels, search toolbar, and zero-gap Table card.
- **UX Features**: Real-time status trackers (Pending, Printed, Failed), enqueue/create panels. Selecting any record opens a modal overlay (`Dialog`) showing job execution metrics, raw ZPL/JSON payloads, printer hardware details, and deactivation triggers.

#### 9. EventMonitorPage
- **Path**: `/web/admin/events`
- **Component**: [EventMonitorPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/realtime_event_stream/pages/EventMonitorPage.tsx)
- **Role**: Admin / Developer
- **Layout**: Full-width tabbed data tables for Event Outbox logs and Subscriptions, with advanced filtering panel and modal details/actions overlay.
- **UX Features**:
  - Leverages the common `PageHeader` component with dynamic actions depending on active tab.
  - Formatted tables utilizing `GenericDataTable` and custom active/inactive/warning status badges.
  - Standardized search buttons to use hover-triggered tooltip icons via the `FilterBar` component.
  - Dialog modals overlay for detailed Outbox message logs (with syntax payloads and replay commands) and active Subscription creations/revokes.

#### 10. ImportExportCenterPage
- **Path**: `/web/import-export`
- **Component**: [ImportExportCenterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/excel_import_export/pages/ImportExportCenterPage.tsx)
- **Role**: Authenticated Staff
- **Layout**: Panel configuration cards, session batches table with pagination, and modal dialog overlays.
- **UX Features**:
  - Leverages the common `PageHeader` layout with standard breadcrumbs and subtitle controls.
  - Implements custom dropdown select elements for commit and import mode configurations.
  - Standardizes the session batches list into a card container holding the paginated `<Table />` and `<DataTablePagination />` directly together with zero gaps.
  - Employs modal dialog overlay (`Dialog`) for inspecting complete batch status metrics, started/completed metadata logs, executing asynchronous validation/commit triggers, and viewing paginated lists of column error messages.

#### 11. NotificationCenterPage
- **Path**: `/web/notifications`
- **Component**: [NotificationCenterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/notification_center/pages/NotificationCenterPage.tsx)
- **Role**: All authenticated users
- **Layout**: Toolbar top, unified paginated Table below, with modal dialog overlays.
- **UX Features**:
  - Leverages the common `PageHeader` layout with integrated unread count badge, manual refresh, and "Mark all read" action controls.
  - Implements search filters, custom priority badges, and read-state indicators inside a unified Table and `DataTablePagination` card layout.
  - Opens modal dialog overlay (`Dialog`) for viewing complete notification payload, marking individual read actions, and navigating referenced deep-links.

#### 12. NotificationDeliveryAdminPage
- **Path**: `/web/admin/notification-delivery`
- **Component**: [NotificationDeliveryAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/notification_delivery/pages/NotificationDeliveryAdminPage.tsx)
- **Role**: Admin
- **Layout**: Full-width data table layout with client-side filters and details modal dialog.
- **UX Features**:
  - Leverages the common `PageHeader` layout with standard breadcrumbs and subtitle controls.
  - Formatted outbound messaging transactions inside the generic `GenericDataTable` component with custom channels/attempted badges and local pagination.
  - Standardized search buttons to use inline row icons via the `FilterBar` component.
  - Selecting a row opens logs and gateways details in a centered `<Dialog />` modal.
  - Standardized error codes and retry responses in Vietnamese.

#### 13. NotificationSettingsPage
- **Path**: `/web/settings/notifications`
- **Component**: [NotificationSettingsPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/notification_delivery/pages/NotificationSettingsPage.tsx)
- **Role**: All users
- **Layout**: Stacked vertical layout holding preferences card panel at the top, and push subscriptions card panel at the bottom, with modal dialog overlays.
- **UX Features**:
  - Leverages the common `PageHeader` layout with standard breadcrumbs and subtitle controls.
  - Hosts preferences tables (with paginated lists of event status badges) and inline configurations editing forms.
  - Handles push subscriptions (FCM / APNS / Web Push) in a paginated Table card with standard form registration, and handles subscription revoking inside a confirmation Dialog modal.

#### 14. WorkerJobConsolePage
- **Path**: `/web/admin/worker-jobs`
- **Component**: [WorkerJobConsolePage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/worker_scheduling/pages/WorkerJobConsolePage.tsx)
- **Role**: Admin
- **Layout**: Responsive filters toolbar, full-width Table card, and modal Dialog overlays.
- **UX Features**: Schedule lists utilizing `GenericDataTable` with standard pagination controls. Standardized filter buttons to use hover-triggered tooltip icons via the `FilterBar` component. Clicking a row opens a modal overlay (`Dialog`) containing details, toggle triggers, cron editor, and a sub-table of recent run history.

---

### Module B: MES (Manufacturing Execution)

#### 15. ItemMasterPage
- **Path**: `/web/mes/items`
- **Component**: [ItemMasterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/item_master/pages/ItemMasterPage.tsx)
- **Role**: Engineer / Production Admin
- **Layout**: Full-width data table layout with client-side pagination.
- **UX Refactoring**:
  - Displays the items list in a full-screen width table using `usePagination` (10 per page).
  - Clicking any table row (or item code) triggers details loading and opens a modal overlay popup (`isDetailOpen`) wrapping the item editor.
  - Triggers a `ConfirmDialog` review summary before calling `admin.create()` or saving item updates, dismissing the editor upon successful confirm.
  - Intercepts "Deactivate item" with a `reason-required` confirmation dialog.

#### 16. LocationMasterPage
- **Path**: `/web/wms/locations`
- **Component**: [LocationMasterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/bin_location/pages/LocationMasterPage.tsx)
- **Role**: Logistics Manager
- **Layout**: Three-column enterprise workspace: Cây Vị trí Tree (260px) | Bảng Location Table (flex) | Thông tin chi tiết Detail Panel (400px).
- **UX Features**: 
  - Left column renders a recursive nesting expandable tree view component with indent dashed indicators. Selecting a node filters the table results to show only that node's sub-locations.
  - Middle column holds the location details table utilizing client-side pagination (`usePagination`). Standard status badges replace plain Yes/No texts. Row selections highlight items, and double-clicking triggers selected focus.
  - Right column shows the general properties, update edit form fields, and soft-deactivate actions. Binds to `ConfirmDialog` for creation review, updates review, and deactivation reason-required alerts. Uses a descriptive icon-based empty state when no location is active.

#### 17. RoutingPage
- **Path**: `/web/mes/routings`
- **Component**: [RoutingPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/routing/pages/RoutingPage.tsx)
- **Role**: Manufacturing Engineer
- **Layout**: Side-by-side workflow editor. Left list of routing templates, right section showing sequential steps, assigned Work Centers, and targeted cycle times.
- **UX Features**: Employs standard `PageHeader` layout with standard breadcrumbs and action controls (e.g. Export / Import). Interactive sequence diagram, drag-and-drop routing step ordering. Removed technical references.

#### 18. BomPage
- **Path**: `/web/mes/boms`
- **Component**: [BomPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/bom/pages/BomPage.tsx)
- **Role**: Product Engineer
- **Layout**: Multi-level indented tree table.
- **UX Features**: Dynamic expansion of parent-child relationships, mass-balance calculators, and revision timeline selectors.

#### 19. WorkOrderPage
- **Path**: `/web/mes/work-orders`
- **Component**: [WorkOrderPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/work_order/pages/WorkOrderPage.tsx)
- **Role**: Production Scheduler / Operator
- **Layout**: Filter form + paginated order list table + action sidebar panel.
- **UX Refactoring**:
  - Implemented client-side pagination on the Work Orders table list.
  - Standardized all lifecycle transitions (Plan, Release, Pause, Resume, Close, Cancel) with ConfirmDialog overlays.
  - Pause and Cancel actions capture the state transition justifications before submitting.

#### 20. ProductionMonitorPage
- **Path**: `/web/mes/production-logs`
- **Component**: [ProductionMonitorPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/station_execution/pages/ProductionMonitorPage.tsx)
- **Role**: Line Leader / Shopfloor Operator
- **Layout**: Operator console layout optimized for large touch targets.
- **UX Features**: Live machine state widgets (Running, Idle, Faulted), yield-counters, scrap log buttons, and active crew roster list.

#### 21. ProductionDashboardPage
- **Path**: `/web/mes/dashboards`
- **Component**: [ProductionDashboardPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/production_report/pages/ProductionDashboardPage.tsx)
- **Role**: Operations Director / Manager
- **Layout**: Multi-tab layout (KPIs & Reports, Downtime) with card metrics grids.
- **UX Features**: Metric widgets, OEE charts, classification fields for downtime logs, report export jobs.

#### 22. EngineeringChangePage
- **Path**: `/web/mes/change-requests`
- **Component**: [EngineeringChangePage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/engineering_change/pages/EngineeringChangePage.tsx)
- **Role**: Quality Engineer / Plant Manager
- **Layout**: List table + Wizard creation form.
- **UX Features**: Workflow tracking (Draft, Pending Approval, Under Review, Approved, Implemented), file attachment fields, and validation steps.

#### 23. ShiftSkillPage
- **Path**: `/web/mes/shifts`
- **Component**: [ShiftSkillPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/shift_management/pages/ShiftSkillPage.tsx)
- **Role**: HR / Shift Coordinator
- **Layout**: Interactive calendar calendar/grid matching workers to active plant shifts.
- **UX Features**: Skill qualification flags warning scheduler when machine operator qualifications are not met.

#### 24. CustomerMasterPage
- **Path**: `/web/mes/customers`
- **Component**: [CustomerMasterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/customer_order/pages/CustomerMasterPage.tsx)
- **Role**: Sales / Logistics Admin
- **Layout**: Listing of clients with details panel for addresses, accounts, and contacts.
- **UX Features**: Search filters, credit status tags, and quick-add customer drawers.

#### 25. CustomerOrderPage
- **Path**: `/web/mes/customer-orders`
- **Component**: [CustomerOrderPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/customer_order/pages/CustomerOrderPage.tsx)
- **Role**: Order Administrator
- **Layout**: Order queue table tracking fulfillment stages.
- **UX Features**: Status flows (Draft, Confirmed, Picking, Shipped, Invoiced) with links to lot and item specifications.

---

### Module C: WMS (Warehouse Management)

#### 26. SupplierMasterPage
- **Path**: `/web/wms/suppliers`
- **Component**: [SupplierMasterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/supplier_master/pages/SupplierMasterPage.tsx)
- **Role**: Purchasing Manager
- **Layout**: Database listing of approved vendors.
- **UX Features**: Lead-time statistics, supplier status badges (Approved, On Hold, Blacklisted), and search inputs.

#### 27. LotManagementPage
- **Path**: `/web/wms/lots`
- **Component**: [LotManagementPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/lot_management/pages/LotManagementPage.tsx)
- **Role**: Material Controller
- **Layout**: Listing table showing batch numbers, item reference, expiry dates, and warehouse balances.
- **UX Features**: Alert banners highlighting close-to-expiry lots, print barcode button trigger, and lot lifecycle logs.

#### 28. GoodsReceiptPage
- **Path**: `/web/wms/goods-receipts`
- **Component**: [GoodsReceiptPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/goods_receipt/pages/GoodsReceiptPage.tsx)
- **Role**: Receiving Clerk
- **Layout**: Split-screen listing of supplier shipments.
- **UX Features**: Receive form modal where operators check quantities, record lot numbers, print barcode labels, and sign off on quality condition codes.

#### 29. GoodsIssuePage
- **Path**: `/web/wms/goods-issues`
- **Component**: [GoodsIssuePage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/goods_issue/pages/GoodsIssuePage.tsx)
- **Role**: Material Handler
- **Layout**: List of production pick-lists and issue slips.
- **UX Features**: Interactive pick lists highlighting source locations, lot numbers, and required issue quantities.

#### 30. InventoryPage
- **Path**: `/web/wms/inventory`
- **Component**: [InventoryPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/inventory/pages/InventoryPage.tsx)
- **Role**: Warehouse Supervisor
- **Layout**: Three-tab view: Balances, By Lot, and Transactions.
- **UX Refactoring**:
  - Unifies page lists under a shared `usePagination` instance, dynamically slicing the active tab's items.
  - Adds a "Confirm Transfer" review dialog summarizing code details before transaction dispatch.

#### 31. StocktakePage
- **Path**: `/web/wms/stocktakes`
- **Component**: [StocktakePage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/inventory/pages/StocktakePage.tsx)
- **Role**: Inventory Auditor
- **Layout**: Wizard counting interface.
- **UX Features**: Grid table to key-in counted quantities, automatic calculation of variance percentages, and verification dialog before variance post.

---

### Module D: QMS (Quality Management)

#### 32. ChecksheetPage
- **Path**: `/web/qms/checksheets`
- **Component**: [ChecksheetPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/qc_master/pages/ChecksheetPage.tsx)
- **Role**: QA Engineer / Inspector
- **Layout**: Master-Detail inspection sheet.
- **UX Features**: Form designer interface on one side, checklist inputs with validation indicators on the other.

#### 33. InspectionResultPage
- **Path**: `/web/qms/inspection-results`
- **Component**: [InspectionResultPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/inspection_result/pages/InspectionResultPage.tsx)
- **Role**: QA Inspector
- **Layout**: Tabular display of QC logs.
- **UX Features**: Large color-coded overall result tags (`PASS` / `FAIL` / `REJECT`), tolerance margin charts, and links to target work orders.

#### 34. NcrPage
- **Path**: `/web/qms/ncrs`
- **Component**: [NcrPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/qc_report/pages/NcrPage.tsx)
- **Role**: QC Manager / Supervisor
- **Layout**: Tabbed panel separating NCRs list, CAPAs list, and Pareto charts.
- **UX Refactoring**:
  - Dual pagination on NCR table and CAPA table.
  - Creates confirmation modals for Create NCR, Create CAPA, Edit NCR, and Edit CAPA.
  - Connects NCR Void state transition to a reason-required confirmation overlay.

#### 35. DocumentPage
- **Path**: `/web/qms/documents`
- **Component**: [DocumentPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/document_management/pages/DocumentPage.tsx)
- **Role**: Document Controller
- **Layout**: File library explorer with folder navigation.
- **UX Features**: Version control history table, signature status indicator, and preview file modal.

---

### Module E: Shared Aggregates & User Aggregators

#### 36. SharedContentPage
- **Path**: `/web/shared/entities` and `/web/shared/entities/:entityType/:entityId/content`
- **Component**: [SharedContentPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/cross_entity_content/pages/SharedContentPage.tsx)
- **Role**: All authenticated users
- **Layout**: Multi-purpose collaboration side panel / layout.
- **UX Features**: Context-aware comment threads and file attachments.

#### 37. MyWorkPage
- **Path**: `/web/shared/my-work`
- **Component**: [MyWorkPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/MyWorkPage.tsx)
- **Role**: Operations Staff / Machine Operators
- **Layout**: Consolidated card list.
- **UX Features**: Employs standard `PageHeader` with actions and breadcrumbs. Standardized search inputs using inline row icons via the `FilterBar` component. Automatically fetches all active tasks assigned to the current user, grouped by MES, WMS, and QMS with deep links.

#### 38. WO360Page
- **Path**: `/web/shared/wo-360/:workOrderId`
- **Component**: [WO360Page](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/WO360Page.tsx)
- **Role**: Shift Leader / Plant Manager
- **Layout**: 360-degree aggregated profile.
- **UX Features**: Renders KPI cards, detailed BOM snapshots, material requests, production logs, lot bindings, and QA metrics.

#### 39. ApprovalInboxPage
- **Path**: `/web/shared/approval-inbox`
- **Component**: [ApprovalInboxPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/ApprovalInboxPage.tsx)
- **Role**: Managers / Team Leads
- **Layout**: Unified approvals queue.
- **UX Features**: Uses standard `PageHeader` layout with standard breadcrumbs and clean metadata descriptions. Listing of pending items awaiting manager approval with quick bulk-approve button actions and detailed review overlay inside a centered modal (`Dialog`) panel.

#### 40. RefDataHubPage
- **Path**: `/web/admin/ref-data`
- **Component**: [RefDataHubPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/RefDataHubPage.tsx)
- **Role**: `system_admin`
- **Layout**: Responsive filters toolbar, full-width Table card, create card panels, and modal Dialog overlays.
- **UX Features**: Listing registry allowlist rows and fields. Selecting a record triggers edit or soft-retire modals (`Dialog`) displaying foreign key usage metrics and updated reason inputs.
