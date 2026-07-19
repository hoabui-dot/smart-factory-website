import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { useFileStorageAdmin } from '../hooks/useFileStorageAdmin'

import './FileStorageAdminPage.css'

function listStateMessage(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải danh sách file…'
    case 'empty':
      return 'Chưa có file trong hệ thống.'
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return 'Bạn không có quyền xem File Storage Admin (system_admin_only).'
    case 'error':
      return 'Không tải được danh sách file. Thử lại sau.'
    default:
      return ''
  }
}

function archiveStateMessage(state: string, message: string | null): string {
  switch (state) {
    case 'pending':
      return 'Đang lưu trữ file…'
    case 'success':
      return 'Đã lưu trữ (archive) file.'
    case 'permission-denied':
      return 'Không có quyền archive file.'
    case 'error':
      return message ?? 'Archive thất bại.'
    default:
      return ''
  }
}

export function FileStorageAdminPage() {
  const session = useAuthStore((s) => s.session)
  const admin = useFileStorageAdmin()

  if (!isSystemAdminSession(session)) {
    return (
      <section className="file-admin" aria-labelledby="file-admin-title">
        <header className="file-admin__header">
          <div>
            <p className="file-admin__eyebrow">WEB-NB-04-FILE-STORAGE</p>
            <h2 id="file-admin-title">File Storage Admin</h2>
          </div>
          <Link className="file-admin__back" to="/admin">
            Về quản trị
          </Link>
        </header>
        <div className="file-admin__state" role="alert">
          Bạn không có quyền xem File Storage Admin (system_admin_only).
        </div>
      </section>
    )
  }

  const banner = listStateMessage(admin.listState)
  const archiveBanner = archiveStateMessage(
    admin.archiveState,
    admin.archiveError?.message ?? null,
  )

  return (
    <section className="file-admin" aria-labelledby="file-admin-title">
      <header className="file-admin__header">
        <div>
          <p className="file-admin__eyebrow">WEB-NB-04-FILE-STORAGE</p>
          <h2 id="file-admin-title">File Storage Admin</h2>
          <p className="file-admin__lead">Xem, tải xuống và lưu trữ metadata file (system_admin).</p>
        </div>
        <Link className="file-admin__back" to="/admin">
          Về quản trị
        </Link>
      </header>

      <form
        className="file-admin__filters"
        onSubmit={(event) => {
          event.preventDefault()
          admin.applySearch()
        }}
      >
        <label className="file-admin__field">
          <span>Tìm kiếm</span>
          <input
            value={admin.searchInput}
            onChange={(event) => admin.setSearchInput(event.target.value)}
            placeholder="code, tên file, mime…"
          />
        </label>
        <button type="submit">Lọc</button>
        <button type="button" onClick={admin.refresh}>
          Làm mới
        </button>
      </form>

      {banner ? (
        <div className="file-admin__state" role="status">
          {banner}
        </div>
      ) : null}
      {archiveBanner ? (
        <div className="file-admin__state" role="status">
          {archiveBanner}
        </div>
      ) : null}

      <div className="file-admin__layout">
        <div className="file-admin__table-wrap">
          <table className="file-admin__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Tên file</th>
                <th>MIME</th>
                <th>Kích thước</th>
                <th>Provider</th>
                <th>Trạng thái</th>
                <th>Uploaded at</th>
              </tr>
            </thead>
            <tbody>
              {admin.rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    row.id === admin.selectedId
                      ? 'file-admin__row file-admin__row--active'
                      : 'file-admin__row'
                  }
                  onClick={() => admin.setSelectedId(row.id)}
                >
                  <td>{row.code}</td>
                  <td>{row.originalFilename}</td>
                  <td>{row.mimeType}</td>
                  <td>{row.sizeLabel}</td>
                  <td>{row.storageProvider}</td>
                  <td>{row.statusLabel}</td>
                  <td>{row.uploadedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {admin.hasMore ? (
            <button type="button" className="file-admin__more" onClick={admin.loadMore}>
              Tải thêm
            </button>
          ) : null}
        </div>

        <aside className="file-admin__detail" aria-label="Chi tiết file">
          {admin.detailRow ? (
            <>
              <h3>{admin.detailRow.code}</h3>
              <dl>
                <div>
                  <dt>Tên file</dt>
                  <dd>{admin.detailRow.originalFilename}</dd>
                </div>
                <div>
                  <dt>MIME</dt>
                  <dd>{admin.detailRow.mimeType}</dd>
                </div>
                <div>
                  <dt>Kích thước</dt>
                  <dd>{admin.detailRow.sizeLabel}</dd>
                </div>
                <div>
                  <dt>Checksum</dt>
                  <dd>{admin.detailRow.checksumPreview}</dd>
                </div>
                <div>
                  <dt>Uploaded by</dt>
                  <dd>{admin.detailRow.uploadedBy}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{admin.detailRow.statusLabel}</dd>
                </div>
              </dl>

              <div className="file-admin__actions">
                <button
                  type="button"
                  disabled={admin.detailRow.isDeleted || admin.downloadPending}
                  onClick={admin.requestDownload}
                >
                  Tải xuống
                </button>
                {!admin.detailRow.isDeleted ? (
                  <button type="button" onClick={() => admin.setConfirmArchive(true)}>
                    Archive
                  </button>
                ) : null}
              </div>

              {admin.downloadUrl ? (
                <p className="file-admin__download">
                  <a href={admin.downloadUrl} target="_blank" rel="noreferrer">
                    Mở signed download URL
                  </a>
                </p>
              ) : null}
              {admin.downloadError ? (
                <p className="file-admin__state" role="alert">
                  {admin.downloadError.message}
                </p>
              ) : null}

              {admin.confirmArchive ? (
                <div className="file-admin__confirm" role="dialog" aria-label="Xác nhận archive">
                  <p>Archive sẽ soft-delete metadata. Hành động này cần lý do.</p>
                  <label className="file-admin__field">
                    <span>Lý do</span>
                    <input
                      value={admin.archiveReason}
                      onChange={(event) => admin.setArchiveReason(event.target.value)}
                      placeholder="Lý do archive"
                    />
                  </label>
                  <div className="file-admin__actions">
                    <button
                      type="button"
                      disabled={admin.archiveReason.trim().length === 0 || admin.archiveState === 'pending'}
                      onClick={admin.requestArchive}
                    >
                      Xác nhận archive
                    </button>
                    <button type="button" onClick={() => admin.setConfirmArchive(false)}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="file-admin__muted">Chọn một file để xem chi tiết.</p>
          )}
        </aside>
      </div>
    </section>
  )
}
