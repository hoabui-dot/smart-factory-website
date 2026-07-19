import { useState } from 'react'
import { Link } from 'react-router'

import { useNcr } from '../hooks/useNcr'
import type { CapaRecord, NcrRecord } from '../types/ncr'
import { NCR_DISPOSITIONS, NCR_SEVERITIES, NCR_SOURCES } from '../types/ncr'

import './NcrPage.css'

type Api = ReturnType<typeof useNcr>

function listStateMessage(state: string, entity: string): string {
  switch (state) {
    case 'loading':
      return `Đang tải ${entity}…`
    case 'empty':
      return `Chưa có ${entity}.`
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return `Bạn không có quyền xem ${entity}.`
    case 'error':
      return `Không tải được ${entity}. Thử lại sau.`
    default:
      return ''
  }
}

function NcrEditor({ detail, admin }: { detail: NcrRecord; admin: Api }) {
  const row = admin.detailRow
  const [qty, setQty] = useState(detail.qty_affected)
  const [severity, setSeverity] = useState(detail.severity)

  return (
    <aside className="ncr-admin__detail" aria-label="Chi tiết NCR">
      <h3>{detail.code}</h3>
      <p className="ncr-admin__muted">
        {row?.itemLabel ?? '-'} · {detail.status} · {detail.source}
      </p>
      <dl className="ncr-admin__meta">
        <div>
          <dt>Lot</dt>
          <dd>{row?.lotLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Defect</dt>
          <dd>{row?.defectLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Work order</dt>
          <dd>{row?.workOrderLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Disposition</dt>
          <dd>{row?.disposition ?? '-'}</dd>
        </div>
        <div>
          <dt>Opened</dt>
          <dd>
            {row?.openedAt ?? '-'} · {row?.openedByLabel ?? '-'}
          </dd>
        </div>
      </dl>

      {row?.canUpdate ? (
        <form
          className="ncr-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitUpdate({ qty_affected: qty, severity })
          }}
        >
          <label className="ncr-admin__field">
            <span>Qty affected</span>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </label>
          <label className="ncr-admin__field">
            <span>Severity</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {NCR_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="ncr-admin__btn" disabled={admin.updateUi === 'pending'}>
            Lưu thay đổi
          </button>
        </form>
      ) : null}

      <div className="ncr-admin__actions">
        {row?.canStartInvestigation ? (
          <button type="button" onClick={() => admin.setConfirmStartInv(true)}>
            Start investigation
          </button>
        ) : null}
        {row?.canContain ? (
          <button type="button" onClick={() => admin.openContain()}>
            Contain
          </button>
        ) : null}
        {row?.canStartCapa ? (
          <button type="button" onClick={() => admin.setConfirmStartCapa(true)}>
            Start CAPA
          </button>
        ) : null}
        {row?.canClose ? (
          <button type="button" onClick={() => admin.setShowClose(true)}>
            Close
          </button>
        ) : null}
        {row?.canVoid ? (
          <button type="button" className="ncr-admin__btn--danger" onClick={() => admin.setShowVoid(true)}>
            Void
          </button>
        ) : null}
        <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.openCapaCreateFromNcr()}>
          Tạo CAPA
        </button>
        <Link to={`/web/shared/entities/non_conformance_report/${detail.id}/content`}>
          Comments / Attachments
        </Link>
      </div>

      {admin.confirmStartInv ? (
        <div className="ncr-admin__dialog" role="dialog" aria-label="Xác nhận start investigation">
          <p>Chuyển NCR sang INVESTIGATING?</p>
          <div className="ncr-admin__actions">
            <button type="button" onClick={() => admin.submitStartInv()} disabled={admin.startInvUi === 'pending'}>
              Xác nhận
            </button>
            <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setConfirmStartInv(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showContain ? (
        <div className="ncr-admin__dialog" role="dialog" aria-label="Contain NCR">
          <label className="ncr-admin__field">
            <span>Disposition</span>
            <select
              value={admin.containForm.disposition}
              onChange={(e) =>
                admin.setContainForm({ ...admin.containForm, disposition: e.target.value })
              }
            >
              {NCR_DISPOSITIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="ncr-admin__field">
            <span>Lot code</span>
            <input
              value={admin.containForm.disposition_scope.lot_code}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    lot_code: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="ncr-admin__field">
            <span>Qty</span>
            <input
              type="number"
              min={0.0001}
              step="any"
              value={admin.containForm.disposition_scope.qty}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    qty: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label className="ncr-admin__field">
            <span>From location (optional)</span>
            <input
              value={admin.containForm.disposition_scope.from_location_code ?? ''}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    from_location_code: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="ncr-admin__field">
            <span>To location / quarantine (optional)</span>
            <input
              value={admin.containForm.disposition_scope.to_location_code ?? ''}
              onChange={(e) =>
                admin.setContainForm({
                  ...admin.containForm,
                  disposition_scope: {
                    ...admin.containForm.disposition_scope,
                    to_location_code: e.target.value,
                  },
                })
              }
            />
          </label>
          {admin.containErrors.length ? (
            <p className="ncr-admin__error">Thiếu: {admin.containErrors.join(', ')}</p>
          ) : null}
          {admin.containError ? (
            <p className="ncr-admin__error" role="alert">
              {admin.containError.code}: {admin.containError.message}
            </p>
          ) : null}
          <div className="ncr-admin__actions">
            <button type="button" onClick={() => admin.submitContain()} disabled={admin.containUi === 'pending'}>
              Xác nhận contain
            </button>
            <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setShowContain(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.confirmStartCapa ? (
        <div className="ncr-admin__dialog" role="dialog" aria-label="Xác nhận start CAPA">
          <p>Chuyển NCR sang CAPA_IN_PROGRESS?</p>
          <div className="ncr-admin__actions">
            <button type="button" onClick={() => admin.submitStartCapa()} disabled={admin.startCapaUi === 'pending'}>
              Xác nhận
            </button>
            <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setConfirmStartCapa(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showClose ? (
        <div className="ncr-admin__dialog" role="dialog" aria-label="Close NCR">
          <label className="ncr-admin__field">
            <span>Evidence file ids (NB-04, comma-separated)</span>
            <input
              value={admin.evidenceRaw}
              onChange={(e) => admin.setEvidenceRaw(e.target.value)}
              placeholder="101, 102"
            />
          </label>
          {admin.closeErrors.length ? (
            <p className="ncr-admin__error">Thiếu: {admin.closeErrors.join(', ')}</p>
          ) : null}
          {admin.closeError ? (
            <p className="ncr-admin__error" role="alert">
              {admin.closeError.code}: {admin.closeError.message}
            </p>
          ) : null}
          <div className="ncr-admin__actions">
            <button type="button" onClick={() => admin.submitClose()} disabled={admin.closeUi === 'pending'}>
              Xác nhận close
            </button>
            <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setShowClose(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showVoid ? (
        <div className="ncr-admin__dialog" role="dialog" aria-label="Void NCR">
          <p>Void không thể hoàn tác. Nhập lý do (bắt buộc).</p>
          <label className="ncr-admin__field">
            <span>Reason</span>
            <textarea
              value={admin.voidForm.reason}
              onChange={(e) => admin.setVoidForm({ reason: e.target.value })}
            />
          </label>
          {admin.voidErrors.length ? (
            <p className="ncr-admin__error">Thiếu: {admin.voidErrors.join(', ')}</p>
          ) : null}
          {admin.voidError ? (
            <p className="ncr-admin__error" role="alert">
              {admin.voidError.code}: {admin.voidError.message}
            </p>
          ) : null}
          <div className="ncr-admin__actions">
            <button
              type="button"
              className="ncr-admin__btn--danger"
              onClick={() => admin.submitVoid()}
              disabled={admin.voidUi === 'pending'}
            >
              Xác nhận void
            </button>
            <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setShowVoid(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.updateError ? (
        <p className="ncr-admin__error" role="alert">
          {admin.updateError.code}: {admin.updateError.message}
        </p>
      ) : null}
    </aside>
  )
}

function CapaEditor({ detail, admin }: { detail: CapaRecord; admin: Api }) {
  const row = admin.capaDetailRow
  const [rootCause, setRootCause] = useState(detail.root_cause)
  const [corrective, setCorrective] = useState(detail.corrective_action)
  const [preventive, setPreventive] = useState(detail.preventive_action)
  const [effectiveness, setEffectiveness] = useState(detail.effectiveness)
  const [dueDate, setDueDate] = useState(detail.due_date.slice(0, 10))

  return (
    <aside className="ncr-admin__detail" aria-label="Chi tiết CAPA">
      <h3>{detail.code}</h3>
      <p className="ncr-admin__muted">
        NCR {row?.ncrLabel ?? '-'} · {row?.ownerLabel ?? '-'}
      </p>
      {row?.canUpdate ? (
        <form
          className="ncr-admin__form"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitCapaUpdate({
              root_cause: rootCause,
              corrective_action: corrective,
              preventive_action: preventive,
              effectiveness,
              due_date: dueDate,
            })
          }}
        >
          <label className="ncr-admin__field">
            <span>Root cause</span>
            <textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Corrective action</span>
            <textarea value={corrective} onChange={(e) => setCorrective(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Preventive action</span>
            <textarea value={preventive} onChange={(e) => setPreventive(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="ncr-admin__field">
            <span>Effectiveness</span>
            <select value={effectiveness} onChange={(e) => setEffectiveness(e.target.value)}>
              <option value="PENDING_VERIFY">PENDING_VERIFY</option>
              <option value="EFFECTIVE">EFFECTIVE</option>
              <option value="NOT_EFFECTIVE">NOT_EFFECTIVE</option>
            </select>
          </label>
          <button type="submit" disabled={admin.capaUpdateUi === 'pending'}>
            Lưu CAPA
          </button>
        </form>
      ) : null}
      {admin.capaUpdateError ? (
        <p className="ncr-admin__error" role="alert">
          {admin.capaUpdateError.code}: {admin.capaUpdateError.message}
        </p>
      ) : null}
    </aside>
  )
}

export function NcrPage() {
  const admin = useNcr()
  const banner = listStateMessage(admin.listState, 'NCR')
  const capaBanner = listStateMessage(admin.capaListState, 'CAPA')

  return (
    <section className="ncr-admin" aria-labelledby="ncr-admin-title">
      <header className="ncr-admin__header">
        <div>
          <p className="ncr-admin__eyebrow">WEB-QMS-03-NCR · `/web/qms/ncrs`</p>
          <h2 id="ncr-admin-title">NCR &amp; Quality Reports</h2>
          <p className="ncr-admin__lead">
            NCR disposition + CAPA + Pareto/export (QMS-03b); lifecycle gated bởi server{' '}
            <code>allowed_actions</code>.
          </p>
        </div>
        <div className="ncr-admin__actions">
          <button
            type="button"
            className="ncr-admin__btn"
            disabled={admin.ncrExportPending}
            onClick={admin.exportNcrs}
          >
            Export NCR
          </button>
          <Link to="/web/import-export">Import / Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>
      {admin.ncrExportError ? (
        <p className="ncr-admin__error" role="alert">
          {admin.ncrExportError.code}: {admin.ncrExportError.message}
        </p>
      ) : null}
      {admin.ncrExportSuccess ? (
        <p className="ncr-admin__banner" role="status">
          Đã tạo job NCR_EXPORT — tải kết quả tại Import/Export Center.
        </p>
      ) : null}

      <div className="ncr-admin__tabs" role="tablist" aria-label="NCR sections">
        <button type="button" role="tab" aria-selected={admin.tab === 'ncrs'} onClick={() => admin.setTab('ncrs')}>
          NCRs
        </button>
        <button type="button" role="tab" aria-selected={admin.tab === 'capas'} onClick={() => admin.setTab('capas')}>
          CAPAs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'pareto'}
          onClick={() => admin.setTab('pareto')}
        >
          Pareto
        </button>
      </div>

      {admin.tab === 'ncrs' ? (
        <>
          <form
            className="ncr-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySearch()
            }}
          >
            <label className="ncr-admin__field">
              <span>Tìm (code)</span>
              <input value={admin.searchInput} onChange={(e) => admin.setSearchInput(e.target.value)} />
            </label>
            <button type="submit" className="ncr-admin__btn">
              Lọc
            </button>
            <button type="button" className="ncr-admin__btn" onClick={() => admin.setShowCreate(true)}>
              Tạo NCR
            </button>
          </form>

          {admin.showCreate ? (
            <form
              className="ncr-admin__form"
              onSubmit={(e) => {
                e.preventDefault()
                admin.submitCreate()
              }}
            >
              <label className="ncr-admin__field">
                <span>Source</span>
                <select
                  value={admin.createForm.source}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, source: e.target.value })}
                >
                  {NCR_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ncr-admin__field">
                <span>Item</span>
                <select
                  value={admin.createForm.item_code}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, item_code: e.target.value })}
                >
                  <option value="">— chọn —</option>
                  {admin.items.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ncr-admin__field">
                <span>Defect</span>
                <select
                  value={admin.createForm.defect_code}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, defect_code: e.target.value })}
                >
                  <option value="">— chọn —</option>
                  {admin.defects.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ncr-admin__field">
                <span>Lot code (optional)</span>
                <input
                  value={admin.createForm.lot_code ?? ''}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, lot_code: e.target.value })}
                />
              </label>
              <label className="ncr-admin__field">
                <span>Work order code (optional)</span>
                <input
                  value={admin.createForm.work_order_code ?? ''}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, work_order_code: e.target.value })
                  }
                />
              </label>
              <label className="ncr-admin__field">
                <span>Qty affected</span>
                <input
                  type="number"
                  min={1}
                  value={admin.createForm.qty_affected}
                  onChange={(e) =>
                    admin.setCreateForm({ ...admin.createForm, qty_affected: Number(e.target.value) })
                  }
                />
              </label>
              <label className="ncr-admin__field">
                <span>Severity (optional)</span>
                <select
                  value={admin.createForm.severity ?? ''}
                  onChange={(e) => admin.setCreateForm({ ...admin.createForm, severity: e.target.value })}
                >
                  <option value="">— default từ defect —</option>
                  {NCR_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {admin.createErrors.length ? (
                <p className="ncr-admin__error">Thiếu: {admin.createErrors.join(', ')}</p>
              ) : null}
              {admin.createError ? (
                <p className="ncr-admin__error" role="alert">
                  {admin.createError.code}: {admin.createError.message}
                </p>
              ) : null}
              <div className="ncr-admin__actions">
                <button type="submit" disabled={admin.createUi === 'pending'}>
                  Lưu NCR
                </button>
                <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.setShowCreate(false)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : null}

          {banner ? (
            <p className="ncr-admin__state" role={admin.listState === 'error' ? 'alert' : 'status'}>
              {banner}
              {admin.listError ? ` (${admin.listError})` : ''}
            </p>
          ) : null}

          {admin.listState === 'ready' ? (
            <div className="ncr-admin__layout">
              <div className="ncr-admin__table-wrap">
                <table className="ncr-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Item</th>
                      <th>Lot</th>
                      <th>Defect</th>
                      <th>Qty</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.rows.map((row) => (
                      <tr
                        key={row.code}
                        className={admin.selectedCode === row.code ? 'ncr-admin__row--active' : undefined}
                      >
                        <td>
                          <button type="button" className="ncr-admin__linkish" onClick={() => admin.selectNcr(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.status}</td>
                        <td>{row.itemLabel}</td>
                        <td>{row.lotLabel}</td>
                        <td>{row.defectLabel}</td>
                        <td>{row.qtyAffected}</td>
                        <td>{row.severity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.page?.has_more ? (
                  <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.loadMore()}>
                    Tải thêm
                  </button>
                ) : null}
              </div>
              {admin.detail && admin.selectedCode === admin.detail.code ? (
                <NcrEditor key={admin.detail.code} detail={admin.detail} admin={admin} />
              ) : admin.detailLoading ? (
                <p className="ncr-admin__state">Đang tải chi tiết…</p>
              ) : (
                <p className="ncr-admin__muted">Chọn một NCR để xem chi tiết / hành động.</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'capas' ? (
        <>
          <form
            className="ncr-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyCapaSearch()
            }}
          >
            <label className="ncr-admin__field">
              <span>Tìm CAPA</span>
              <input
                value={admin.capaSearchInput}
                onChange={(e) => admin.setCapaSearchInput(e.target.value)}
              />
            </label>
            <button type="submit">Lọc</button>
            <button type="button" onClick={() => admin.setShowCapaCreate(true)}>
              Tạo CAPA
            </button>
          </form>

          {admin.showCapaCreate ? (
            <form
              className="ncr-admin__form"
              onSubmit={(e) => {
                e.preventDefault()
                admin.submitCapaCreate()
              }}
            >
              <label className="ncr-admin__field">
                <span>NCR id (từ detail NCR — không hiển thị như business code)</span>
                <input
                  type="number"
                  min={1}
                  value={admin.capaCreateForm.ncr_id || ''}
                  onChange={(e) =>
                    admin.setCapaCreateForm({
                      ...admin.capaCreateForm,
                      ncr_id: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="ncr-admin__field">
                <span>Root cause</span>
                <textarea
                  value={admin.capaCreateForm.root_cause}
                  onChange={(e) =>
                    admin.setCapaCreateForm({ ...admin.capaCreateForm, root_cause: e.target.value })
                  }
                />
              </label>
              <label className="ncr-admin__field">
                <span>Corrective action</span>
                <textarea
                  value={admin.capaCreateForm.corrective_action}
                  onChange={(e) =>
                    admin.setCapaCreateForm({
                      ...admin.capaCreateForm,
                      corrective_action: e.target.value,
                    })
                  }
                />
              </label>
              <label className="ncr-admin__field">
                <span>Preventive action</span>
                <textarea
                  value={admin.capaCreateForm.preventive_action}
                  onChange={(e) =>
                    admin.setCapaCreateForm({
                      ...admin.capaCreateForm,
                      preventive_action: e.target.value,
                    })
                  }
                />
              </label>
              <label className="ncr-admin__field">
                <span>Owner user id</span>
                <input
                  type="number"
                  min={1}
                  value={admin.capaCreateForm.owner_id || ''}
                  onChange={(e) =>
                    admin.setCapaCreateForm({
                      ...admin.capaCreateForm,
                      owner_id: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="ncr-admin__field">
                <span>Due date</span>
                <input
                  type="date"
                  value={admin.capaCreateForm.due_date}
                  onChange={(e) =>
                    admin.setCapaCreateForm({ ...admin.capaCreateForm, due_date: e.target.value })
                  }
                />
              </label>
              {admin.capaCreateErrors.length ? (
                <p className="ncr-admin__error">Thiếu: {admin.capaCreateErrors.join(', ')}</p>
              ) : null}
              {admin.capaCreateError ? (
                <p className="ncr-admin__error" role="alert">
                  {admin.capaCreateError.code}: {admin.capaCreateError.message}
                </p>
              ) : null}
              <div className="ncr-admin__actions">
                <button type="submit" disabled={admin.capaCreateUi === 'pending'}>
                  Lưu CAPA
                </button>
                <button
                  type="button"
                  className="ncr-admin__btn--ghost"
                  onClick={() => admin.setShowCapaCreate(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : null}

          {capaBanner ? (
            <p className="ncr-admin__state" role={admin.capaListState === 'error' ? 'alert' : 'status'}>
              {capaBanner}
              {admin.capaListError ? ` (${admin.capaListError})` : ''}
            </p>
          ) : null}

          {admin.capaListState === 'ready' ? (
            <div className="ncr-admin__layout">
              <div className="ncr-admin__table-wrap">
                <table className="ncr-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>NCR</th>
                      <th>Owner</th>
                      <th>Due</th>
                      <th>Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.capaRows.map((row) => (
                      <tr
                        key={row.code}
                        className={
                          admin.selectedCapaCode === row.code ? 'ncr-admin__row--active' : undefined
                        }
                      >
                        <td>
                          <button
                            type="button"
                            className="ncr-admin__linkish"
                            onClick={() => admin.selectCapa(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.ncrLabel}</td>
                        <td>{row.ownerLabel}</td>
                        <td>{row.dueDate}</td>
                        <td>{row.effectiveness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.capaPage?.has_more ? (
                  <button type="button" className="ncr-admin__btn--ghost" onClick={() => admin.loadMoreCapas()}>
                    Tải thêm
                  </button>
                ) : null}
              </div>
              {admin.capaDetail && admin.selectedCapaCode === admin.capaDetail.code ? (
                <CapaEditor key={admin.capaDetail.code} detail={admin.capaDetail} admin={admin} />
              ) : admin.capaDetailLoading ? (
                <p className="ncr-admin__state">Đang tải chi tiết CAPA…</p>
              ) : (
                <p className="ncr-admin__muted">Chọn một CAPA để xem / cập nhật.</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'pareto' ? (
        <>
          <form
            className="ncr-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyParetoFilters()
            }}
          >
            <label className="ncr-admin__field">
              <span>From (YYYY-MM-DD)</span>
              <input value={admin.paretoFrom} onChange={(e) => admin.setParetoFrom(e.target.value)} />
            </label>
            <label className="ncr-admin__field">
              <span>To (YYYY-MM-DD)</span>
              <input value={admin.paretoTo} onChange={(e) => admin.setParetoTo(e.target.value)} />
            </label>
            <label className="ncr-admin__field">
              <span>Group by</span>
              <select
                value={admin.paretoGroupBy}
                onChange={(e) => admin.setParetoGroupBy(e.target.value)}
              >
                <option value="defect_code">defect_code</option>
                <option value="item_code">item_code</option>
                <option value="source">source</option>
              </select>
            </label>
            <label className="ncr-admin__field">
              <span>Source (optional)</span>
              <input
                value={admin.paretoSource}
                onChange={(e) => admin.setParetoSource(e.target.value)}
                placeholder="IQC / IPQC / …"
              />
            </label>
            <button type="submit" className="ncr-admin__btn">
              Áp dụng
            </button>
            <button
              type="button"
              className="ncr-admin__btn"
              disabled={admin.paretoExportPending}
              onClick={admin.exportPareto}
            >
              Export Pareto
            </button>
          </form>
          {admin.paretoExportError ? (
            <p className="ncr-admin__error" role="alert">
              {admin.paretoExportError.code}: {admin.paretoExportError.message}
            </p>
          ) : null}
          {admin.paretoExportSuccess ? (
            <p className="ncr-admin__banner" role="status">
              Đã tạo job NCR_PARETO — tải kết quả tại Import/Export Center.
            </p>
          ) : null}
          {admin.paretoState !== 'ready' ? (
            <p
              className="ncr-admin__state"
              role={admin.paretoState === 'error' ? 'alert' : 'status'}
            >
              {admin.paretoState === 'loading'
                ? 'Đang tải Pareto…'
                : admin.paretoState === 'empty'
                  ? 'Chưa có dữ liệu Pareto.'
                  : admin.paretoState === 'permission-denied'
                    ? 'Bạn không có quyền xem Pareto.'
                    : 'Không tải được Pareto.'}
              {admin.paretoError ? ` (${admin.paretoError.code})` : ''}
            </p>
          ) : (
            <div className="ncr-admin__table-wrap">
              <p className="ncr-admin__muted">
                Group by <code>{admin.paretoGroupByApplied}</code> · Total qty {admin.paretoTotal}
              </p>
              <table className="ncr-admin__table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Label</th>
                    <th>Qty</th>
                    <th>%</th>
                    <th>Cum %</th>
                  </tr>
                </thead>
                <tbody>
                  {admin.paretoRows.map((row) => (
                    <tr key={row.groupKey}>
                      <td>{row.groupKey}</td>
                      <td>{row.groupLabel}</td>
                      <td>{row.qty}</td>
                      <td>{row.pct}</td>
                      <td>{row.cumPct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}
