import { useState } from 'react'
import { Link } from 'react-router'

import { useQcMaster } from '../hooks/useQcMaster'
import { CHAR_TYPES, SEVERITIES } from '../types/qcMaster'
import type { InspectionPlanDetailRecord } from '../types/qcMaster'

import './ChecksheetPage.css'

type Api = ReturnType<typeof useQcMaster>

function listStateMessage(state: string, noun: string): string {
  switch (state) {
    case 'loading':
      return `Đang tải danh mục ${noun}…`
    case 'empty':
      return `Chưa có ${noun} nào.`
    case 'no-result':
      return 'Không có kết quả khớp bộ lọc.'
    case 'permission-denied':
      return `Bạn không có quyền xem danh mục ${noun}.`
    case 'error':
      return `Không tải được danh mục ${noun}. Thử lại sau.`
    default:
      return ''
  }
}

function PlanEditor({ detail, admin }: { detail: InspectionPlanDetailRecord; admin: Api }) {
  const [samplingParam, setSamplingParam] = useState(detail.sampling_param)
  const row = admin.planDetailRow

  return (
    <aside className="qc-admin__detail" aria-label="Chi tiết checksheet">
      <h3>{detail.code}</h3>
      <p className="qc-admin__muted">
        {row?.stageLabel} · {row?.itemLabel} · {detail.status}
      </p>
      <dl className="qc-admin__meta">
        <div>
          <dt>Item revision</dt>
          <dd>{row?.revisionLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Sampling method</dt>
          <dd>{row?.samplingMethodLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>{row?.frequencyLabel ?? '-'}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{detail.is_active ? 'Có' : 'Không'}</dd>
        </div>
      </dl>

      <h4>Đặc tính kiểm tra ({detail.characteristics.length})</h4>
      {detail.characteristics.length === 0 ? (
        <p className="qc-admin__muted">
          Chưa có đặc tính. Thêm đặc tính qua QC_CHECKSHEET_IMPORT tại Import/Export Center.
        </p>
      ) : (
        <table className="qc-admin__table qc-admin__table--compact">
          <thead>
            <tr>
              <th>Characteristic</th>
              <th>Type</th>
              <th>Nominal / LSL / USL</th>
              <th>UoM</th>
              <th>Criticality</th>
            </tr>
          </thead>
          <tbody>
            {detail.characteristics.map((c) => (
              <tr key={c.code}>
                <td>{c.char_master_code ?? `#${c.char_master_id}`}</td>
                <td>{c.char_type}</td>
                <td>
                  {c.nominal ?? '-'} / {c.lsl ?? '-'} / {c.usl ?? '-'}
                </td>
                <td>{c.uom}</td>
                <td>{c.criticality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4>Sửa (chỉ khi DRAFT)</h4>
      <label className="qc-admin__field">
        <span>Sampling param</span>
        <input value={samplingParam} onChange={(e) => setSamplingParam(e.target.value)} />
      </label>
      <button
        type="button"
        className="qc-admin__btn"
        disabled={!row?.canUpdate || admin.updatePlanPending}
        title={row?.updateDisabledReason ?? undefined}
        onClick={() => admin.savePlanEdit({ sampling_param: samplingParam.trim() })}
      >
        {admin.updatePlanPending ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
      {!row?.canUpdate ? (
        <p className="qc-admin__muted">
          Update không khả dụng{row?.updateDisabledReason ? ` (${row.updateDisabledReason})` : ''}.
        </p>
      ) : null}
      {admin.updatePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.updatePlanError.code}: {admin.updatePlanError.message}
        </p>
      ) : null}
      {admin.updatePlanSuccess ? (
        <p className="qc-admin__banner" role="status">
          Đã lưu thay đổi.
        </p>
      ) : null}

      <h4>State transitions</h4>
      <div className="qc-admin__actions">
        <button
          type="button"
          className="qc-admin__btn"
          disabled={!row?.canRelease}
          title={row?.releaseDisabledReason ?? undefined}
          onClick={() => admin.setConfirmPlanRelease(true)}
        >
          Release
        </button>
        <button
          type="button"
          className="qc-admin__btn qc-admin__btn--danger"
          disabled={!row?.canObsolete}
          title={row?.obsoleteDisabledReason ?? undefined}
          onClick={() => admin.setConfirmPlanObsolete(true)}
        >
          Obsolete
        </button>
        <button
          type="button"
          className="qc-admin__btn qc-admin__btn--danger"
          disabled={!row?.canDeactivate}
          title={row?.deactivateDisabledReason ?? undefined}
          onClick={() => admin.setConfirmPlanDeactivate(true)}
        >
          Deactivate
        </button>
      </div>

      {admin.confirmPlanRelease ? (
        <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận release">
          <p>
            Xác nhận release <strong>{detail.code}</strong>? Plan RELEASED trước đó cùng scope
            item/stage/revision sẽ chuyển sang OBSOLETE.
          </p>
          <div className="qc-admin__actions">
            <button type="button" disabled={admin.releasePlanState === 'pending'} onClick={admin.releasePlan}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPlanRelease(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.releasePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.releasePlanError.code}: {admin.releasePlanError.message}
        </p>
      ) : null}

      {admin.confirmPlanObsolete ? (
        <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận obsolete">
          <p>
            Xác nhận obsolete <strong>{detail.code}</strong>? Plan sẽ không còn dùng cho lô kiểm tra mới.
          </p>
          <div className="qc-admin__actions">
            <button type="button" disabled={admin.obsoletePlanState === 'pending'} onClick={admin.obsoletePlan}>
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPlanObsolete(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.obsoletePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.obsoletePlanError.code}: {admin.obsoletePlanError.message}
        </p>
      ) : null}

      {admin.confirmPlanDeactivate ? (
        <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
          <p>
            Xác nhận deactivate <strong>{detail.code}</strong>?
          </p>
          <div className="qc-admin__actions">
            <button
              type="button"
              disabled={admin.deactivatePlanState === 'pending'}
              onClick={admin.deactivatePlan}
            >
              Xác nhận
            </button>
            <button type="button" onClick={() => admin.setConfirmPlanDeactivate(false)}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}
      {admin.deactivatePlanError ? (
        <p className="qc-admin__error" role="alert">
          {admin.deactivatePlanError.code}: {admin.deactivatePlanError.message}
        </p>
      ) : null}
      {(admin.releasePlanState === 'success' ||
        admin.obsoletePlanState === 'success' ||
        admin.deactivatePlanState === 'success') ? (
        <p className="qc-admin__banner" role="status">
          Đã cập nhật trạng thái checksheet.
        </p>
      ) : null}
    </aside>
  )
}

export function ChecksheetPage() {
  const admin = useQcMaster()

  return (
    <section className="qc-admin" aria-labelledby="qc-admin-title">
      <header className="qc-admin__header">
        <div>
          <p className="qc-admin__eyebrow">WEB-QMS-01-CHECKSHEET · `/web/qms/checksheets`</p>
          <h2 id="qc-admin-title">Tiêu chuẩn &amp; Checksheet</h2>
          <p className="qc-admin__lead">
            Quản lý inspection plan (IQC + IPQC/FQC/OQC/FAI), characteristic master và defect code
            (QMS01-001..020). Mutation gated bởi server <code>allowed_actions</code>. Đặc tính kiểm
            tra trên plan (inspection_characteristic) chỉ quản lý qua QC_CHECKSHEET_IMPORT tại
            Import/Export Center.
          </p>
        </div>
        <div className="qc-admin__actions">
          <Link to="/web/import-export">Import / Export Center</Link>
          <Link to="/home">Về trang chủ</Link>
        </div>
      </header>

      <div className="qc-admin__tabs" role="tablist" aria-label="Checksheet admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'checksheets'}
          onClick={() => admin.setTab('checksheets')}
        >
          Checksheets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'characteristics'}
          onClick={() => admin.setTab('characteristics')}
        >
          Characteristics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={admin.tab === 'defect_codes'}
          onClick={() => admin.setTab('defect_codes')}
        >
          Defect Codes
        </button>
      </div>

      {admin.tab === 'checksheets' ? (
        <>
          <form
            className="qc-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyPlanSearch()
            }}
          >
            <label className="qc-admin__field">
              <span>Tìm checksheet (code)</span>
              <input
                value={admin.planSearchInput}
                onChange={(e) => admin.setPlanSearchInput(e.target.value)}
                placeholder="IP-…"
              />
            </label>
            <button type="submit" className="qc-admin__btn">
              Lọc
            </button>
            <button type="button" className="qc-admin__btn" onClick={admin.openPlanCreate}>
              Tạo checksheet
            </button>
          </form>

          {admin.showPlanCreate ? (
            <div className="qc-admin__create">
              <h3>Tạo checksheet mới</h3>
              <p className="qc-admin__muted">Form luôn hiển thị — server enforce quyền tạo (QMS01-003).</p>
              <label className="qc-admin__field">
                <span>Code</span>
                <input
                  value={admin.planCreateForm.code}
                  onChange={(e) => admin.setPlanCreateForm({ ...admin.planCreateForm, code: e.target.value })}
                />
              </label>
              <label className="qc-admin__field">
                <span>Inspection stage</span>
                <select
                  value={admin.planCreateForm.inspection_stage_id}
                  onChange={(e) => {
                    const stageId = Number(e.target.value)
                    admin.setPlanCreateForm({
                      ...admin.planCreateForm,
                      inspection_stage_id: stageId,
                      item_id: 0,
                      item_revision_id: null,
                    })
                    admin.setPlanCreateItemCode('')
                  }}
                >
                  <option value={0}>Chọn stage</option>
                  {admin.stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} ({s.stage_group}) — {s.name_vi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>
                  Item (
                  {admin.planCreateStageGroup.toUpperCase() === 'IQC'
                    ? 'RAW/COMPONENT cho IQC'
                    : admin.planCreateRequiresRevision ||
                        ['IPQC', 'OQC', 'SPECIAL'].includes(
                          admin.planCreateStageGroup.toUpperCase(),
                        )
                      ? 'SF/FG cho IPQC/FQC/OQC/FAI'
                      : 'theo stage'}
                  )
                </span>
                <select
                  value={admin.planCreateForm.item_id}
                  onChange={(e) => {
                    const id = Number(e.target.value)
                    const item = admin.planCreateItemOptions.find((it) => it.id === id)
                    admin.setPlanCreateForm({
                      ...admin.planCreateForm,
                      item_id: id,
                      item_revision_id: null,
                    })
                    admin.setPlanCreateItemCode(item?.code ?? '')
                  }}
                >
                  <option value={0}>Chọn item</option>
                  {admin.planCreateItemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.item_name}
                      {item.item_type_code || item.item_type
                        ? ` (${item.item_type_code || item.item_type})`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>
                  Item revision
                  {admin.planCreateRequiresRevision
                    ? ' (bắt buộc — plan sản xuất FG/SF)'
                    : ' (tùy chọn)'}
                </span>
                <select
                  value={admin.planCreateForm.item_revision_id ?? 0}
                  onChange={(e) =>
                    admin.setPlanCreateForm({
                      ...admin.planCreateForm,
                      item_revision_id: Number(e.target.value) || null,
                    })
                  }
                >
                  <option value={0}>
                    {admin.planCreateRequiresRevision ? 'Chọn revision' : 'Không áp dụng'}
                  </option>
                  {admin.planCreateRevisionOptions.map((rev) => (
                    <option key={rev.id} value={rev.id}>
                      {rev.code} ({rev.status})
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>Sampling method</span>
                <select
                  value={admin.planCreateForm.sampling_method_id}
                  onChange={(e) =>
                    admin.setPlanCreateForm({
                      ...admin.planCreateForm,
                      sampling_method_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn sampling method</option>
                  {admin.samplingMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name_vi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>Inspection frequency</span>
                <select
                  value={admin.planCreateForm.inspection_frequency_id}
                  onChange={(e) =>
                    admin.setPlanCreateForm({
                      ...admin.planCreateForm,
                      inspection_frequency_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>Chọn frequency</option>
                  {admin.frequencies.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} — {f.name_vi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>Sampling param</span>
                <input
                  value={admin.planCreateForm.sampling_param}
                  onChange={(e) =>
                    admin.setPlanCreateForm({ ...admin.planCreateForm, sampling_param: e.target.value })
                  }
                  placeholder="n=5,c=0"
                />
              </label>
              <div className="qc-admin__actions">
                <button
                  type="button"
                  className="qc-admin__btn"
                  disabled={admin.planCreateErrors.length > 0 || admin.createPlanPending}
                  onClick={() => admin.createPlan()}
                >
                  {admin.createPlanPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closePlanCreate}>
                  Hủy
                </button>
              </div>
              {admin.createPlanError ? (
                <p className="qc-admin__error" role="alert">
                  {admin.createPlanError.code}: {admin.createPlanError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.planListState, 'checksheet')
            return banner ? (
              <p className="qc-admin__state" role={admin.planListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.planListError ? ` (${admin.planListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.planListState === 'ready' ? (
            <div className="qc-admin__layout">
              <div className="qc-admin__table-wrap">
                <table className="qc-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Stage</th>
                      <th>Item</th>
                      <th>Status</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.planRows.map((row) => (
                      <tr
                        key={row.code}
                        className={row.code === admin.selectedPlanCode ? 'qc-admin__row--active' : ''}
                      >
                        <td>
                          <button
                            type="button"
                            className="qc-admin__linkish"
                            onClick={() => admin.selectPlan(row.code)}
                          >
                            {row.code}
                          </button>
                        </td>
                        <td>{row.stageLabel}</td>
                        <td>{row.itemLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.isActive ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.planHasMore ? (
                  <button type="button" className="qc-admin__more" onClick={admin.planLoadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.planDetailLoading ? (
                <div className="qc-admin__state">Đang tải chi tiết…</div>
              ) : admin.planDetail ? (
                <PlanEditor key={admin.planDetail.code} detail={admin.planDetail} admin={admin} />
              ) : (
                <div className="qc-admin__state">Chọn checksheet để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'characteristics' ? (
        <>
          <form
            className="qc-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyCmSearch()
            }}
          >
            <label className="qc-admin__field">
              <span>Tìm characteristic (code / tên)</span>
              <input
                value={admin.cmSearchInput}
                onChange={(e) => admin.setCmSearchInput(e.target.value)}
                placeholder="CM-… / tên"
              />
            </label>
            <button type="submit" className="qc-admin__btn">
              Lọc
            </button>
            <button type="button" className="qc-admin__btn" onClick={admin.openCmCreate}>
              Tạo characteristic
            </button>
          </form>

          {admin.showCmCreate ? (
            <div className="qc-admin__create">
              <h3>Tạo characteristic master mới</h3>
              <p className="qc-admin__muted">Form luôn hiển thị — server enforce quyền tạo (QMS01-010).</p>
              <label className="qc-admin__field">
                <span>Code</span>
                <input
                  value={admin.cmCreateForm.code}
                  onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, code: e.target.value })}
                />
              </label>
              <label className="qc-admin__field">
                <span>Tên (VI)</span>
                <input
                  value={admin.cmCreateForm.name_vi}
                  onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, name_vi: e.target.value })}
                />
              </label>
              <label className="qc-admin__field">
                <span>Tên (EN)</span>
                <input
                  value={admin.cmCreateForm.name_en}
                  onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, name_en: e.target.value })}
                />
              </label>
              <label className="qc-admin__field">
                <span>Characteristic category</span>
                <select
                  value={admin.cmCreateForm.characteristic_category_id}
                  onChange={(e) =>
                    admin.setCmCreateForm({
                      ...admin.cmCreateForm,
                      characteristic_category_id: Number(e.target.value) || 0,
                    })
                  }
                >
                  <option value={0}>Chọn category</option>
                  {admin.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.code} — {cat.name_vi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>Default char type</span>
                <select
                  value={admin.cmCreateForm.default_char_type}
                  onChange={(e) =>
                    admin.setCmCreateForm({ ...admin.cmCreateForm, default_char_type: e.target.value })
                  }
                >
                  {CHAR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>Default UoM</span>
                <input
                  value={admin.cmCreateForm.default_uom}
                  onChange={(e) => admin.setCmCreateForm({ ...admin.cmCreateForm, default_uom: e.target.value })}
                />
              </label>
              <div className="qc-admin__actions">
                <button
                  type="button"
                  className="qc-admin__btn"
                  disabled={admin.cmCreateErrors.length > 0 || admin.createCmPending}
                  onClick={() => admin.createCm()}
                >
                  {admin.createCmPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeCmCreate}>
                  Hủy
                </button>
              </div>
              {admin.createCmError ? (
                <p className="qc-admin__error" role="alert">
                  {admin.createCmError.code}: {admin.createCmError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.cmListState, 'characteristic')
            return banner ? (
              <p className="qc-admin__state" role={admin.cmListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.cmListError ? ` (${admin.cmListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.cmListState === 'ready' ? (
            <div className="qc-admin__layout">
              <div className="qc-admin__table-wrap">
                <table className="qc-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Tên</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>UoM</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.cmRows.map((row) => (
                      <tr key={row.code} className={row.code === admin.selectedCmCode ? 'qc-admin__row--active' : ''}>
                        <td>
                          <button type="button" className="qc-admin__linkish" onClick={() => admin.selectCm(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.nameVi}</td>
                        <td>{row.categoryLabel}</td>
                        <td>{row.defaultCharType}</td>
                        <td>{row.defaultUom}</td>
                        <td>{row.isActive ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.cmHasMore ? (
                  <button type="button" className="qc-admin__more" onClick={admin.cmLoadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.cmDetailRow ? (
                <aside className="qc-admin__detail" aria-label="Chi tiết characteristic">
                  <h3>{admin.cmDetailRow.code}</h3>
                  <p className="qc-admin__muted">
                    {admin.cmDetailRow.nameVi} · {admin.cmDetailRow.categoryLabel}
                  </p>
                  <button
                    type="button"
                    className="qc-admin__btn qc-admin__btn--danger"
                    disabled={!admin.cmDetailRow.canDeactivate}
                    title={admin.cmDetailRow.updateDisabledReason ?? undefined}
                    onClick={() => admin.setConfirmCmDeactivate(true)}
                  >
                    Deactivate
                  </button>
                  {admin.confirmCmDeactivate ? (
                    <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
                      <p>
                        Xác nhận deactivate <strong>{admin.cmDetailRow.code}</strong>?
                      </p>
                      <div className="qc-admin__actions">
                        <button
                          type="button"
                          disabled={admin.deactivateCmState === 'pending'}
                          onClick={admin.deactivateCm}
                        >
                          Xác nhận
                        </button>
                        <button type="button" onClick={() => admin.setConfirmCmDeactivate(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {admin.deactivateCmError ? (
                    <p className="qc-admin__error" role="alert">
                      {admin.deactivateCmError.code}: {admin.deactivateCmError.message}
                    </p>
                  ) : null}
                  {admin.deactivateCmState === 'success' ? (
                    <p className="qc-admin__banner" role="status">
                      Đã deactivate characteristic.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="qc-admin__state">Chọn characteristic để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admin.tab === 'defect_codes' ? (
        <>
          <form
            className="qc-admin__filters"
            onSubmit={(e) => {
              e.preventDefault()
              admin.applyDcSearch()
            }}
          >
            <label className="qc-admin__field">
              <span>Tìm defect code (code / tên)</span>
              <input
                value={admin.dcSearchInput}
                onChange={(e) => admin.setDcSearchInput(e.target.value)}
                placeholder="DC-… / tên"
              />
            </label>
            <button type="submit" className="qc-admin__btn">
              Lọc
            </button>
            <button type="button" className="qc-admin__btn" onClick={admin.openDcCreate}>
              Tạo defect code
            </button>
          </form>

          {admin.showDcCreate ? (
            <div className="qc-admin__create">
              <h3>Tạo defect code mới</h3>
              <p className="qc-admin__muted">Form luôn hiển thị — server enforce quyền tạo (QMS01-015).</p>
              <label className="qc-admin__field">
                <span>Code</span>
                <input
                  value={admin.dcCreateForm.code}
                  onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, code: e.target.value })}
                />
              </label>
              <label className="qc-admin__field">
                <span>Tên (VI)</span>
                <input
                  value={admin.dcCreateForm.name_vi}
                  onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, name_vi: e.target.value })}
                />
              </label>
              <label className="qc-admin__field">
                <span>Tên (EN)</span>
                <input
                  value={admin.dcCreateForm.name_en}
                  onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, name_en: e.target.value })}
                />
              </label>
              <label className="qc-admin__field">
                <span>Characteristic category</span>
                <select
                  value={admin.dcCreateForm.characteristic_category_id}
                  onChange={(e) =>
                    admin.setDcCreateForm({
                      ...admin.dcCreateForm,
                      characteristic_category_id: Number(e.target.value) || 0,
                    })
                  }
                >
                  <option value={0}>Chọn category</option>
                  {admin.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.code} — {cat.name_vi}
                    </option>
                  ))}
                </select>
              </label>
              <label className="qc-admin__field">
                <span>Default severity</span>
                <select
                  value={admin.dcCreateForm.default_severity}
                  onChange={(e) => admin.setDcCreateForm({ ...admin.dcCreateForm, default_severity: e.target.value })}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="qc-admin__actions">
                <button
                  type="button"
                  className="qc-admin__btn"
                  disabled={admin.dcCreateErrors.length > 0 || admin.createDcPending}
                  onClick={() => admin.createDc()}
                >
                  {admin.createDcPending ? 'Đang tạo…' : 'Tạo'}
                </button>
                <button type="button" onClick={admin.closeDcCreate}>
                  Hủy
                </button>
              </div>
              {admin.createDcError ? (
                <p className="qc-admin__error" role="alert">
                  {admin.createDcError.code}: {admin.createDcError.message}
                </p>
              ) : null}
            </div>
          ) : null}

          {(() => {
            const banner = listStateMessage(admin.dcListState, 'defect code')
            return banner ? (
              <p className="qc-admin__state" role={admin.dcListState === 'error' ? 'alert' : 'status'}>
                {banner}
                {admin.dcListError ? ` (${admin.dcListError.code})` : ''}
              </p>
            ) : null
          })()}

          {admin.dcListState === 'ready' ? (
            <div className="qc-admin__layout">
              <div className="qc-admin__table-wrap">
                <table className="qc-admin__table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Tên</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.dcRows.map((row) => (
                      <tr key={row.code} className={row.code === admin.selectedDcCode ? 'qc-admin__row--active' : ''}>
                        <td>
                          <button type="button" className="qc-admin__linkish" onClick={() => admin.selectDc(row.code)}>
                            {row.code}
                          </button>
                        </td>
                        <td>{row.nameVi}</td>
                        <td>{row.categoryLabel}</td>
                        <td>{row.defaultSeverity}</td>
                        <td>{row.isActive ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admin.dcHasMore ? (
                  <button type="button" className="qc-admin__more" onClick={admin.dcLoadMore}>
                    Tải thêm
                  </button>
                ) : null}
              </div>

              {admin.dcDetailRow ? (
                <aside className="qc-admin__detail" aria-label="Chi tiết defect code">
                  <h3>{admin.dcDetailRow.code}</h3>
                  <p className="qc-admin__muted">
                    {admin.dcDetailRow.nameVi} · {admin.dcDetailRow.categoryLabel} ·{' '}
                    {admin.dcDetailRow.defaultSeverity}
                  </p>
                  <button
                    type="button"
                    className="qc-admin__btn qc-admin__btn--danger"
                    disabled={!admin.dcDetailRow.canDeactivate}
                    onClick={() => admin.setConfirmDcDeactivate(true)}
                  >
                    Deactivate
                  </button>
                  {admin.confirmDcDeactivate ? (
                    <div className="qc-admin__confirm" role="dialog" aria-label="Xác nhận deactivate">
                      <p>
                        Xác nhận deactivate <strong>{admin.dcDetailRow.code}</strong>?
                      </p>
                      <div className="qc-admin__actions">
                        <button
                          type="button"
                          disabled={admin.deactivateDcState === 'pending'}
                          onClick={admin.deactivateDc}
                        >
                          Xác nhận
                        </button>
                        <button type="button" onClick={() => admin.setConfirmDcDeactivate(false)}>
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {admin.deactivateDcError ? (
                    <p className="qc-admin__error" role="alert">
                      {admin.deactivateDcError.code}: {admin.deactivateDcError.message}
                    </p>
                  ) : null}
                  {admin.deactivateDcState === 'success' ? (
                    <p className="qc-admin__banner" role="status">
                      Đã deactivate defect code.
                    </p>
                  ) : null}
                </aside>
              ) : (
                <div className="qc-admin__state">Chọn defect code để xem chi tiết.</div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}