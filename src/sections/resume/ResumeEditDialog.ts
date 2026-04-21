import { alertDialog, openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import { RoleDetails, ResumeRow } from './types'
import '../../styles/EditDialogs.css'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode, literal } from 'rdflib'
import { processResumeMutations } from './mutations'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, applyRowSelectChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { trashIcon } from '../../icons-svg/profileIcons'
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editResumeDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveResumeUpdatesFailedPrefixText
} from '../../texts'

type ResumeFormState = {
  resumeData: ResumeRow[]
}

type ResumeValidationResult = {
  ok: boolean
  message?: string
}

function sanitizeResumeFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function parseYearMonthFromDateText(dateText: string): { year: string, month: string } {
  const normalized = (dateText || '').trim()
  if (!normalized) return { year: '', month: '' }

  const isoYearMonth = normalized.match(/^(\d{4})-(\d{2})/)
  if (isoYearMonth) {
    return { year: isoYearMonth[1], month: isoYearMonth[2] }
  }

  const fallbackYear = normalized.match(/(\d{4})/)
  return {
    year: fallbackYear ? fallbackYear[1] : '',
    month: ''
  }
}

function rowHasContent(row: ResumeRow): boolean {

  return Boolean(row.isCurrentRole) || [
    row.title,
    row.roleType,
    toText(row.startDate),
    toText(row.endDate),
    row.orgName,
    row.orgType,
    row.orgLocation,
    row.orgHomePage,
    row.description
  ].some(hasNonEmptyText)
}

function toFormState(resumeData: RoleDetails[]): ResumeFormState {

  const roles = (resumeData || [])
    .map((role) => ({
      title: sanitizeResumeFieldValue(toText(role.title)),
      roleType: sanitizeResumeFieldValue(toText(role.roleType)),
      startDate: role.startDate,
      endDate: role.endDate,
      isCurrentRole: role.isCurrentRole ?? !role.endDate,
      orgName: sanitizeResumeFieldValue(toText(role.orgName)),
      orgType: sanitizeResumeFieldValue(toText(role.orgType)),
      orgLocation: sanitizeResumeFieldValue(toText(role.orgLocation)),
      orgHomePage: sanitizeResumeFieldValue(toText(role.orgHomePage)),
      description: sanitizeResumeFieldValue(toText(role.description)),
      entryNode: toText(role.entryNode),
      status: toText(role.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((role) => rowHasContent(role) || Boolean(role.entryNode))

  return {
    resumeData: roles.length
      ? roles
      : [{
        title: '',
        roleType: '',
        startDate: undefined,
        endDate: undefined,
        isCurrentRole: false,
        orgName: '',
        orgType: '',
        orgLocation: '',
        orgHomePage: '',
        description: '',
        entryNode: '',
        status: 'new'
      }]
  }
}

function validateResumeBeforeSave(rows: ResumeRow[]): ResumeValidationResult {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.status === 'deleted') continue
    if (!rowHasContent(row)) continue

    const endDateText = toText(row.endDate).trim()
    if (!row.isCurrentRole && !endDateText) {
      return {
        ok: false,
        message: `Resume ${i + 1}: End Year is required unless "I am currently working in this role" is selected.`
      }
    }
  }

  return { ok: true }
}

type ResumeEditableField =
  | 'title'
  | 'startDate'
  | 'endDate'
  | 'isCurrentRole'
  | 'orgName'
  | 'orgType'
  | 'orgLocation'
  | 'orgHomePage'
  | 'description'

type ResumeRowProps = {
  resumeData: ResumeRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
}

function renderResumeInputRow({
  resumeData,
  index,
  displayIndex,
  onDelete,
  onChange
}: ResumeRowProps) {
  const resumeRow = resumeData[index]
  const label = `Resume ${displayIndex + 1}`
  const experienceHeadingId = `resume-experience-heading-${index}`
  
  const titleName = `resume-title-${index}`
  const organizationName = `resume-organization-${index}`
  const organizationTypeName = `resume-organization-type-${index}`
  const organizationTypeSelectId = `resume-organization-type-select-${index}`
  const companyUrlName = `resume-company-url-${index}`
  const orgLocationName = `resume-org-location-${index}`
  const descriptionName = `resume-description-${index}`
  const descriptionCounterId = `resume-description-counter-${index}`
  const descriptionMaxLength = 2000
  const descriptionCount = (resumeRow?.description || '').length

  const startMonthLabel = `Start Month ${displayIndex + 1}`
  const startMonthInputName = `resume-start-month-${index}`
  const startMonthSelectId = `resume-start-month-select-${index}`
  const startYearLabel = `Start Year ${displayIndex + 1}`
  const startYearInputName = `resume-start-year-${index}`
  const startYearSelectId = `resume-start-year-select-${index}`
  const startDateText = toText(resumeRow?.startDate)
  const startDateParts = parseYearMonthFromDateText(startDateText)
  const startMonthValue = startDateParts.month
  const startYearText = startDateParts.year
  const endMonthLabel = `End Month ${displayIndex + 1}`
  const endMonthInputName = `resume-end-month-${index}`
  const endMonthSelectId = `resume-end-month-select-${index}`
  const endDateText = toText(resumeRow?.endDate)
  const endYearLabel = `End Year ${displayIndex + 1}`
  const endYearInputName = `resume-end-year-${index}`
  const endYearSelectId = `resume-end-year-select-${index}`
  const endDateParts = parseYearMonthFromDateText(endDateText)
  const endMonthValue = endDateParts.month
  const endYearParsedText = endDateParts.year
  const isCurrentRoleId = `resume-current-role-${index}`
  const currentYear = new Date().getFullYear()
  const baseYearOptions = Array.from({ length: 120 }, (_, i) => String(currentYear - i))
  const yearOptions = Array.from(new Set([
    ...baseYearOptions,
    startYearText,
    endYearParsedText
  ].filter(Boolean))).sort((a, b) => Number(b) - Number(a))

  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const renderMonthOptions = (selectedMonth: string, emptyLabel = 'Select Month') => html`
    <option value="" ?selected=${!selectedMonth}>${emptyLabel}</option>
    ${monthOptions.map((month) => html`
      <option value=${month.value} ?selected=${month.value === selectedMonth}>${month.label}</option>
    `)}
  `

  const renderYearOptions = (selectedYear: string, emptyLabel = 'Select Year') => html`
    <option value="" ?selected=${!selectedYear}>${emptyLabel}</option>
    ${yearOptions.map((year) => html`
      <option value=${year} ?selected=${year === selectedYear}>${year}</option>
    `)}
  `

  const handleResumeInput = (field: ResumeEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeResumeFieldValue(target.value)
    if (resumeRow) {
      applyRowFieldChange(resumeRow, field, nextValue, rowHasContent)
      onChange()
    }
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  const buildDateLiteral = (month: string, year: string) => {
    if (!month || !year) return undefined
    return literal(`${year}-${month}-01`)
  }

  /* The following function was generated by AI Model: GPT-5.3-Codex  */
  /* Prompt: can you make this a month drop down for the start year */
  const handleStartMonthChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const month = target.value
    const year = parseYearMonthFromDateText(toText(resumeData[index]?.startDate)).year || String(currentYear)
    const nextStartDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleStartYearChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const year = target.value
    const month = parseYearMonthFromDateText(toText(resumeData[index]?.startDate)).month || '01'
    const nextStartDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleEndMonthChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const month = target.value
    const year = parseYearMonthFromDateText(toText(resumeData[index]?.endDate)).year || String(currentYear)
    const nextEndDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'endDate', nextEndDate, rowHasContent)
      onChange()
    }
  }

  const handleEndYearChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const year = target.value
    const month = parseYearMonthFromDateText(toText(resumeData[index]?.endDate)).month || '01'
    const nextEndDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'endDate', nextEndDate, rowHasContent)
      onChange()
    }
  }

  const handleDescriptionInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    const nextValue = sanitizeResumeFieldValue(target.value.slice(0, descriptionMaxLength))
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'description', nextValue, rowHasContent)
      onChange()
    }
  }

  const handleCurrentRoleToggle = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'isCurrentRole', target.checked, rowHasContent)
      if (target.checked) {
        applyRowFieldChange(resumeData[index], 'endDate', undefined, rowHasContent)
      }

      const formRoot = target.form || target.closest('form')
      const endMonthSelect = formRoot?.querySelector(`#${endMonthSelectId}`) as HTMLSelectElement | null
      const endYearSelect = formRoot?.querySelector(`#${endYearSelectId}`) as HTMLSelectElement | null

      if (endMonthSelect) {
        endMonthSelect.disabled = target.checked
        endMonthSelect.value = ''
        const emptyOption = endMonthSelect.options[0]
        if (emptyOption) {
          emptyOption.text = target.checked ? 'Present' : 'Select Month'
        }
      }

      if (endYearSelect) {
        endYearSelect.disabled = target.checked
        endYearSelect.value = ''
        const emptyOption = endYearSelect.options[0]
        if (emptyOption) {
          emptyOption.text = target.checked ? '' : 'Select Year'
        }
      }
    }
  }

  const handleOrganizationTypeInput = (e: Event) => {
    const target = e.target as HTMLSelectElement
    const nextType = target.value
    if (resumeRow) {
      applyRowSelectChange(resumeRow, 'orgType', nextType)
      onChange()
    }
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--resume-entry-header" role="group" aria-labelledby=${experienceHeadingId}>
      <h3 id=${experienceHeadingId} class="profile-edit-dialog__entry-heading">${label}</h3>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge">
        <button
          type="button"
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete resume ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span class="profile-edit-dialog__delete-icon" aria-hidden="true">${trashIcon}</span>
        </button>
      </div>
    </div>
    <label aria-label=${`${label} Title`} class="label profile-edit-dialog__field">
      Title
      <input
        class="input"
        type="text"
        name=${titleName}
        .value=${resumeRow?.title || ''}
        data-contact-field="title"
        data-entry-node=${resumeRow?.entryNode || ''}
        data-row-status=${resumeRow?.status || 'n/a'}
        placeholder="Title"
        autocomplete="title"
        inputmode="text"
        @change=${handleResumeInput('title')}
      />
    </label>
    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Organization Name`} class="label profile-edit-dialog__field">
        Company or Organization 
        <input
          class="input"
          type="text"
          name=${organizationName}
          .value=${resumeRow?.orgName || ''}
          required
          data-contact-field="organizationName"
          data-entry-node=${resumeRow?.entryNode || ''}
          data-row-status=${resumeRow?.status || 'n/a'}
          placeholder="Company or Organization"
          autocomplete="organization"
          inputmode="text"
          @change=${handleResumeInput('orgName')}
        />
      </label>
      <label aria-label=${`${label} Organization Type`} class="label profile-edit-dialog__field">
        Organization Type
        <select name=${organizationTypeName} id=${organizationTypeSelectId} @change=${handleOrganizationTypeInput} .value=${resumeRow?.orgType || ''}>
          <option value="Corporation">Corporation</option>
          <option value="EducationalOrganization">Educational Organization</option>
          <option value="ResearchOrganization">Research Organization</option>
          <option value="GovernmentOrganization">Government Organization</option>
          <option value="NGO">NGO</option>
          <option value="PerformingGroup">Performing Group</option>
          <option value="Project">Project</option>
          <option value="SportsOrganization">Sports Organization</option>
          <option value="Other">Other</option>
        </select>
      </label>
    </div>  
    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Company URL`} class="label profile-edit-dialog__field">
        Company URL
        <input
          class="input"
          type="text"
          name=${companyUrlName}
          .value=${resumeRow?.orgHomePage || ''}
          data-contact-field="orgHomePage"
          data-entry-node=${resumeRow?.entryNode || ''}
          data-row-status=${resumeRow?.status || 'n/a'}
          placeholder="Company URL"
          autocomplete="url"
          inputmode="text"
          @change=${handleResumeInput('orgHomePage')}
        />
      </label>
      <label aria-label=${`${label} Location`} class="label profile-edit-dialog__field profile-edit-dialog__field--resume-location">
        Location
        <input
          class="input"
          type="text"
          name=${orgLocationName}
          .value=${resumeRow?.orgLocation || ''}
          data-contact-field="orgLocation"
          data-entry-node=${resumeRow?.entryNode || ''}
          data-row-status=${resumeRow?.status || 'n/a'}
          placeholder="Location"
          autocomplete="address-level2"
          inputmode="text"
          @change=${handleResumeInput('orgLocation')}
        />
      </label>
    </div>
    <div class="profile-edit-dialog__row profile-edit-dialog__row--resume-dates">
      <label aria-label=${`Start Date ${displayIndex + 1}`} class="label profile-edit-dialog__field profile-edit-dialog__field--date-group">
        <span>Start Date</span>
        <div class="profile-edit-dialog__date-pair">
          <select name=${startMonthInputName} id=${startMonthSelectId} aria-label=${startMonthLabel} @change=${handleStartMonthChange}>
            ${renderMonthOptions(startMonthValue)}
          </select>
          <select name=${startYearInputName} id=${startYearSelectId} aria-label=${startYearLabel} @change=${handleStartYearChange}>
            ${renderYearOptions(startYearText)}
          </select>
        </div>
      </label>
      <label aria-label=${`End Date ${displayIndex + 1}`} class="label profile-edit-dialog__field profile-edit-dialog__field--date-group">
        <span>End Date</span>
        <div class="profile-edit-dialog__date-pair">
          <select
            name=${endMonthInputName}
            id=${endMonthSelectId}
            aria-label=${endMonthLabel}
            @change=${handleEndMonthChange}
            ?disabled=${Boolean(resumeRow?.isCurrentRole)}
          >
            ${renderMonthOptions(endMonthValue, resumeRow?.isCurrentRole ? 'Present' : 'Select Month')}
          </select>
          <select
            name=${endYearInputName}
            id=${endYearSelectId}
            aria-label=${endYearLabel}
            @change=${handleEndYearChange}
            ?disabled=${Boolean(resumeRow?.isCurrentRole)}
          >
            ${renderYearOptions(endYearParsedText, resumeRow?.isCurrentRole ? '' : 'Select Year')}
          </select>
        </div>
      </label>
    </div>
    <div class="profile-edit-dialog__row profile-edit-dialog__row--inline-end">
      <label class="label profile-edit-dialog__checkbox-label" for=${isCurrentRoleId}>
        <input
          class="profile-edit-dialog__checkbox-input"
          type="checkbox"
          id=${isCurrentRoleId}
          name="isCurrentRole"
          .checked=${Boolean(resumeRow?.isCurrentRole)}
          @change=${handleCurrentRoleToggle}
        />
        <span>I am currently working in this role</span>
      </label>
    </div>
    <label aria-label=${`${label} Description`} class="label profile-edit-dialog__field profile-edit-dialog__field--full profile-edit-dialog__field--stack">
      <span>Description</span>
      <textarea
        class="profile-edit-dialog__textarea"
        name=${descriptionName}
        rows="4"
        .value=${resumeRow?.description || ''}
        maxlength=${descriptionMaxLength}
        aria-describedby=${descriptionCounterId}
        data-contact-field="description"
        data-entry-node=${resumeRow?.entryNode || ''}
        data-row-status=${resumeRow?.status || 'n/a'}
        placeholder="Description"
        autocomplete="off"
        inputmode="text"
        @input=${handleDescriptionInput}
      ></textarea>
      <small id=${descriptionCounterId} aria-live="polite">${descriptionCount}/${descriptionMaxLength}</small>
    </label>
  `
}

function renderResumeSection(resumeData: ResumeRow[], onAddRow: () => void) {
  const visibleResumeRows = resumeData
    .map((resume, index) => ({ resume, index }))
    .filter(({ resume }) => resume.status !== 'deleted')

  return html`
    <section class="profile-edit-dialog__section profile-edit-dialog__section--resume" aria-label="Resume">
      <fieldset>
        <legend class="sr-only">Resume entries</legend>
        ${visibleResumeRows.map(({ index }, displayIndex) => renderResumeInputRow({
          resumeData,
          index,
          displayIndex,
          onDelete: () => {
            deleteRow(resumeData, index)
            onAddRow()
          },
          onChange: onAddRow
        }))}
      </fieldset>
    </section>
  `
}

function renderResumeEditTemplate(
  form: HTMLFormElement,
  formState: ResumeFormState,
  rerender: () => void,
  viewerMode: ViewerMode
) {
  render(html`
    ${renderResumeSection(formState.resumeData, rerender)}
    ${viewerMode !== 'owner'
      ? html`<p class="profile-edit-dialog__login-message">${ownerLoginRequiredDialogMessageText}</p>`
      : null}
  `, form)
}

type ResumeDialogRenderState = {
  dialogScrollTop: number
  descriptionScrollTop: number
  activeId: string
  activeName: string
}

function captureResumeDialogRenderState(form: HTMLFormElement): ResumeDialogRenderState {
  const dialog = form.closest('dialog') as HTMLDialogElement | null
  const description = dialog?.querySelector('#modal-desc') as HTMLDivElement | null
  const activeElement = form.ownerDocument.activeElement as HTMLElement | null

  return {
    dialogScrollTop: dialog?.scrollTop || 0,
    descriptionScrollTop: description?.scrollTop || 0,
    activeId: activeElement?.id || '',
    activeName: activeElement?.getAttribute('name') || ''
  }
}

function restoreResumeDialogRenderState(form: HTMLFormElement, state: ResumeDialogRenderState): void {
  const dialog = form.closest('dialog') as HTMLDialogElement | null
  const description = dialog?.querySelector('#modal-desc') as HTMLDivElement | null

  if (dialog) dialog.scrollTop = state.dialogScrollTop
  if (description) description.scrollTop = state.descriptionScrollTop

  const escapedId = state.activeId && typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(state.activeId)
    : state.activeId
  const escapedName = state.activeName && typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(state.activeName)
    : state.activeName

  let nextActive: HTMLElement | null = null
  if (escapedId) {
    nextActive = form.querySelector(`#${escapedId}`) as HTMLElement | null
  }
  if (!nextActive && escapedName) {
    nextActive = form.querySelector(`[name="${escapedName}"]`) as HTMLElement | null
  }

  if (nextActive && typeof nextActive.focus === 'function') {
    nextActive.focus({ preventScroll: true })
  }
}

function createResumeEditForm(resumeData: RoleDetails[], viewerMode: ViewerMode) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')
  form.classList.add('profile__edit-form--resume')

  const formState = toFormState(resumeData)
  const rerender = () => {
    const renderState = captureResumeDialogRenderState(form)
    renderResumeEditTemplate(form, formState, rerender, viewerMode)
    restoreResumeDialogRenderState(form, renderState)
  }
  rerender()

  const addRow = () => {
    formState.resumeData.push({
      title: '',
      roleType: '',
      startDate: undefined,
      endDate: undefined,
      isCurrentRole: false,
      orgName: '',
      orgType: '',
      orgLocation: '',
      orgHomePage: '',
      description: '',
      entryNode: '',
      status: 'new'
    })
    rerender()
  }

  return { form, formState, rerender, addRow }
}


export async function createResumeEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  resumeData: RoleDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState, rerender, addRow } = createResumeEditForm(resumeData, viewerMode)

  const result = await openInputDialog({
    title: editResumeDialogTitleText,
    dom,
    form,
    headerAction: {
      type: 'button',
      label: '+ Add More',
      ariaLabel: 'Add another resume entry',
      onClick: addRow
    },
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: async () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }

      const plan: MutationOps<ResumeRow> = summarizeRowOps(formState.resumeData, rowHasContent)
      const hasChanges = plan.create.length > 0 || plan.update.length > 0 || plan.remove.length > 0
      if (!hasChanges) {
        return 'No resume changes detected.'
      }

      const validation = validateResumeBeforeSave(formState.resumeData)
      if (!validation.ok) {
        return validation.message || 'Please complete the required resume fields.'
      }

      return null
    },
    onSave: async () => {
      const plan: MutationOps<ResumeRow> = summarizeRowOps(formState.resumeData, rowHasContent)
      await processResumeMutations(store, subject, plan)
      rerender()
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveResumeUpdatesFailedPrefixText} ${message}`
    }
  })

  if (!result) return
  if (onSaved) {
    await onSaved()
    return
  }
  await alertDialog('Resume updates saved. Refresh to see latest values.', 'Saved', dom)
}
