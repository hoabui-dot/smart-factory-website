import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'

import { AppLayout } from '@/shared/components/layout/AppLayout'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
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
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Quản trị hệ thống' },
        ]}
        title="Khu vực Quản trị"
        subtitle="Quản lý cấu hình hệ thống, phân quyền người dùng, dịch vụ nền và theo dõi tiến trình hoạt động."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Hệ thống &amp; Phân quyền</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/users">Quản lý người dùng</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/rbac">Phân quyền vai trò (RBAC)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/audit-logs">Nhật ký hoạt động (Audit)</Link>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Dịch vụ &amp; Truyền thông</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/files">Quản trị Lưu trữ File</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/print-queue">Hàng đợi In ấn (Print Queue)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/events">Giám sát sự kiện hệ thống</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/notification-delivery">Nhật ký gửi thông báo (Delivery Logs)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/settings/notifications">Cài đặt thông báo</Link>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Tiến trình nghiệp vụ</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/import-export">Trung tâm xuất nhập khẩu (Import/Export)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/notifications">Trung tâm thông báo (Notification Center)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/admin/worker-jobs">Bảng điều khiển tác vụ chạy ngầm</Link>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Sản xuất (MES)</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/items">Danh mục vật tư (Item Master)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/routings">Danh mục định tuyến (Routing)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/boms">Định mức vật tư đa cấp (BOM)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/work-orders">Danh sách Lệnh sản xuất (Work Orders)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/production-logs">Nhật ký sản xuất (Production Monitor)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/dashboards">Bảng điều khiển sản xuất (Dashboard)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/change-requests">Yêu cầu thay đổi kỹ thuật (ECO)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/shifts">Quản lý Ca &amp; Kỹ năng đào tạo</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/traceability">Truy xuất nguồn gốc sản phẩm</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/customers">Danh mục khách hàng (Customer Master)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/mes/customer-orders">Đơn hàng khách hàng (Customer Orders)</Link>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Kho vận (WMS)</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/wms/locations">Sơ đồ vị trí kho (Location Master)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/wms/suppliers">Danh mục nhà cung cấp</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/wms/lots">Quản lý số lô sản phẩm (Lot Management)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/wms/goods-receipts">Phiếu nhập kho (Goods Receipts)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/wms/goods-issues">Phiếu xuất kho (Goods Issues)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/wms/inventory">Kiểm soát tồn kho (Inventory Control)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/wms/stocktakes">Kiểm kê &amp; Đối chiếu kho hàng</Link>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Chất lượng (QMS)</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/qms/checksheets">Tiêu chuẩn &amp; Checksheet giám sát</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/qms/inspection-results">Kết quả kiểm tra chất lượng</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/qms/ncrs">Báo cáo sản phẩm không phù hợp (NCR)</Link>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium" to="/web/qms/documents">Tài liệu kỹ thuật / Quy trình PPAP</Link>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-3 md:col-span-2 lg:col-span-3">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Tiện ích chung &amp; Phê duyệt</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-1">
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium block" to="/web/shared/entities">Ý kiến &amp; Đính kèm tài liệu</Link>
              <span className="text-xs text-slate-400">Quản lý phản hồi đính kèm thực thể</span>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium block" to="/web/shared/my-work">Công việc của tôi (My Work)</Link>
              <span className="text-xs text-slate-400">Danh sách nhiệm vụ cá nhân</span>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium block" to="/web/shared/approval-inbox">Hộp thư phê duyệt (Approval Inbox)</Link>
              <span className="text-xs text-slate-400">Phê duyệt yêu cầu thay đổi nghiệp vụ</span>
            </li>
            <li>
              <Link className="text-blue-600 hover:underline dark:text-blue-400 font-medium block" to="/web/admin/ref-data">Dữ liệu tham chiếu (REFDATA Hub)</Link>
              <span className="text-xs text-slate-400">Quản lý tham chiếu hệ thống</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export function ShellReportsPage() {
  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Báo cáo & Phân tích' },
        ]}
        title="Báo cáo & Phân tích"
        subtitle="Tổng hợp báo cáo hiệu suất tổng thể thiết bị, chất lượng sản phẩm và hoạt động sản xuất."
      />
      <div className="p-6 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        Landing page cho phân hệ báo cáo (Viewer) đang được tích hợp.
      </div>
    </section>
  )
}

export function ShellDashboardPage() {
  return (
    <section className="flex flex-col gap-6 font-sans">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/home' },
          { label: 'Bảng điều khiển (Dashboard)' },
        ]}
        title="Bảng điều khiển (Dashboard)"
        subtitle="Theo dõi chỉ số vận hành thời gian thực dành cho ban giám đốc và quản lý."
      />
      <div className="p-6 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        Landing page điều hành (Director Dashboard) sẽ được hiển thị qua các chỉ số sản xuất tổng hợp.
      </div>
    </section>
  )
}

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans text-center">
      <h2 className="text-3xl font-bold text-slate-850 dark:text-slate-100">404 - Không tìm thấy trang</h2>
      <p className="text-sm text-slate-500 max-w-md">
        Trang bạn đang tìm kiếm không tồn tại, đã bị di chuyển hoặc tài khoản của bạn chưa được cấp quyền truy cập.
      </p>
      <Link to="/home">
        <Button variant="primary">Trở về trang chủ</Button>
      </Link>
    </section>
  )
}
