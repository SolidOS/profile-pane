import { alertDialog, openInputDialog } from "../../ui/dialog"
import { html, render } from "lit-html"
import { RoleDetails, ResumeRow } from "./types"
import "../../styles/SectionInputRows.css"
import "../../styles/ContactInfoEditDialog.css"
import { LiveStore, NamedNode, literal } from "rdflib"
import { processResumeMutations } from "./mutations"
import { ViewerMode } from "../../types"
import { applyRowFieldChange, deleteRow, summarizeRowOps } from "../shared/rowState"
import { hasNonEmptyText, sanitizeTextValue, toText } from "../../textUtils"
import { MutationOps } from "../shared/types"
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editResumeDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveResumeUpdatesFailedPrefixText
} from "../../texts"

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
        message: `Experience ${i + 1}: End Year is required unless "I am currently working in this role" is selected.`
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
  const label = `Experience ${displayIndex + 1}`
  const experienceHeadingId = `resume-experience-heading-${index}`
  
  const titleName = `resume-title-${index}`
  const organizationName = `resume-organization-${index}`
  const organizationTypeName = `resume-organization-type-${index}`
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

  const renderMonthOptions = (selectedMonth: string) => html`
    <option value="" ?selected=${!selectedMonth}>Select month</option>
    ${monthOptions.map((month) => html`
      <option value=${month.value} ?selected=${month.value === selectedMonth}>${month.label}</option>
    `)}
  `

  const renderYearOptions = (selectedYear: string) => html`
    <option value="" ?selected=${!selectedYear}>Select year</option>
    ${yearOptions.map((year) => html`
      <option value=${year} ?selected=${year === selectedYear}>${year}</option>
    `)}
  `

  if (startDateText || endDateText) {
    console.log('[resume-date-dropdown] parsed row dates', {
      index,
      entryNode: resumeRow?.entryNode || '',
      startDateText,
      startYearText,
      startMonthValue,
      endDateText,
      endYearText: endYearParsedText,
      endMonthValue,
      selectedStartYearInOptions: yearOptions.includes(startYearText),
      selectedEndYearInOptions: yearOptions.includes(endYearParsedText),
      yearOptionsSample: yearOptions.slice(0, 6)
    })
  }




  const handleResumeInput = (field: ResumeEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeResumeFieldValue(target.value)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], field, nextValue, rowHasContent)
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
      onChange()
    }
  }

  return html`
    <div class="inputRow" role="group" aria-labelledby=${experienceHeadingId}>
      <h5 id=${experienceHeadingId}>${label}</h5>
      <div class="inputActions inputActions--edge">
        <button
          type="button"
          class="deleteEntryButton"
          aria-label=${`Delete experience ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <svg class="deleteEntryIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-1 6h2v9H8V9zm6 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z" />
          </svg>
        </button>
      </div>
    </div>
    <label aria-label=${`${label} Title`} class="inputValueRow">
      Title
      <input
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
    <div class="inputRow">
      <label aria-label=${`${label} Organization Name`} class="inputValueRow">
        Company or Organization 
        <input
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
      <label aria-label=${`${label} Organization Type`} class="inputValueRow">
        Company Type
        <input
          type="text"
          name=${organizationTypeName}
          .value=${resumeRow?.orgType || ''}
          required
          data-contact-field="orgType"
          data-entry-node=${resumeRow?.entryNode || ''}
          data-row-status=${resumeRow?.status || 'n/a'}
          placeholder="Company Type"
          autocomplete="organization"
          inputmode="text"
          @change=${handleResumeInput('orgType')}
        />
      </label>
    </div>  
    <div class="inputRow">
      <label aria-label=${`${label} Company URL`} class="inputValueRow">
        Company URL
        <input
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
      <label aria-label=${`${label} Location`} class="inputValueRow">
        Location
        <input
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
    <div class="inputRow">
      <label aria-label=${startMonthLabel} class="inputTypeRow">
        Start Month
        <select name=${startMonthInputName} id=${startMonthSelectId} @change=${handleStartMonthChange}>
          ${renderMonthOptions(startMonthValue)}
        </select>
      </label>
      <label aria-label=${startYearLabel} class="inputTypeRow">
        Start Year
        <select name=${startYearInputName} id=${startYearSelectId} @change=${handleStartYearChange}>
          ${renderYearOptions(startYearText)}
        </select>
      </label>
      <label aria-label=${endMonthLabel} class="inputTypeRow">
        End Month
        <select name=${endMonthInputName} id=${endMonthSelectId} @change=${handleEndMonthChange}>
          ${renderMonthOptions(endMonthValue)}
        </select>
      </label>
      <label aria-label=${endYearLabel} class="inputTypeRow">
        End Year
        <select name=${endYearInputName} id=${endYearSelectId} @change=${handleEndYearChange}>
          ${renderYearOptions(endYearParsedText)}
        </select>
      </label>
    </div>
    <div class="inputRow inputRow--inlineEnd">
      <label class="inputCheckboxLabel" for=${isCurrentRoleId}>
        <input
          type="checkbox"
          id=${isCurrentRoleId}
          name="isCurrentRole"
          .checked=${Boolean(resumeRow?.isCurrentRole)}
          @change=${handleCurrentRoleToggle}
        />
        <span>I am currently working in this role</span>
      </label>
    </div>
    <label aria-label=${`${label} Description`} class="inputValueRow inputValueRow--full inputValueRow--stack">
      <span>Description</span>
      <textarea
        class="inputTextarea inputTextarea--multiline"
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
  const createNewRow = (event: Event) => {
    event.preventDefault()
    resumeData.push({
      title: '',
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
    onAddRow()
  }

  const visibleResumeRows = resumeData
    .map((resume, index) => ({ resume, index }))
    .filter(({ resume }) => resume.status !== 'deleted')

  return html`
    <section 
      aria-labelledby="resume-heading" 
      class="resumeEditSection section-bg">
      <header class="sectionHeader">
        <h4 id="resume-heading">
          <span class="sectionTitleIcon" aria-hidden="true">&#9993;</span>
          Resume
        </h4>
        <button
          type="button"
          class="actionButton"
          aria-label="Add another resume entry"
          @click=${createNewRow}
        >
          + Add More
        </button>
      </header>
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

function renderResumeEditTemplate(form: HTMLFormElement, formState: ResumeFormState, rerender: () => void) {
  render(html`
    ${renderResumeSection(formState.resumeData, rerender)}
  `, form)
}

function createResumeEditForm(resumeData: RoleDetails[]) {
  const form = document.createElement('form')
  form.classList.add('section-edit-form')

  const formState = toFormState(resumeData)
  const rerender = () => renderResumeEditTemplate(form, formState, rerender)
  rerender()

  return { form, formState, rerender }
}


export async function createResumeEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  resumeData: RoleDetails[],
  viewerMode: ViewerMode
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState, rerender } = createResumeEditForm(resumeData)

  const result = await openInputDialog({
    title: editResumeDialogTitleText,
    dom,
    form,
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
  await alertDialog('Resume updates saved. Refresh to see latest values.', 'Saved', dom)
}
