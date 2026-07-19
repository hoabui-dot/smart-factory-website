import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'

import { AppLayout } from '@/shared/components/layout/AppLayout'
import { useAuthStore } from '@/shared/store/authStore'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  if (status === 'booting' || status === 'bootstrapping') {
    return (
      <div className="boot-screen" role="status">
        Đang khởi tạo phiên…
      </div>
    )
  }

  return children
}

export function RequireAuth() {
  const status = useAuthStore((s) => s.status)
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)
  const location = useLocation()

  if (status !== 'ready' || !session) {
    const returnUrl = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />
  }

  return (
    <AppLayout
      title="SmartFactory"
      userLabel={`${session.user.full_name} (${session.user.user_code})`}
      onSignOut={() => {
        void signOut()
      }}
    >
      <Outlet />
    </AppLayout>
  )
}

export function ShellHomePage() {
  return (
    <section className="shell-card">
      <h2>Trang chủ</h2>
      <p>App Shell đã sẵn sàng. Module nghiệp vụ sẽ gắn vào navigation theo RBAC.</p>
      <p>
        <Link to="/admin">Tới khu quản trị</Link>
      </p>
    </section>
  )
}

export function ShellAdminPage() {
  return (
    <section className="shell-card">
      <h2>Quản trị</h2>
      <p>Landing composite cho <code>system_admin</code> theo WEB-SCREENS §4.5.</p>
      <p>
        <Link to="/web/admin/users">Identity Admin (NB-01c/NB-01d)</Link>
      </p>
      <p>
        <Link to="/web/admin/rbac">RBAC Admin (NB-02)</Link>
      </p>
      <p>
        <Link to="/web/admin/audit-logs">Audit Viewer (NB-03)</Link>
      </p>
      <p>
        <Link to="/web/admin/files">File Storage Admin (NB-04)</Link>
      </p>
      <p>
        <Link to="/web/admin/print-queue">Print Queue Admin (NB-05)</Link>
      </p>
      <p>
        <Link to="/web/admin/events">Realtime Event Monitor (NB-06)</Link>
      </p>
      <p>
        <Link to="/web/import-export">Import / Export Center (NB-07)</Link>
      </p>
      <p>
        <Link to="/web/notifications">Notification Center (NB-08)</Link>
      </p>
      <p>
        <Link to="/web/admin/notification-delivery">Notification Delivery Admin (NB-09)</Link>
      </p>
      <p>
        <Link to="/web/settings/notifications">Notification Settings (NB-09)</Link>
      </p>
      <p>
        <Link to="/web/admin/worker-jobs">Worker Job Console (NB-10b)</Link>
      </p>
      <p>
        <Link to="/web/mes/items">Item Master (MES-01)</Link>
      </p>
      <p>
        <Link to="/web/wms/locations">Location Master (WMS-01b)</Link>
      </p>
      <p>
        <Link to="/web/mes/routings">Routing / Work Center / Machine (MES-03)</Link>
      </p>
      <p>
        <Link to="/web/mes/boms">BOM Đa cấp (MES-02)</Link>
      </p>
      <p>
        <Link to="/web/mes/work-orders">Lệnh Sản xuất / Work Order (MES-04)</Link>
      </p>
      <p>
        <Link to="/web/mes/production-logs">Production Monitor (MES-05)</Link>
      </p>
      <p>
        <Link to="/web/mes/dashboards">Production Dashboard (MES-08)</Link>
      </p>
      <p>
        <Link to="/web/mes/change-requests">Engineering Change (MES-11)</Link>
      </p>
      <p>
        <Link to="/web/mes/shifts">Shift / Skill / Training (MES-09)</Link>
      </p>
      <p>
        <Link to="/web/wms/suppliers">Supplier Master (WMS-06)</Link>
      </p>
      <p>
        <Link to="/web/wms/lots">Lot Management (WMS-02)</Link>
      </p>
      <p>
        <Link to="/web/wms/goods-receipts">Goods Receipt Review (WMS-03)</Link>
      </p>
      <p>
        <Link to="/web/wms/goods-issues">Goods Issue Monitor (WMS-04)</Link>
      </p>
      <p>
        <Link to="/web/wms/inventory">Inventory Control (WMS-05b)</Link>
      </p>
      <p>
        <Link to="/web/wms/stocktakes">Stocktake &amp; Reconciliation (WMS-05b)</Link>
      </p>
      <p>
        <Link to="/web/qms/checksheets">Tiêu chuẩn &amp; Checksheet (QMS-01)</Link>
      </p>
      <p>
        <Link to="/web/qms/inspection-results">Inspection Result Review (QMS-02)</Link>
      </p>
      <p>
        <Link to="/web/qms/ncrs">NCR &amp; Quality Reports (QMS-03a2)</Link>
      </p>
      <p>
        <Link to="/web/qms/documents">Document / PPAP (QMS-04)</Link>
      </p>
      <p>
        <Link to="/web/mes/traceability">Traceability Search (MES-07)</Link>
      </p>
      <p>
        <Link to="/web/mes/customers">Customer Master (MES-10a)</Link>
      </p>
      <p>
        <Link to="/web/mes/customer-orders">Customer Orders (MES-10a)</Link>
      </p>
      <p>
        <Link to="/web/shared/entities">Comments & Attachments (SHARED-02)</Link>
      </p>
      <p>
        <Link to="/web/shared/my-work">My Work (SHARED-01a1)</Link>
      </p>
      <p>
        <Link to="/web/shared/approval-inbox">Approval Inbox (SHARED-01d)</Link>
      </p>
      <p>
        <Link to="/web/admin/ref-data">REFDATA Hub (SHARED-01e)</Link>
      </p>
      <p>
        <Link to="/web/shared/wo-360/1">WO 360 sample (SHARED-01c)</Link>
      </p>
    </section>
  )
}

export function ShellReportsPage() {
  return (
    <section className="shell-card">
      <h2>Báo cáo</h2>
      <p>Landing composite cho <code>viewer</code> theo WEB-SCREENS §4.5.</p>
    </section>
  )
}

export function ShellDashboardPage() {
  return (
    <section className="shell-card">
      <h2>Dashboard</h2>
      <p>Landing cho <code>director</code> — feature dashboard sẽ gắn ở MES-08.</p>
    </section>
  )
}

export function NotFoundPage() {
  return (
    <section className="shell-card">
      <h2>Không tìm thấy</h2>
      <p>Route không tồn tại hoặc chưa được cấp quyền.</p>
      <Link to="/login">Về đăng nhập</Link>
    </section>
  )
}
