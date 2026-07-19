import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { ATTACHMENT_TYPES, COMMENT_ENTITY_TYPES } from '../types/sharedContent'
import { useSharedContent } from '../hooks/useSharedContent'

import './SharedContentPage.css'

type Api = ReturnType<typeof useSharedContent>

function sectionStateMessage(state: string, kind: 'comments' | 'attachments' | 'timeline'): string {
  const noun =
    kind === 'comments' ? 'bình luận' : kind === 'attachments' ? 'tệp đính kèm' : 'dòng thời gian'
  switch (state) {
    case 'loading':
      return `Đang tải ${noun}…`
    case 'empty':
      return `Chưa có ${noun}.`
    case 'no-result':
      return `Không có kết quả khớp bộ lọc.`
    case 'permission-denied':
      return `Bạn không có quyền xem ${noun} của entity này.`
    case 'not-found':
      return `Không tìm thấy entity gốc.`
    case 'unsupported':
      return kind === 'attachments'
        ? 'Loại entity này chưa hỗ trợ đính kèm file (ngoài §13.4 parent_type whitelist).'
        : 'Loại entity này không hợp lệ.'
    case 'dependency-unavailable':
      return `Tính năng ${noun} chưa sẵn sàng — module chủ sở hữu chưa đăng ký resolver.`
    case 'error':
      return `Không tải được ${noun}. Thử lại sau.`
    default:
      return ''
  }
}

function EntityPicker() {
  const navigate = useNavigate()
  const [entityType, setEntityType] = useState<string>(COMMENT_ENTITY_TYPES[0])
  const [entityId, setEntityId] = useState('')

  return (
    <section className="shared-content" aria-labelledby="shared-content-title">
      <header className="shared-content__header">
        <div>
          <p className="shared-content__eyebrow">
            WEB-SHARED-02-COMMENTS-ATTACHMENTS · `/web/shared/entities/:entity_type/:entity_id/content`
          </p>
          <h2 id="shared-content-title">Comments & Attachments</h2>
          <p className="shared-content__lead">
            Chọn entity gốc để xem/bình luận/đính kèm file (SHARED02-001..006).
          </p>
        </div>
        <Link to="/admin">Về quản trị</Link>
      </header>

      <form
        className="shared-content__picker"
        onSubmit={(e) => {
          e.preventDefault()
          const id = Number(entityId)
          if (Number.isInteger(id) && id > 0) {
            navigate(`/web/shared/entities/${entityType}/${id}/content`)
          }
        }}
      >
        <label className="shared-content__field">
          <span>Entity type</span>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            {COMMENT_ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="shared-content__field">
          <span>Entity ID (physical id)</span>
          <input
            inputMode="numeric"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="ví dụ: 42"
          />
        </label>
        <button type="submit" className="shared-content__btn">
          Mở
        </button>
      </form>
      <p className="shared-content__muted">
        Thường được mở từ liên kết trong màn chi tiết entity nghiệp vụ (Lot, NCR, WO…) — mục này
        chỉ dành cho truy cập trực tiếp.
      </p>
    </section>
  )
}

function CommentsSection({ admin }: { admin: Api }) {
  const banner = sectionStateMessage(admin.commentsState, 'comments')
  return (
    <div className="shared-content__section">
      <form
        className="shared-content__composer"
        onSubmit={(e) => {
          e.preventDefault()
          if (admin.commentBodyErrors.length === 0) admin.submitComment()
        }}
      >
        {admin.replyTarget ? (
          <p className="shared-content__reply-banner">
            Đang trả lời <strong>{admin.replyTarget.code}</strong>{' '}
            <button type="button" onClick={() => admin.setReplyTarget(null)}>
              Hủy trả lời
            </button>
          </p>
        ) : null}
        <label className="shared-content__field">
          <span>Nội dung bình luận</span>
          <textarea
            value={admin.commentBody}
            onChange={(e) => admin.setCommentBody(e.target.value)}
            rows={3}
            placeholder="Nhập bình luận…"
          />
        </label>
        <button
          type="submit"
          className="shared-content__btn"
          disabled={admin.commentBodyErrors.length > 0 || admin.commentPending}
        >
          {admin.commentPending ? 'Đang gửi…' : 'Gửi bình luận'}
        </button>
        {admin.commentError ? (
          <p className="shared-content__error" role="alert">
            {admin.commentError.code}: {admin.commentError.message}
          </p>
        ) : null}
      </form>

      {banner ? (
        <p className="shared-content__state" role={admin.commentsState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.commentsError ? ` (${admin.commentsError.code})` : ''}
        </p>
      ) : null}

      {admin.commentsState === 'ready' ? (
        <ul className="shared-content__comments">
          {admin.commentRows.map((row) => (
            <li key={row.id} className="shared-content__comment">
              <div className="shared-content__comment-meta">
                <strong>{row.code}</strong>
                <span>{row.uploadedByLabel}</span>
                <span>{row.createdAtLabel}</span>
                {row.isReply ? <span>↳ trả lời {row.parentCode}</span> : null}
              </div>
              <p className="shared-content__comment-body">{row.body}</p>
              <button
                type="button"
                className="shared-content__linkish"
                onClick={() => admin.setReplyTarget({ id: row.id, code: row.code })}
              >
                Trả lời
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function AttachmentsSection({ admin }: { admin: Api }) {
  const banner = sectionStateMessage(admin.attachmentsState, 'attachments')
  return (
    <div className="shared-content__section">
      <form
        className="shared-content__composer"
        onSubmit={(e) => {
          e.preventDefault()
          if (admin.attachFormErrors.length === 0) admin.submitAttach()
        }}
      >
        <label className="shared-content__field">
          <span>Chọn file</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => admin.setAttachFileSelection(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="shared-content__field">
          <span>Attachment type</span>
          <select value={admin.attachmentType} onChange={(e) => admin.setAttachmentType(e.target.value)}>
            {ATTACHMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="shared-content__field">
          <span>Chú thích (tùy chọn)</span>
          <input value={admin.caption} onChange={(e) => admin.setCaption(e.target.value)} />
        </label>
        <button
          type="submit"
          className="shared-content__btn"
          disabled={admin.attachFormErrors.length > 0 || admin.attachPending}
        >
          {admin.attachPending ? `Đang xử lý (${admin.uploadStage})…` : 'Đính kèm file'}
        </button>
        {admin.attachError ? (
          <p className="shared-content__error" role="alert">
            {admin.attachError.code}: {admin.attachError.message}
          </p>
        ) : null}
        {admin.attachSuccess ? (
          <p className="shared-content__banner" role="status">
            Đã đính kèm file.
          </p>
        ) : null}
      </form>

      {banner ? (
        <p className="shared-content__state" role={admin.attachmentsState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.attachmentsError ? ` (${admin.attachmentsError.code})` : ''}
        </p>
      ) : null}

      {admin.attachmentsState === 'ready' ? (
        <table className="shared-content__table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Loại</th>
              <th>Chú thích</th>
              <th>Người gắn</th>
              <th>Lúc gắn</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admin.attachmentRows.map((row) => (
              <tr key={row.id}>
                <td>{row.code}</td>
                <td>{row.attachmentType}</td>
                <td>{row.caption}</td>
                <td>{row.uploadedByLabel}</td>
                <td>{row.uploadedAtLabel}</td>
                <td>
                  {admin.confirmDetachId === row.id ? (
                    <span className="shared-content__confirm">
                      <button type="button" onClick={admin.confirmDetach} disabled={admin.detachPending}>
                        {admin.detachPending ? 'Đang gỡ…' : 'Xác nhận gỡ'}
                      </button>
                      <button type="button" onClick={admin.cancelDetach}>
                        Hủy
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="shared-content__linkish"
                      onClick={() => admin.requestDetach(row.id)}
                    >
                      Gỡ / archive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {admin.detachError ? (
        <p className="shared-content__error" role="alert">
          {admin.detachError.code}: {admin.detachError.message}
        </p>
      ) : null}
    </div>
  )
}

function TimelineSection({ admin }: { admin: Api }) {
  const banner = sectionStateMessage(admin.timelineState, 'timeline')
  return (
    <div className="shared-content__section">
      {banner ? (
        <p className="shared-content__state" role={admin.timelineState === 'error' ? 'alert' : 'status'}>
          {banner}
          {admin.timelineError ? ` (${admin.timelineError.code})` : ''}
        </p>
      ) : null}
      {admin.timelineState === 'ready' ? (
        <ul className="shared-content__timeline">
          {admin.timelineRows.map((row) => (
            <li key={row.key} className={`shared-content__timeline-item shared-content__timeline-item--${row.kind}`}>
              <div className="shared-content__timeline-meta">
                <span>{row.occurredAtLabel}</span>
              </div>
              <strong>{row.title}</strong>
              <p>{row.summary}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ContentView({ entityType, entityId }: { entityType: string; entityId: number }) {
  const admin = useSharedContent(entityType, entityId)

  return (
    <section className="shared-content" aria-labelledby="shared-content-title">
      <header className="shared-content__header">
        <div>
          <p className="shared-content__eyebrow">
            WEB-SHARED-02-COMMENTS-ATTACHMENTS · `/web/shared/entities/{entityType}/{entityId}/content`
          </p>
          <h2 id="shared-content-title">Comments & Attachments</h2>
          <p className="shared-content__lead">
            entity_type=<code>{entityType}</code> · entity_id=<code>{entityId}</code>. Bình
            luận/đính kèm inherit quyền từ entity gốc (SHARED02-001..006).
          </p>
        </div>
        <div className="shared-content__actions">
          <button type="button" onClick={admin.refreshAll}>
            Làm mới
          </button>
          <Link to="/admin">Về quản trị</Link>
        </div>
      </header>

      <div className="shared-content__tabs" role="tablist" aria-label="Chọn nội dung">
        <button
          type="button"
          className={admin.tab === 'comments' ? 'shared-content__tab--active' : 'shared-content__tab'}
          onClick={() => admin.setTab('comments')}
        >
          Bình luận
        </button>
        <button
          type="button"
          className={admin.tab === 'attachments' ? 'shared-content__tab--active' : 'shared-content__tab'}
          onClick={() => admin.setTab('attachments')}
        >
          Tệp đính kèm
        </button>
        <button
          type="button"
          className={admin.tab === 'timeline' ? 'shared-content__tab--active' : 'shared-content__tab'}
          onClick={() => admin.setTab('timeline')}
        >
          Dòng thời gian
        </button>
      </div>

      {admin.tab === 'comments' ? <CommentsSection admin={admin} /> : null}
      {admin.tab === 'attachments' ? <AttachmentsSection admin={admin} /> : null}
      {admin.tab === 'timeline' ? <TimelineSection admin={admin} /> : null}
    </section>
  )
}

export function SharedContentPage() {
  const { entityType, entityId } = useParams<{ entityType: string; entityId: string }>()
  const parsedId = Number(entityId)
  const isValid = Boolean(entityType) && Number.isInteger(parsedId) && parsedId > 0

  if (!isValid) {
    return <EntityPicker />
  }

  return <ContentView entityType={entityType as string} entityId={parsedId} />
}
