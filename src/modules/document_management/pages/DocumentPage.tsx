import { useState } from 'react'
import { Link } from 'react-router'

import { useDocument } from '../hooks/useDocument'
import type { DocumentRecord, PpapSubmissionRecord } from '../types/document'
import { PPAP_LEVELS, PPAP_SUBMISSION_TYPES } from '../types/document'

import './DocumentPage.css'

type Api = ReturnType<typeof useDocument>

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

function DocumentDetail({ detail, admin }: { detail: DocumentRecord; admin: Api }) {
  const row = admin.docDetailRow
  const [title, setTitle] = useState(detail.doc_title)
  const [ownerId, setOwnerId] = useState(detail.owner_id)

  return (
    <aside className="doc-admin__detail" aria-label="Chi tiết document">
      <h3>{detail.code}</h3>
      <p className="doc-admin__muted">
        {row?.docTypeLabel ?? '-'} · {row?.isActive ? 'ACTIVE' : 'INACTIVE'}
      </p>
      <dl className="doc-admin__meta">
        <div>
          <dt>Owner</dt>
          <dd>{row?.ownerLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Item</dt>
          <dd>{row?.itemLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Customer</dt>
          <dd>{row?.customerLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Current revision</dt>
          <dd>{row?.currentRevisionLabel ?? '-'}</dd>
        </div>
      </dl>

      {row?.canUpdate ? (
        <form
          className="doc-admin__filters"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitDocUpdate({ doc_title: title, owner_id: ownerId })
          }}
        >
          <label className="doc-admin__field">
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="doc-admin__field">
            <span>Owner user id</span>
            <input
              type="number"
              min={1}
              value={ownerId || ''}
              onChange={(e) => setOwnerId(Number(e.target.value))}
            />
          </label>
          <button type="submit" className="doc-admin__btn" disabled={admin.updateDocUi === 'pending'}>
            Lưu thay đổi
          </button>
        </form>
      ) : null}

      <div className="doc-admin__actions">
        {row?.canDeactivate ? (
          <button type="button" className="doc-admin__btn--danger" onClick={() => admin.setConfirmDeactivate(true)}>
            Deactivate
          </button>
        ) : null}
        <button type="button" onClick={() => admin.setShowRevCreate(true)}>
          Tạo revision
        </button>
      </div>

      {admin.confirmDeactivate ? (
        <div className="doc-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>Deactivate document {detail.code}? Hành động không thể hoàn tác từ UI này.</p>
          <div className="doc-admin__actions">
            <button type="button" className="doc-admin__btn--danger" onClick={() => admin.submitDeactivate()}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      <h4>Revisions</h4>
      <div className="doc-admin__table-wrap">
        <table className="doc-admin__table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Effective</th>
            </tr>
          </thead>
          <tbody>
            {admin.revRows.map((rev) => (
              <tr
                key={rev.code}
                className={rev.code === admin.selectedRevCode ? 'doc-admin__row--active' : undefined}
              >
                <td>
                  <button type="button" className="doc-admin__linkish" onClick={() => admin.selectRevision(rev.code)}>
                    {rev.code}
                  </button>
                </td>
                <td>{rev.status}</td>
                <td>
                  {rev.effectiveFrom}
                  {rev.effectiveTo !== '-' ? ` → ${rev.effectiveTo}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {admin.revDetail && admin.revDetailRow ? (
        <div className="doc-admin__confirm" aria-label="Revision actions">
          <p>
            <strong>{admin.revDetailRow.code}</strong> · {admin.revDetailRow.status} · file{' '}
            {admin.revDetailRow.fileLabel}
          </p>
          <div className="doc-admin__actions">
            {admin.revDetailRow.canSubmit ? (
              <button type="button" onClick={() => admin.setConfirmSubmitRev(true)}>
                Submit
              </button>
            ) : null}
            {admin.revDetailRow.canRelease ? (
              <button type="button" onClick={() => admin.setShowRelease(true)}>
                Release
              </button>
            ) : null}
            {admin.revDetailRow.canReject ? (
              <button type="button" className="doc-admin__btn--danger" onClick={() => admin.setShowRejectRev(true)}>
                Reject
              </button>
            ) : null}
            {admin.revDetailRow.canObsolete ? (
              <button type="button" className="doc-admin__btn--danger" onClick={() => admin.setShowObsolete(true)}>
                Obsolete
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {admin.showRevCreate ? (
        <form
          className="doc-admin__confirm"
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitRevCreate()
          }}
        >
          <label className="doc-admin__field">
            <span>Revision code</span>
            <input
              value={admin.revCreateForm.code}
              onChange={(e) => admin.setRevCreateForm({ ...admin.revCreateForm, code: e.target.value })}
            />
          </label>
          <label className="doc-admin__field">
            <span>Effective from</span>
            <input
              type="date"
              value={admin.revCreateForm.effective_from}
              onChange={(e) =>
                admin.setRevCreateForm({ ...admin.revCreateForm, effective_from: e.target.value })
              }
            />
          </label>
          <label className="doc-admin__field">
            <span>File id (optional)</span>
            <input
              type="number"
              min={1}
              value={admin.revCreateForm.file_id ?? ''}
              onChange={(e) =>
                admin.setRevCreateForm({
                  ...admin.revCreateForm,
                  file_id: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </label>
          {admin.revCreateErrors.length ? (
            <p className="doc-admin__error">Thiếu: {admin.revCreateErrors.join(', ')}</p>
          ) : null}
          <div className="doc-admin__actions">
            <button type="submit" disabled={admin.createRevUi === 'pending'}>
              Tạo
            </button>
            <button type="button" onClick={() => admin.setShowRevCreate(false)}>
              Hủy
            </button>
          </div>
        </form>
      ) : null}

      {admin.confirmSubmitRev ? (
        <div className="doc-admin__confirm" role="dialog">
          <p>Submit revision → IN_REVIEW?</p>
          <div className="doc-admin__actions">
            <button type="button" onClick={() => admin.submitRev()}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmSubmitRev(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showRelease ? (
        <div className="doc-admin__confirm" role="dialog">
          <label className="doc-admin__field">
            <span>file_id (required)</span>
            <input
              type="number"
              min={1}
              value={admin.releaseFileId || ''}
              onChange={(e) => admin.setReleaseFileId(Number(e.target.value))}
            />
          </label>
          {admin.releaseErrors.length ? (
            <p className="doc-admin__error">Thiếu: {admin.releaseErrors.join(', ')}</p>
          ) : null}
          <div className="doc-admin__actions">
            <button type="button" onClick={() => admin.submitRelease()}>
              Release
            </button>
            <button type="button" onClick={() => admin.setShowRelease(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showRejectRev ? (
        <div className="doc-admin__confirm" role="dialog">
          <label className="doc-admin__field">
            <span>Reason</span>
            <textarea value={admin.rejectReason} onChange={(e) => admin.setRejectReason(e.target.value)} />
          </label>
          {admin.rejectErrors.length ? (
            <p className="doc-admin__error">Thiếu: {admin.rejectErrors.join(', ')}</p>
          ) : null}
          <div className="doc-admin__actions">
            <button type="button" className="doc-admin__btn--danger" onClick={() => admin.submitRejectRev()}>
              Reject
            </button>
            <button type="button" onClick={() => admin.setShowRejectRev(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {admin.showObsolete ? (
        <div className="doc-admin__confirm" role="dialog">
          <label className="doc-admin__field">
            <span>Reason</span>
            <textarea value={admin.obsoleteReason} onChange={(e) => admin.setObsoleteReason(e.target.value)} />
          </label>
          {admin.obsoleteErrors.length ? (
            <p className="doc-admin__error">Thiếu: {admin.obsoleteErrors.join(', ')}</p>
          ) : null}
          <div className="doc-admin__actions">
            <button type="button" className="doc-admin__btn--danger" onClick={() => admin.submitObsolete()}>
              Obsolete
            </button>
            <button type="button" onClick={() => admin.setShowObsolete(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

function PpapDetail({ detail, admin }: { detail: PpapSubmissionRecord; admin: Api }) {
  const row = admin.ppapDetailRow
  const [notes, setNotes] = useState(detail.notes ?? '')

  return (
    <aside className="doc-admin__detail" aria-label="Chi tiết PPAP">
      <h3>{detail.code}</h3>
      <p className="doc-admin__muted">
        {row?.status} · Level {row?.ppapLevel} · {row?.submissionType}
      </p>
      <dl className="doc-admin__meta">
        <div>
          <dt>Customer</dt>
          <dd>{row?.customerLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Item</dt>
          <dd>{row?.itemLabel ?? '-'}</dd>
        </div>
      </dl>

      {row?.canUpdate ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            admin.submitPpapUpdate({ notes })
          }}
        >
          <label className="doc-admin__field">
            <span>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button type="submit" className="doc-admin__btn" disabled={admin.updatePpapUi === 'pending'}>
            Lưu notes
          </button>
        </form>
      ) : null}

      <div className="doc-admin__actions">
        {row?.canPrepare ? (
          <button type="button" onClick={() => admin.setConfirmPrepare(true)}>
            Prepare
          </button>
        ) : null}
        {row?.canSubmit ? (
          <button type="button" onClick={() => admin.setConfirmSubmitPpap(true)}>
            Submit
          </button>
        ) : null}
        {row?.canCustomerReview ? (
          <button type="button" onClick={() => admin.setConfirmReview(true)}>
            Customer review
          </button>
        ) : null}
        {row?.canApprove ? (
          <button type="button" onClick={() => admin.setConfirmApprove(true)}>
            Approve
          </button>
        ) : null}
        {row?.canInterimApprove ? (
          <button type="button" onClick={() => admin.setConfirmInterim(true)}>
            Interim approve
          </button>
        ) : null}
        {row?.canReject ? (
          <button type="button" className="doc-admin__btn--danger" onClick={() => admin.setConfirmRejectPpap(true)}>
            Reject
          </button>
        ) : null}
      </div>

      {(detail.elements ?? []).length > 0 ? (
        <>
          <h4>AIAG elements</h4>
          <ul>
            {(detail.elements ?? []).map((el) => (
              <li key={el.code}>
                {el.element_name}
                {el.is_required ? ' *' : ''} — {el.document_revision_code || '-'}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {admin.confirmPrepare ? (
        <div className="doc-admin__confirm" role="dialog">
          <p>Prepare PPAP (build AIAG elements)?</p>
          <div className="doc-admin__actions">
            <button type="button" onClick={() => admin.runPrepare()}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPrepare(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.confirmSubmitPpap ? (
        <div className="doc-admin__confirm" role="dialog">
          <p>Submit PPAP to customer?</p>
          <div className="doc-admin__actions">
            <button type="button" onClick={() => admin.runSubmitPpap()}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmSubmitPpap(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.confirmReview ? (
        <div className="doc-admin__confirm" role="dialog">
          <p>Mark under customer review?</p>
          <div className="doc-admin__actions">
            <button type="button" onClick={() => admin.runReview()}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmReview(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.confirmApprove ? (
        <div className="doc-admin__confirm" role="dialog">
          <p>Approve PPAP?</p>
          <div className="doc-admin__actions">
            <button type="button" onClick={() => admin.runApprove()}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmApprove(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.confirmInterim ? (
        <div className="doc-admin__confirm" role="dialog">
          <p>Interim approve PPAP?</p>
          <div className="doc-admin__actions">
            <button type="button" onClick={() => admin.runInterim()}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmInterim(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.confirmRejectPpap ? (
        <div className="doc-admin__confirm" role="dialog">
          <p>Reject PPAP? Hành động không thể hoàn tác từ UI này.</p>
          <div className="doc-admin__actions">
            <button type="button" className="doc-admin__btn--danger" onClick={() => admin.runRejectPpap()}>
              Xác nhận reject
            </button>
            <button type="button" onClick={() => admin.setConfirmRejectPpap(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

export function DocumentPage() {
  const admin = useDocument()
  const docBanner = listStateMessage(admin.docListState, 'document')
  const ppapBanner = listStateMessage(admin.ppapListState, 'PPAP')

  return (
    <section className="doc-admin" aria-labelledby="doc-admin-title">
      <header className="doc-admin__header">
        <div>
          <p className="doc-admin__eyebrow">WEB-QMS-04-DOCUMENT · `/web/qms/documents`</p>
          <h2 id="doc-admin-title">Document / PPAP</h2>
          <p className="doc-admin__lead">
            Quản lý controlled document + revision lifecycle và PPAP package. Mutation chỉ qua server{' '}
            <code>allowed_actions</code>.
          </p>
        </div>
        <div className="doc-admin__actions">
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <p className="doc-admin__note">
        Owner user id: `/api/admin/users` không expose numeric id cho non-admin — form thu thập raw id
        (cùng pattern MES-09). List/detail luôn hiển thị <code>owner_code</code> projection.
      </p>

      <div className="doc-admin__tabs" role="tablist" aria-label="Document sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'documents'}
          onClick={() => admin.setTab('documents')}
        >
          Documents
        </button>
        <button type="button" role="tab" aria-selected={admin.tab === 'ppap'} onClick={() => admin.setTab('ppap')}>
          PPAP
        </button>
      </div>

      {admin.tab === 'documents' ? (
        <>
          <form
            className="doc-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applySearch()
            }}
          >
            <label className="doc-admin__field">
              <span>Tìm (code/title)</span>
              <input value={admin.searchInput} onChange={(e) => admin.setSearchInput(e.target.value)} />
            </label>
            <button type="submit" className="doc-admin__btn">
              Lọc
            </button>
            <button type="button" onClick={() => admin.setShowDocCreate(true)}>
              Tạo document
            </button>
          </form>

          {docBanner ? (
            <p className="doc-admin__state" role={admin.docListState === 'error' ? 'alert' : 'status'}>
              {docBanner}
              {admin.docListError ? ` (${admin.docListError})` : ''}
            </p>
          ) : null}

          {admin.showDocCreate ? (
            <form
              className="doc-admin__confirm"
              onSubmit={(e) => {
                e.preventDefault()
                admin.submitDocCreate()
              }}
            >
              <label className="doc-admin__field">
                <span>Code</span>
                <input
                  value={admin.docCreateForm.code}
                  onChange={(e) => admin.setDocCreateForm({ ...admin.docCreateForm, code: e.target.value })}
                />
              </label>
              <label className="doc-admin__field">
                <span>Title</span>
                <input
                  value={admin.docCreateForm.doc_title}
                  onChange={(e) =>
                    admin.setDocCreateForm({ ...admin.docCreateForm, doc_title: e.target.value })
                  }
                />
              </label>
              <label className="doc-admin__field">
                <span>Document type</span>
                <select
                  value={admin.docCreateForm.doc_type_id || ''}
                  onChange={(e) =>
                    admin.setDocCreateForm({
                      ...admin.docCreateForm,
                      doc_type_id: Number(e.target.value),
                    })
                  }
                >
                  <option value="">—</option>
                  {admin.docTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} — {t.name_vi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="doc-admin__field">
                <span>Owner user id</span>
                <input
                  type="number"
                  min={1}
                  value={admin.docCreateForm.owner_id || ''}
                  onChange={(e) =>
                    admin.setDocCreateForm({ ...admin.docCreateForm, owner_id: Number(e.target.value) })
                  }
                />
              </label>
              <label className="doc-admin__field">
                <span>Related item (optional)</span>
                <select
                  value={admin.docCreateForm.related_item_id ?? ''}
                  onChange={(e) =>
                    admin.setDocCreateForm({
                      ...admin.docCreateForm,
                      related_item_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="">—</option>
                  {admin.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="doc-admin__field">
                <span>Related customer (optional)</span>
                <select
                  value={admin.docCreateForm.related_customer_id ?? ''}
                  onChange={(e) =>
                    admin.setDocCreateForm({
                      ...admin.docCreateForm,
                      related_customer_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <option value="">—</option>
                  {admin.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </label>
              {admin.docCreateErrors.length ? (
                <p className="doc-admin__error">Thiếu: {admin.docCreateErrors.join(', ')}</p>
              ) : null}
              <div className="doc-admin__actions">
                <button type="submit" disabled={admin.createDocUi === 'pending'}>
                  Tạo
                </button>
                <button type="button" onClick={() => admin.setShowDocCreate(false)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : null}

          {admin.docListState === 'ready' ? (
            <div className="doc-admin__layout">
              <div>
                <div className="doc-admin__table-wrap">
                  <table className="doc-admin__table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Owner</th>
                        <th>Revision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admin.docRows.map((row) => (
                        <tr
                          key={row.code}
                          className={
                            row.code === admin.selectedDocCode ? 'doc-admin__row--active' : undefined
                          }
                        >
                          <td>
                            <button
                              type="button"
                              className="doc-admin__linkish"
                              onClick={() => admin.selectDocument(row.code)}
                            >
                              {row.code}
                            </button>
                          </td>
                          <td>{row.title}</td>
                          <td>{row.docTypeLabel}</td>
                          <td>{row.ownerLabel}</td>
                          <td>{row.currentRevisionLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {admin.hasMore && admin.nextCursor ? (
                  <button
                    type="button"
                    className="doc-admin__more"
                    onClick={() => admin.setCursor(admin.nextCursor as string)}
                  >
                    Trang tiếp
                  </button>
                ) : null}
              </div>
              {admin.docDetail ? <DocumentDetail detail={admin.docDetail} admin={admin} /> : null}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <form
            className="doc-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyPpapSearch()
            }}
          >
            <label className="doc-admin__field">
              <span>Tìm PPAP</span>
              <input value={admin.ppapSearchInput} onChange={(e) => admin.setPpapSearchInput(e.target.value)} />
            </label>
            <button type="submit" className="doc-admin__btn">
              Lọc
            </button>
            <button type="button" onClick={() => admin.setShowPpapCreate(true)}>
              Tạo PPAP
            </button>
          </form>

          {ppapBanner ? (
            <p className="doc-admin__state" role={admin.ppapListState === 'error' ? 'alert' : 'status'}>
              {ppapBanner}
              {admin.ppapListError ? ` (${admin.ppapListError})` : ''}
            </p>
          ) : null}

          {admin.showPpapCreate ? (
            <form
              className="doc-admin__confirm"
              onSubmit={(e) => {
                e.preventDefault()
                admin.submitPpapCreate()
              }}
            >
              <label className="doc-admin__field">
                <span>Code</span>
                <input
                  value={admin.ppapCreateForm.code}
                  onChange={(e) => admin.setPpapCreateForm({ ...admin.ppapCreateForm, code: e.target.value })}
                />
              </label>
              <label className="doc-admin__field">
                <span>Customer</span>
                <select
                  value={admin.ppapCreateForm.customer_id || ''}
                  onChange={(e) =>
                    admin.setPpapCreateForm({
                      ...admin.ppapCreateForm,
                      customer_id: Number(e.target.value),
                    })
                  }
                >
                  <option value="">—</option>
                  {admin.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="doc-admin__field">
                <span>Item</span>
                <select
                  value={admin.ppapCreateForm.item_id || ''}
                  onChange={(e) =>
                    admin.setPpapCreateForm({ ...admin.ppapCreateForm, item_id: Number(e.target.value) })
                  }
                >
                  <option value="">—</option>
                  {admin.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="doc-admin__field">
                <span>PPAP level</span>
                <select
                  value={admin.ppapCreateForm.ppap_level}
                  onChange={(e) =>
                    admin.setPpapCreateForm({ ...admin.ppapCreateForm, ppap_level: e.target.value })
                  }
                >
                  {PPAP_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label className="doc-admin__field">
                <span>Submission type</span>
                <select
                  value={admin.ppapCreateForm.submission_type}
                  onChange={(e) =>
                    admin.setPpapCreateForm({
                      ...admin.ppapCreateForm,
                      submission_type: e.target.value,
                    })
                  }
                >
                  {PPAP_SUBMISSION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {admin.ppapCreateErrors.length ? (
                <p className="doc-admin__error">Thiếu: {admin.ppapCreateErrors.join(', ')}</p>
              ) : null}
              <div className="doc-admin__actions">
                <button type="submit" disabled={admin.createPpapUi === 'pending'}>
                  Tạo
                </button>
                <button type="button" onClick={() => admin.setShowPpapCreate(false)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : null}

          {admin.ppapListState === 'ready' ? (
            <div className="doc-admin__layout">
              <div>
                <div className="doc-admin__table-wrap">
                  <table className="doc-admin__table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Status</th>
                        <th>Customer</th>
                        <th>Item</th>
                        <th>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admin.ppapRows.map((row) => (
                        <tr
                          key={row.code}
                          className={
                            row.code === admin.selectedPpapCode ? 'doc-admin__row--active' : undefined
                          }
                        >
                          <td>
                            <button
                              type="button"
                              className="doc-admin__linkish"
                              onClick={() => admin.selectPpap(row.code)}
                            >
                              {row.code}
                            </button>
                          </td>
                          <td>{row.status}</td>
                          <td>{row.customerLabel}</td>
                          <td>{row.itemLabel}</td>
                          <td>{row.ppapLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {admin.ppapHasMore && admin.ppapNextCursor ? (
                  <button
                    type="button"
                    className="doc-admin__more"
                    onClick={() => admin.setPpapCursor(admin.ppapNextCursor as string)}
                  >
                    Trang tiếp
                  </button>
                ) : null}
              </div>
              {admin.ppapDetail ? <PpapDetail detail={admin.ppapDetail} admin={admin} /> : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
