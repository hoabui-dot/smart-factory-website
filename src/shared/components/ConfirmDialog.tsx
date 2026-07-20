import { useState, type ReactNode } from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: 'confirm-only' | 'reason-required'
  summary?: Record<string, string | number | boolean | null | undefined>
  isPending?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'confirm-only',
  summary,
  isPending = false,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (type === 'reason-required') {
      onConfirm(reason.trim())
    } else {
      onConfirm()
    }
  }

  const isConfirmDisabled = type === 'reason-required' && reason.trim().length < 3

  return (
    <div className="cf-overlay" role="dialog" aria-modal="true" aria-labelledby="cf-title">
      <div className="cf-dialog">
        <header className="cf-dialog__header">
          <h3 id="cf-title">{title}</h3>
        </header>
        <div className="cf-dialog__body">
          {description ? <p className="cf-dialog__desc">{description}</p> : null}

          {summary ? (
            <div className="cf-dialog__summary">
              <h4>Thông tin xem lại:</h4>
              <dl>
                {Object.entries(summary).map(([key, val]) => (
                  <div key={key} className="cf-dialog__summary-row">
                    <dt>{key}:</dt>
                    <dd>{val === true ? 'Có' : val === false ? 'Không' : val ?? '-'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {type === 'reason-required' ? (
            <div className="cf-dialog__reason">
              <label>
                <span>Lý do thay đổi (bắt buộc, tối thiểu 3 ký tự) *</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do thực hiện thay đổi..."
                  required
                />
              </label>
            </div>
          ) : null}
        </div>
        <footer className="cf-dialog__footer">
          <button
            type="button"
            className="cf-dialog__btn cf-dialog__btn--cancel"
            onClick={onClose}
            disabled={isPending}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`cf-dialog__btn ${type === 'reason-required' ? 'cf-dialog__btn--danger' : 'cf-dialog__btn--confirm'}`}
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isPending}
          >
            {isPending ? 'Đang thực hiện…' : confirmText}
          </button>
        </footer>
      </div>
    </div>
  )
}
