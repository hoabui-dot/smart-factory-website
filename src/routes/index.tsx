import { Navigate, Route, Routes } from 'react-router'

import { AuditViewerPage } from '@/modules/audit_log'
import { FileStorageAdminPage } from '@/modules/file_storage'
import { LocationMasterPage } from '@/modules/bin_location'
import { BomPage } from '@/modules/bom'
import { SharedContentPage } from '@/modules/cross_entity_content'
import { GoodsReceiptPage } from '@/modules/goods_receipt'
import { GoodsIssuePage } from '@/modules/goods_issue'
import { InventoryPage, StocktakePage } from '@/modules/inventory'
import { ItemMasterPage } from '@/modules/item_master'
import { LotManagementPage } from '@/modules/lot_management'
import { PrintQueueAdminPage } from '@/modules/label_printing'
import { EventMonitorPage } from '@/modules/realtime_event_stream'
import { ImportExportCenterPage } from '@/modules/excel_import_export'
import { NotificationCenterPage } from '@/modules/notification_center'
import {
  NotificationDeliveryAdminPage,
  NotificationSettingsPage,
} from '@/modules/notification_delivery'
import { ChecksheetPage } from '@/modules/qc_master'
import { InspectionResultPage } from '@/modules/inspection_result'
import { NcrPage } from '@/modules/qc_report'
import { DocumentPage } from '@/modules/document_management'
import { TraceabilityPage } from '@/modules/traceability'
import { ProductionMonitorPage } from '@/modules/station_execution'
import {
  DirectorDashboardRedirect,
  ProductionDashboardPage,
} from '@/modules/production_report'
import { EngineeringChangePage } from '@/modules/engineering_change'
import { CustomerMasterPage, CustomerOrderPage } from '@/modules/customer_order'
import { RoutingPage } from '@/modules/routing'
import { ShiftSkillPage } from '@/modules/shift_management'
import { SupplierMasterPage } from '@/modules/supplier_master'
import { WorkOrderPage } from '@/modules/work_order'
import { WorkerJobConsolePage } from '@/modules/worker_scheduling'
import {
  ApprovalInboxPage,
  MyWorkPage,
  RefDataHubPage,
  WO360Page,
} from '@/modules/user_aggregator'
import { IdentityAdminPage } from '@/modules/identity_access_management/pages/IdentityAdminPage'
import { LoginPage } from '@/modules/identity_access_management/pages/LoginPage'
import { RbacAdminPage } from '@/modules/rbac_engine'

import {
  AuthBootstrap,
  NotFoundPage,
  RequireAuth,
  ShellAdminPage,
  ShellHomePage,
  ShellReportsPage,
} from './shell'

export function AppRoutes() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<ShellHomePage />} />
          <Route path="/admin" element={<ShellAdminPage />} />
          <Route path="/web/admin/users" element={<IdentityAdminPage />} />
          <Route path="/web/admin/audit-logs" element={<AuditViewerPage />} />
          <Route path="/web/admin/rbac" element={<RbacAdminPage />} />
          <Route path="/web/admin/files" element={<FileStorageAdminPage />} />
          <Route path="/web/admin/print-queue" element={<PrintQueueAdminPage />} />
          <Route path="/web/admin/events" element={<EventMonitorPage />} />
          <Route path="/web/import-export" element={<ImportExportCenterPage />} />
          <Route path="/web/notifications" element={<NotificationCenterPage />} />
          <Route
            path="/web/admin/notification-delivery"
            element={<NotificationDeliveryAdminPage />}
          />
          <Route path="/web/settings/notifications" element={<NotificationSettingsPage />} />
          <Route path="/web/admin/worker-jobs" element={<WorkerJobConsolePage />} />
          <Route path="/web/mes/items" element={<ItemMasterPage />} />
          <Route path="/web/wms/locations" element={<LocationMasterPage />} />
          <Route path="/web/mes/routings" element={<RoutingPage />} />
          <Route path="/web/mes/boms" element={<BomPage />} />
          <Route path="/web/mes/work-orders" element={<WorkOrderPage />} />
          <Route path="/web/mes/shifts" element={<ShiftSkillPage />} />
          <Route path="/web/wms/suppliers" element={<SupplierMasterPage />} />
          <Route path="/web/wms/lots" element={<LotManagementPage />} />
          <Route path="/web/wms/goods-receipts" element={<GoodsReceiptPage />} />
          <Route path="/web/wms/goods-issues" element={<GoodsIssuePage />} />
          <Route path="/web/wms/inventory" element={<InventoryPage />} />
          <Route path="/web/wms/stocktakes" element={<StocktakePage />} />
          <Route path="/web/qms/checksheets" element={<ChecksheetPage />} />
          <Route path="/web/qms/inspection-results" element={<InspectionResultPage />} />
          <Route path="/web/qms/ncrs" element={<NcrPage />} />
          <Route path="/web/qms/documents" element={<DocumentPage />} />
          <Route path="/web/mes/traceability" element={<TraceabilityPage />} />
          <Route path="/web/mes/production-logs" element={<ProductionMonitorPage />} />
          <Route path="/web/mes/dashboards" element={<ProductionDashboardPage />} />
          <Route path="/web/mes/change-requests" element={<EngineeringChangePage />} />
          <Route path="/web/mes/customers" element={<CustomerMasterPage />} />
          <Route path="/web/mes/customer-orders" element={<CustomerOrderPage />} />
          <Route path="/web/shared/entities" element={<SharedContentPage />} />
          <Route path="/web/shared/my-work" element={<MyWorkPage />} />
          <Route path="/web/shared/wo-360/:workOrderId" element={<WO360Page />} />
          <Route path="/web/shared/approval-inbox" element={<ApprovalInboxPage />} />
          <Route path="/web/admin/ref-data" element={<RefDataHubPage />} />
          <Route
            path="/web/shared/entities/:entityType/:entityId/content"
            element={<SharedContentPage />}
          />
          <Route path="/reports" element={<ShellReportsPage />} />
          <Route path="/dashboard" element={<DirectorDashboardRedirect />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthBootstrap>
  )
}
