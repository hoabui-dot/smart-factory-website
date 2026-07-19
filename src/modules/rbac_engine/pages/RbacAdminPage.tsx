import { Link } from 'react-router'

import { useAuthStore } from '@/shared/store/authStore'
import { isSystemAdminSession } from '@/shared/api'

import { useRbacAdmin } from '../hooks/useRbacAdmin'

import './RbacAdminPage.css'

export function RbacAdminPage() {
  const session = useAuthStore((s) => s.session)
  const rbac = useRbacAdmin()

  if (!isSystemAdminSession(session)) {
    return (
      <section className="rbac-admin" aria-labelledby="rbac-title">
        <header className="rbac-admin__header">
          <div>
            <p className="rbac-admin__eyebrow">WEB-NB-02-RBAC</p>
            <h2 id="rbac-title">RBAC Admin</h2>
          </div>
          <Link to="/admin">Về quản trị</Link>
        </header>
        <div className="rbac-admin__state" role="alert">
          Bạn không có quyền xem RBAC Admin (system_admin_only).
        </div>
      </section>
    )
  }

  return (
    <section className="rbac-admin" aria-labelledby="rbac-title">
      <header className="rbac-admin__header">
        <div>
          <p className="rbac-admin__eyebrow">WEB-NB-02-RBAC · `/web/admin/rbac`</p>
          <h2 id="rbac-title">RBAC Admin</h2>
          <p className="rbac-admin__lead">
            Xem permission catalog và gán quyền theo role (NB02-001..003).
          </p>
        </div>
        <Link to="/admin">Về quản trị</Link>
      </header>

      <div className="rbac-admin__toolbar">
        <label className="rbac-admin__field">
          <span>Role</span>
          <select
            value={rbac.roleCode}
            onChange={(event) => rbac.setRoleCode(event.target.value)}
          >
            {rbac.roleCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <form
          className="rbac-admin__search"
          onSubmit={(event) => {
            event.preventDefault()
            rbac.applySearch()
          }}
        >
          <label className="rbac-admin__field">
            <span>Tìm permission (q)</span>
            <input
              value={rbac.searchInput}
              onChange={(event) => rbac.setSearchInput(event.target.value)}
              placeholder="MES-01.view.ALL…"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="rbac-admin__btn">
            Lọc
          </button>
        </form>
        <div className="rbac-admin__save-actions">
          {rbac.saveState === 'unsaved-changes' ? (
            <span className="rbac-admin__dirty" role="status">
              Có thay đổi chưa lưu
            </span>
          ) : null}
          <button
            type="button"
            className="rbac-admin__btn rbac-admin__btn--secondary"
            onClick={rbac.resetDraft}
            disabled={!rbac.dirty || rbac.saveState === 'saving'}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="rbac-admin__btn"
            onClick={() => {
              if (
                rbac.dirty &&
                window.confirm(
                  `Xác nhận thay thế toàn bộ permission của role ${rbac.roleCode}?`,
                )
              ) {
                rbac.save()
              }
            }}
            disabled={!rbac.dirty || rbac.saveState === 'saving'}
          >
            {rbac.saveState === 'saving' ? 'Đang lưu…' : 'Lưu gán quyền'}
          </button>
        </div>
      </div>

      {rbac.roleError ? (
        <p className="rbac-admin__banner rbac-admin__banner--warn" role="alert">
          {rbac.roleError.code}: {rbac.roleError.message}
        </p>
      ) : null}
      {rbac.saveError ? (
        <p className="rbac-admin__banner rbac-admin__banner--warn" role="alert">
          {rbac.saveError.code}: {rbac.saveError.message}
        </p>
      ) : null}

      {rbac.listState === 'loading' || rbac.roleLoading ? (
        <div className="rbac-admin__state" role="status">
          Đang tải RBAC…
        </div>
      ) : null}
      {rbac.listState === 'permission-denied' ? (
        <div className="rbac-admin__state" role="alert">
          Không có quyền đọc permission catalog.
        </div>
      ) : null}
      {rbac.listState === 'empty' || rbac.listState === 'no-result' ? (
        <div className="rbac-admin__state" role="status">
          {rbac.listState === 'no-result'
            ? 'Không có permission khớp bộ lọc.'
            : 'Chưa có permission trong catalog.'}
        </div>
      ) : null}
      {rbac.listState === 'error' ? (
        <div className="rbac-admin__state" role="alert">
          Không tải được catalog.
          {rbac.listError ? <p>{rbac.listError.code}</p> : null}
        </div>
      ) : null}

      {rbac.listState === 'ready' ? (
        <div className="rbac-admin__table-wrap">
          <table className="rbac-admin__table">
            <thead>
              <tr>
                <th scope="col">Gán</th>
                <th scope="col">Code</th>
                <th scope="col">Module</th>
                <th scope="col">Action</th>
                <th scope="col">Scope</th>
                <th scope="col">Apps</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {rbac.permissions.map((perm) => {
                const checked = rbac.draftCodes.includes(perm.code)
                return (
                  <tr key={perm.code}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => rbac.toggleCode(perm.code)}
                        aria-label={`Gán ${perm.code}`}
                      />
                    </td>
                    <td>
                      <code>{perm.code}</code>
                    </td>
                    <td>{perm.module_code}</td>
                    <td>{perm.action}</td>
                    <td>{perm.scope}</td>
                    <td>{perm.allowed_apps}</td>
                    <td>{perm.description}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
