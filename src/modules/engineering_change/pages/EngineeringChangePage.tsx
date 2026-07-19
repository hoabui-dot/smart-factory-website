import { Link } from 'react-router'

import { useEngineeringChange } from '../hooks/useEngineeringChange'

import './EngineeringChangePage.css'

function msg(state: string): string {
  switch (state) {
    case 'loading':
      return 'Đang tải…'
    case 'empty':
      return 'Chưa có change request.'
    case 'no-result':
      return 'Không có kết quả khớp.'
    case 'permission-denied':
      return 'Bạn không có quyền xem.'
    case 'error':
      return 'Không tải được dữ liệu.'
    default:
      return ''
  }
}

export function EngineeringChangePage() {
  const e = useEngineeringChange()
  const banner = msg(e.listState)

  return (
    <section className="ecr-admin" aria-labelledby="ecr-title">
      <header className="ecr-admin__header">
        <div>
          <p className="ecr-admin__eyebrow">
            WEB-MES-11-ENGINEERING-CHANGE · `/web/mes/change-requests`
          </p>
          <h2 id="ecr-title">Engineering Change</h2>
          <p className="ecr-admin__lead">
            ECR/ECN lifecycle gated by server <code>allowed_actions</code> (không suy từ status).
          </p>
        </div>
        <Link to="/home">Về trang chủ</Link>
      </header>

      <form
        className="ecr-admin__create"
        onSubmit={(ev) => {
          ev.preventDefault()
          e.create()
        }}
      >
        <h3>Create ECR</h3>
        <label>
          change_type
          <select
            value={e.createForm.change_type}
            onChange={(ev) => e.setCreateForm({ ...e.createForm, change_type: ev.target.value })}
          >
            {['ITEM_REV', 'BOM_REV', 'ROUTING_REV', 'TOOLING', 'CONTROL_PLAN', 'MULTI'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          reason
          <input
            value={e.createForm.reason}
            onChange={(ev) => e.setCreateForm({ ...e.createForm, reason: ev.target.value })}
            required
          />
        </label>
        <label>
          impact_assessment
          <input
            value={e.createForm.impact_assessment}
            onChange={(ev) =>
              e.setCreateForm({ ...e.createForm, impact_assessment: ev.target.value })
            }
            required
          />
        </label>
        <label>
          target_item_id (optional)
          <input
            type="number"
            value={e.createForm.target_item_id ?? ''}
            onChange={(ev) =>
              e.setCreateForm({
                ...e.createForm,
                target_item_id: ev.target.value ? Number(ev.target.value) : null,
              })
            }
          />
        </label>
        <button type="submit" disabled={e.createPending}>
          Tạo
        </button>
        {e.createError ? (
          <p className="ecr-admin__error" role="alert">
            {e.createError.code}: {e.createError.message}
          </p>
        ) : null}
      </form>

      <form
        className="ecr-admin__filters"
        onSubmit={(ev) => {
          ev.preventDefault()
          e.applySearch()
        }}
      >
        <input
          value={e.searchInput}
          onChange={(ev) => e.setSearchInput(ev.target.value)}
          placeholder="Tìm code"
        />
        <button type="submit">Lọc</button>
      </form>

      {banner ? (
        <p className="ecr-admin__state" role="status">
          {banner}
          {e.listError ? ` (${e.listError.code})` : ''}
        </p>
      ) : null}

      {e.listState === 'ready' ? (
        <div className="ecr-admin__layout">
          <div className="ecr-admin__table-wrap">
            <table className="ecr-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {e.rows.map((row) => (
                  <tr key={row.code} className={row.code === e.selectedCode ? 'active' : ''}>
                    <td>
                      <button type="button" className="linkish" onClick={() => e.select(row.code)}>
                        {row.code}
                      </button>
                    </td>
                    <td>{row.changeType}</td>
                    <td>{row.itemLabel}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {e.hasMore ? (
              <button type="button" onClick={e.loadMore}>
                Tải thêm
              </button>
            ) : null}
          </div>

          {e.detailLoading ? (
            <div className="ecr-admin__state">Đang tải chi tiết…</div>
          ) : e.detail && e.detailRow ? (
            <aside className="ecr-admin__detail">
              <h3>{e.detail.code}</h3>
              <p>
                {e.detailRow.status} · {e.detailRow.changeType} · {e.detailRow.itemLabel}
              </p>
              <p>{e.detailRow.reason}</p>

              {e.detailRow.canUpdate ? (
                <form
                  onSubmit={(ev) => {
                    ev.preventDefault()
                    e.saveUpdate()
                  }}
                >
                  <h4>Update (DRAFT)</h4>
                  <label>
                    reason
                    <input
                      value={e.editForm.reason ?? e.detail.reason}
                      onChange={(ev) => e.setEditForm({ ...e.editForm, reason: ev.target.value })}
                    />
                  </label>
                  <button type="submit" disabled={e.updatePending}>
                    Lưu
                  </button>
                </form>
              ) : null}

              <div className="ecr-admin__actions">
                <button
                  type="button"
                  disabled={!e.detailRow.canSubmit || e.lifecyclePending}
                  onClick={() => e.runLifecycle('submit')}
                >
                  Submit
                </button>
                <button
                  type="button"
                  disabled={!e.detailRow.canStartReview || e.lifecyclePending}
                  onClick={() => e.runLifecycle('start_review')}
                >
                  Start review
                </button>
                <button
                  type="button"
                  disabled={!e.detailRow.canApprove || e.lifecyclePending}
                  onClick={() => e.runLifecycle('approve')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={!e.detailRow.canClose || e.lifecyclePending}
                  onClick={() => e.runLifecycle('close')}
                >
                  Close
                </button>
              </div>

              {e.detailRow.canReject ? (
                <div>
                  <label>
                    reject reason
                    <input
                      value={e.rejectReason}
                      onChange={(ev) => e.setRejectReason(ev.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!e.rejectReason.trim() || e.lifecyclePending}
                    onClick={() => e.runLifecycle('reject')}
                  >
                    Reject
                  </button>
                </div>
              ) : null}

              {e.detailRow.canImplement ? (
                <div>
                  <h4>Implement links</h4>
                  <label>
                    entity_type
                    <input
                      value={e.implementLinks[0]?.target_entity_type ?? ''}
                      onChange={(ev) =>
                        e.setImplementLinks([
                          {
                            ...e.implementLinks[0],
                            target_entity_type: ev.target.value,
                            target_entity_id: e.implementLinks[0]?.target_entity_id ?? 0,
                            action: e.implementLinks[0]?.action ?? 'SUPERSEDE',
                          },
                        ])
                      }
                    />
                  </label>
                  <label>
                    entity_id
                    <input
                      type="number"
                      value={e.implementLinks[0]?.target_entity_id || ''}
                      onChange={(ev) =>
                        e.setImplementLinks([
                          {
                            ...e.implementLinks[0],
                            target_entity_type:
                              e.implementLinks[0]?.target_entity_type ?? 'BOM_HEADER',
                            target_entity_id: Number(ev.target.value),
                            action: e.implementLinks[0]?.action ?? 'SUPERSEDE',
                          },
                        ])
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={e.lifecyclePending}
                    onClick={() => e.runLifecycle('implement')}
                  >
                    Implement
                  </button>
                </div>
              ) : null}

              {e.approvals.length > 0 ? (
                <>
                  <h4>Approvals</h4>
                  <ul>
                    {e.approvals.map((a) => (
                      <li key={a.code}>
                        #{a.step_order} {a.approval_party_type} {a.role_required ?? ''} —{' '}
                        {a.decision ?? 'PENDING'}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {e.lifecycleError ? (
                <p className="ecr-admin__error" role="alert">
                  {e.lifecycleError.code}: {e.lifecycleError.message}
                </p>
              ) : null}
              {e.updateError ? (
                <p className="ecr-admin__error" role="alert">
                  {e.updateError.code}: {e.updateError.message}
                </p>
              ) : null}
            </aside>
          ) : (
            <div className="ecr-admin__state">Chọn một ECR để xem chi tiết.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}
