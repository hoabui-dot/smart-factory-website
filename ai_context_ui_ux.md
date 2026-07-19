# AI Context: SmartFactory UI/UX Architecture & Page Directory

This document provides a comprehensive overview of the UI/UX architecture, layout patterns, and directory of all **39 pages** in the SmartFactory web application codebase. It is designed to serve as an AI context file for developers and AI assistants to understand the design system, navigation routes, user roles, state management, and view structures across the application.

---

## 1. Global UI/UX Framework

The SmartFactory frontend is built using **React 19**, **React Router 7**, **Zustand**, and **CSS variables (semantic design tokens)**.

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

### B. Master Layout: App Shell (`src/shared/components/layout/AppLayout.tsx`)
All authenticated pages are wrapped in `AppLayout`. This component provides:
- **Left Sidebar**: 
  - Brand header displaying the **SmartFactory** logo.
  - Scrollable navigation list of `NAV_ITEMS`.
  - Responsive collapse: On screens **<= 900px**, the sidebar transitions into a top-horizontal wrapping navbar (`AppLayout.css`).
  - Active path highlighting using `NavLink` active classes.
- **Top Header**:
  - Displays the active page `title`.
  - Shows current user session info: `Full Name (User Code)`.
  - Includes a "Sign Out" (Đăng xuất) button.

### C. Standard UX Feedback States
Across all pages, data loading, error states, and empty queries use a standardized list message pattern:
- `loading`: Visual indicator while fetching backend resources (e.g. `Đang tải dữ liệu…`).
- `empty`: Blank slate indicator when there are zero records (e.g. `Chưa có dữ liệu.`).
- `no-result`: Message shown when search filters return zero rows (e.g. `Không có kết quả phù hợp.`).
- `permission-denied`: Block screen displayed when the user’s role is unauthorized (e.g. `Bạn không có quyền xem dữ liệu này.`).
- `error`: Error display showing specific error codes returned by the API (e.g. `ERR_CODE: message`).

---

## 2. Page Directory by Business Module

The application routing is declared in `src/routes/index.tsx`. The pages are grouped into logical business modules:

### Module A: Core & Infrastructure

#### 1. LoginPage
- **Path**: `/login`
- **Component**: [LoginPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/identity_access_management/pages/LoginPage.tsx)
- **Role**: Guest (Unauthenticated)
- **Layout**: Centered login panel card with custom branding.
- **UX Features**:
  - Dynamic login alerts driven by `resolveLoginAlert`.
  - Direct integration with Supabase Auth client via `signInWithPassword`.
  - Form validation with busy indicators during submission (`Đang đăng nhập…`).

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
- **Layout**: Structured grid list.
- **UX Features**: Administrative directory linking directly to all configuration, IAM, audit, and log sub-pages.

#### 4. IdentityAdminPage
- **Path**: `/web/admin/users`
- **Component**: [IdentityAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/identity_access_management/pages/IdentityAdminPage.tsx)
- **Role**: `system_admin` only
- **Layout**: Split-screen master-detail layout.
- **UX Features**:
  - **Left Section**: Two tabs listing active users (`User Accounts`) and factory devices (`Station Devices`).
  - **Right Detail Panel**: Form controls to modify user details, assign RBAC roles (via checkbox grid), and configure physical location scopes.
  - **Device Actions**: Admin forms to edit station type, location binding, hardware ID, or trigger a deactivation confirmation dialog modal.

#### 5. RbacAdminPage
- **Path**: `/web/admin/rbac`
- **Component**: [RbacAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/rbac_engine/pages/RbacAdminPage.tsx)
- **Role**: `system_admin`
- **Layout**: Two-column layout with left role list and right policy panel.
- **UX Features**: Visual matrix of security roles, allowing administrators to inspect active capability policies and feature toggles.

#### 6. AuditViewerPage
- **Path**: `/web/admin/audit-logs`
- **Component**: [AuditViewerPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/audit_log/pages/AuditViewerPage.tsx)
- **Role**: `system_admin`
- **Layout**: Filter bar top, split-panel table on left, event details card on right.
- **UX Features**:
  - Table showing append-only logs (`activity_events`) with columns for Code, Occurrence, Event Type, Entity Type, Action, and Business references.
  - **Details Panel**: Shows complete JSON state transition payloads (`fromState` -> `toState`), actor labels, IP addresses, and formatted previews.
  - **Export Button**: Initiates asynchronous report export jobs on the backend with real-time status banners.

#### 7. FileStorageAdminPage
- **Path**: `/web/admin/files`
- **Component**: [FileStorageAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/file_storage/pages/FileStorageAdminPage.tsx)
- **Role**: Admin
- **Layout**: Toolbar with drag-and-drop file upload zone on top; document list table below.
- **UX Features**: Upload indicators, size/extension metadata tags, soft-delete action buttons.

#### 8. PrintQueueAdminPage
- **Path**: `/web/admin/print-queue`
- **Component**: [PrintQueueAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/label_printing/pages/PrintQueueAdminPage.tsx)
- **Role**: Admin / Warehouse Operator
- **Layout**: Main data table of label requests (barcodes, lot cards, serial tags).
- **UX Features**: Real-time status trackers (Pending, Printed, Failed), option to view label ZPL/JSON payloads, and retry buttons for print failures.

#### 9. EventMonitorPage
- **Path**: `/web/admin/events`
- **Component**: [EventMonitorPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/realtime_event_stream/pages/EventMonitorPage.tsx)
- **Role**: Admin / Developer
- **Layout**: Streaming log console layout with dark command line style background.
- **UX Features**: Displays real-time WebSocket event logs, toggle switches to pause/resume stream, and severity-colored filters.

#### 10. ImportExportCenterPage
- **Path**: `/web/import-export`
- **Component**: [ImportExportCenterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/excel_import_export/pages/ImportExportCenterPage.tsx)
- **Role**: Authenticated Staff
- **Layout**: Split grids showing upload import tasks and download export tasks.
- **UX Features**: Status progress bars, error logs for failed Excel rows, file download links for generated spreadsheets.

#### 11. NotificationCenterPage
- **Path**: `/web/notifications`
- **Component**: [NotificationCenterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/notification_center/pages/NotificationCenterPage.tsx)
- **Role**: All authenticated users
- **Layout**: Center-aligned feed layout.
- **UX Features**: "Mark as read" badges, module category filters, and links directly navigating to referenced records (e.g. Work Order page).

#### 12. NotificationDeliveryAdminPage
- **Path**: `/web/admin/notification-delivery`
- **Component**: [NotificationDeliveryAdminPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/notification_delivery/pages/NotificationDeliveryAdminPage.tsx)
- **Role**: Admin
- **Layout**: System log table listing outbound messaging transactions.
- **UX Features**: Status columns for Email/SMS gateways, dispatch timestamps, and response payloads.

#### 13. NotificationSettingsPage
- **Path**: `/web/settings/notifications`
- **Component**: [NotificationSettingsPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/notification_delivery/pages/NotificationSettingsPage.tsx)
- **Role**: All users
- **Layout**: Tabbed form settings page.
- **UX Features**: Toggle switches for channels (Email, SMS, Push notifications) categorized by event types (Critical, Alert, Info).

#### 14. WorkerJobConsolePage
- **Path**: `/web/admin/worker-jobs`
- **Component**: [WorkerJobConsolePage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/worker_scheduling/pages/WorkerJobConsolePage.tsx)
- **Role**: Admin
- **Layout**: Process dashboard displaying job queues.
- **UX Features**: Metric widgets showing Active Workers, Queue Depth, and Job Performance history, with restart/stop commands.

---

### Module B: MES (Manufacturing Execution)

#### 15. ItemMasterPage
- **Path**: `/web/mes/items`
- **Component**: [ItemMasterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/item_master/pages/ItemMasterPage.tsx)
- **Role**: Engineer / Production Admin
- **Layout**: Search bar + structured grid catalog of products and components.
- **UX Features**: Category filters (Raw Material, WIP, Finished Good), revision control history, and unit of measure (UOM) badges.

#### 16. LocationMasterPage
- **Path**: `/web/wms/locations`
- **Component**: [LocationMasterPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/bin_location/pages/LocationMasterPage.tsx)
- **Role**: Logistics Manager
- **Layout**: Hierarchy tree layout of zones, aisles, racks, and bins.
- **UX Features**: Multi-level navigation tree, color tags denoting location capacity status (Empty, Partial, Full).

#### 17. RoutingPage
- **Path**: `/web/mes/routings`
- **Component**: [RoutingPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/routing/pages/RoutingPage.tsx)
- **Role**: Manufacturing Engineer
- **Layout**: Side-by-side workflow editor. Left list of routing templates, right section showing sequential steps, assigned Work Centers, and targeted cycle times.
- **UX Features**: Interactive sequence diagram, drag-and-drop routing step ordering.

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
- **Layout**: Filter form + order list table + action sidebar panel.
- **UX Features**:
  - Row selection highlights matching work orders.
  - Action buttons (`Release`, `Start`, `Pause`, `Cancel`, `Complete`) are conditionally rendered/disabled based on RBAC permissions and the work order's status state transitions.
  - Links to open the comprehensive **WO 360** profile page.

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
- **UX Features**:
  - **KPIs Tab**: Display metrics cards (Yield Rate, Scrap Rate, OEE, Loss Rate) with colorized indicators, listing work orders/machines, and date-range filters.
  - **Downtime Tab**: Machine logs tracking ongoing downtime events, downtime classifications dropdown, and export features.

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
- **UX Features**: Skill qualification flags (Advanced, Certified, Trainee) warning scheduler when machine operator qualifications are not met.

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
- **Layout**: Three-tab view:
  - **Balances Tab**: Lists inventory items by location showing On Hand, Reserved, and Available quantities.
  - **By Lot Tab**: Shows lot allocation details with quick-export options.
  - **Transactions Tab**: Master-detail table listing inventory transaction logs, with a right detail panel showing line movement items (`From` -> `To`).
- **UX Features**: "Create Transfer" modal dialog with location validation.

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
- **UX Features**: Form designer interface on one side, checklist inputs (Checkboxes, text boxes, pass/fail) with validation indicators on the other.

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
- **Layout**: Double column layout (NCR List & Actions / CAPA List).
- **UX Features**:
  - Interactive Action Panel providing state flow commands (`Start investigation`, `Contain`, `Start CAPA`, `Close`, `Void`).
  - Form dialogs to edit quantities affected and severities.
  - CAPA record grid nested within the same view, linking direct CAPA actions.

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
- **UX Features**:
  - Displays dynamic user comments stream and file attachments linked to any system entity.
  - Includes rich text editor inputs and drag-and-drop file upload.

#### 37. MyWorkPage
- **Path**: `/web/shared/my-work`
- **Component**: [MyWorkPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/MyWorkPage.tsx)
- **Role**: Operations Staff / Machine Operators
- **Layout**: Consolidated card list.
- **UX Features**:
  - Automatically fetches all active tasks assigned to the current user.
  - Groups tasks visually by origin module (MES, WMS, QMS).
  - Cards include a deep-link button mapping straight to the execution route of the specific job.

#### 38. WO360Page
- **Path**: `/web/shared/wo-360/:workOrderId`
- **Component**: [WO360Page](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/WO360Page.tsx)
- **Role**: Shift Leader / Plant Manager
- **Layout**: 360-degree aggregated profile.
- **UX Features**:
  - **Top Row**: Core Work Order KPIs (Planned Qty, Produced Qty, Scrap Qty).
  - **Grid Sections**: Renders mini-tables summarizing: BOM snapshot, Material Requests status, Production log history, Lot bindings (traceability), and QC inspection status.

#### 39. ApprovalInboxPage
- **Path**: `/web/shared/approval-inbox`
- **Component**: [ApprovalInboxPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/ApprovalInboxPage.tsx)
- **Role**: Managers / Team Leads
- **Layout**: Unified approvals queue.
- **UX Features**: Listing of pending items awaiting manager approval (e.g. NCR signoffs, Material requests, shift overrides) with quick bulk-approve button actions.

#### 40. RefDataHubPage
- **Path**: `/web/admin/ref-data`
- **Component**: [RefDataHubPage](file:///Users/hoabui/Desktop/smartfactory-web/src/modules/user_aggregator/pages/RefDataHubPage.tsx)
- **Role**: `system_admin`
- **Layout**: Multi-grid database manager console.
- **UX Features**: Status logs detailing database sync status, master record count tracking, and Excel template exports/imports.
