import { alertDialog, openInputDialog } from "../../ui/dialog"
import { html, render } from "lit-html"
import { EducationRow, EducationDetails } from "./types"
import "../../styles/SectionInputRows.css"
import "../../styles/ContactInfoEditDialog.css"
import { LiveStore, NamedNode } from "rdflib"
import { processEducationMutations } from "./mutations"
import { ViewerMode } from "../../types"
import { applyRowFieldChange, deleteRow, summarizeRowOps } from "../shared/rowState"
import { hasNonEmptyText, sanitizeTextValue, toText } from "../../textUtils"
import { MutationOps } from "../shared/types"
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editEducationDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveEducationUpdatesFailedPrefixText,
} from "../../texts"

type EducationFormState = {
  educationData: EducationRow[]
}

type EducationValidationResult = {
  ok: boolean
  message?: string
}

function sanitizeEducationFieldValue(value: string): string {
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

function rowHasContent(row: EducationRow): boolean {

  return [
    row.school,
    toText(row.startDate),
    toText(row.endDate),
    row.degree,
    row.location,
    row.description
  ].some(hasNonEmptyText)
}

function toFormState(educationData: EducationDetails[]): EducationFormState {

  const education = (educationData || [])
    .map((educationEntry) => ({
      school: sanitizeEducationFieldValue(toText(educationEntry.school)),
      startDate: educationEntry.startDate,
      endDate: educationEntry.endDate,
      degree: sanitizeEducationFieldValue(toText(educationEntry.degree)),
      location: sanitizeEducationFieldValue(toText(educationEntry.location)),
      description: sanitizeEducationFieldValue(toText(educationEntry.description)),
      entryNode: toText(educationEntry.entryNode),
      status: toText(educationEntry.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((educationEntry) => rowHasContent(educationEntry) || Boolean(educationEntry.entryNode))

  return {
    educationData: education.length
      ? education
      : [{
        school: '',
        startDate: undefined,
        endDate: undefined,
        degree: '',
        location: '',
        description: '',
        entryNode: '',
        status: 'new'
      }]
  }
}

function validateEducationBeforeSave(rows: EducationRow[]): EducationValidationResult {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.status === 'deleted') continue
    if (!rowHasContent(row)) continue

  }

  return { ok: true }
}

type EducationEditableField =
  | 'school'
  | 'startDate'
  | 'endDate'
  | 'location'
  | 'description'
  | 'degree'

type EducationRowProps = {
  educationData: EducationRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
}

function renderEducationInputRow({
  educationData,
  index,
  displayIndex,
  onDelete,
  onChange
}: EducationRowProps) {
  const educationRow = educationData[index]
  const label = `Education ${displayIndex + 1}`
  const educationHeadingId = `education-heading-${index}`
  
  const schoolName = `education-school-${index}`
  const degreeName = `education-degree-${index}`
  const descriptionName = `education-description-${index}`
  const descriptionCounterId = `education-description-counter-${index}`
  const descriptionMaxLength = 2000
  const descriptionCount = (educationRow?.description || '').length

  const startMonthLabel = `Start Month ${displayIndex + 1}`
  const startMonthInputName = `education-start-month-${index}`
  const startMonthSelectId = `education-start-month-select-${index}`
  const startYearLabel = `Start Year ${displayIndex + 1}`
  const startYearInputName = `education-start-year-${index}`
  const startYearSelectId = `education-start-year-select-${index}`
  const startDateText = toText(educationRow?.startDate)
  const startDateParts = parseYearMonthFromDateText(startDateText)
  const startMonthValue = startDateParts.month
  const startYearText = startDateParts.year
  const endMonthLabel = `End Month ${displayIndex + 1}`
  const endMonthInputName = `education-end-month-${index}`
  const endMonthSelectId = `education-end-month-select-${index}`
  const endDateText = toText(educationRow?.endDate)
  const endYearLabel = `End Year ${displayIndex + 1}`
  const endYearInputName = `education-end-year-${index}`
  const endYearSelectId = `education-end-year-select-${index}`
  const endDateParts = parseYearMonthFromDateText(endDateText)
  const endMonthValue = endDateParts.month
  const endYearParsedText = endDateParts.year

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
  
  const handleEducationInput = (field: EducationEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeEducationFieldValue(target.value)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], field, nextValue, rowHasContent)
      onChange()
    }
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  const buildDateLiteral = (month: string, year: string) => {
    if (!month || !year) return undefined
    return `${year}-${month}-01`
  }

  const handleStartMonthChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const month = target.value
    const year = parseYearMonthFromDateText(toText(educationData[index]?.startDate)).year || String(currentYear)
    const nextStartDate = buildDateLiteral(month, year)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleStartYearChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const year = target.value
    const month = parseYearMonthFromDateText(toText(educationData[index]?.startDate)).month || '01'
    const nextStartDate = buildDateLiteral(month, year)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleEndMonthChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const month = target.value
    const year = parseYearMonthFromDateText(toText(educationData[index]?.endDate)).year || String(currentYear)
    const nextEndDate = buildDateLiteral(month, year)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'endDate', nextEndDate, rowHasContent)
      onChange()
    }
  }

  const handleEndYearChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const year = target.value
    const month = parseYearMonthFromDateText(toText(educationData[index]?.endDate)).month || '01'
    const nextEndDate = buildDateLiteral(month, year)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'endDate', nextEndDate, rowHasContent)
      onChange()
    }
  }

  const handleDescriptionInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    const nextValue = sanitizeEducationFieldValue(target.value.slice(0, descriptionMaxLength))
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'description', nextValue, rowHasContent)
      onChange()
    }
  }

  return html`
    <div class="inputRow" role="group" aria-labelledby=${educationHeadingId}>
      <h5 id=${educationHeadingId}>${label}</h5>
      <div class="inputActions inputActions--edge">
        <button
          type="button"
          class="deleteEntryButton"
          aria-label=${`Delete education ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <svg class="deleteEntryIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-1 6h2v9H8V9zm6 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z" />
          </svg>
        </button>
      </div>
    </div>
    <label aria-label=${`${label} School/College`} class="inputValueRow">
      School/College
      <input
        type="text"
        name=${schoolName}
        .value=${educationData[index]?.school || ''}
        data-contact-field="title"
        data-entry-node=${educationData[index]?.entryNode || ''}
        data-row-status=${educationData[index]?.status || 'n/a'}
        placeholder="School/College"
        autocomplete="organization"
        inputmode="text"
        @change=${handleEducationInput('school')}
      />
    </label>
    <div class="inputRow">
      <label aria-label=${`${label} Degree`} class="inputValueRow">
        Degree
        <input
          type="text"
          name=${degreeName}
          .value=${educationData[index]?.degree || ''}
          required
          data-contact-field="degree"
          data-entry-node=${educationData[index]?.entryNode || ''}
          data-row-status=${educationData[index]?.status || 'n/a'}
          placeholder="Degree"
          autocomplete="off"
          inputmode="text"
          @change=${handleEducationInput('degree')}
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
    <label aria-label=${`${label} Description`} class="inputValueRow inputValueRow--full inputValueRow--stack">
      <span>Description</span>
      <textarea
        class="inputTextarea inputTextarea--multiline"
        name=${descriptionName}
        rows="4"
        .value=${educationData[index]?.description || ''}
        maxlength=${descriptionMaxLength}
        aria-describedby=${descriptionCounterId}
        data-contact-field="description"
        data-entry-node=${educationData[index]?.entryNode || ''}
        data-row-status=${educationData[index]?.status || 'n/a'}
        placeholder="Description"
        autocomplete="off"
        inputmode="text"
        @input=${handleDescriptionInput}
      ></textarea>
      <small id=${descriptionCounterId} aria-live="polite">${descriptionCount}/${descriptionMaxLength}</small>
    </label>
  `
}

function renderEducationSection(educationData: EducationRow[], onAddRow: () => void) {
  const createNewRow = (event: Event) => {
    event.preventDefault()
    educationData.push({
      school: '',
      degree: '',
      location: '',
      startDate: undefined,
      endDate: undefined,
      description: '',
      entryNode: '',
      status: 'new'
    })
    onAddRow()
  }

  const visibleEducationRows = educationData
    .map((education, index) => ({ education, index }))
    .filter(({ education }) => education.status !== 'deleted')

  return html`
    <section 
      aria-labelledby="education-heading" 
      class="educationEditSection section-bg">
      <header class="sectionHeader">
        <h4 id="education-heading" tabindex="-1">
          <span class="sectionTitleIcon" aria-hidden="true">&#9993;</span>
          Education
        </h4>
        <button
          type="button"
          class="actionButton"
          aria-label="Add another education entry"
          @click=${createNewRow}
        >
          + Add More
        </button>
      </header>
      <fieldset>
        <legend class="sr-only">Education entries</legend>
        ${visibleEducationRows.map(({ index }, displayIndex) => renderEducationInputRow({
          educationData,
          index,
          displayIndex,
          onDelete: () => {
            deleteRow(educationData, index)
            onAddRow()
          },
          onChange: onAddRow
        }))}
      </fieldset>
    </section>
  `
}

function renderEducationEditTemplate(form: HTMLFormElement, formState: EducationFormState, rerender: () => void) {
  render(html`
    ${renderEducationSection(formState.educationData, rerender)}
  `, form)
}

function createEducationEditForm(educationData: EducationDetails[]) {
  const form = document.createElement('form')
  form.classList.add('section-edit-form')

  const formState = toFormState(educationData)
  const rerender = () => renderEducationEditTemplate(form, formState, rerender)
  rerender()

  return { form, formState, rerender }
}


export async function createEducationEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  educationData: EducationDetails[],
  viewerMode: ViewerMode
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState, rerender } = createEducationEditForm(educationData)

  const result = await openInputDialog({
    title: editEducationDialogTitleText,
    dom,
    form,
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: async () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }

      const plan: MutationOps<EducationRow> = summarizeRowOps(formState.educationData, rowHasContent)
      const hasChanges = plan.create.length > 0 || plan.update.length > 0 || plan.remove.length > 0
      if (!hasChanges) {
        return 'No education changes detected.'
      }

      const validation = validateEducationBeforeSave(formState.educationData)
      if (!validation.ok) {
        return validation.message || 'Please complete the required education fields.'
      }

      return null
    },
    onSave: async () => {
      const plan: MutationOps<EducationRow> = summarizeRowOps(formState.educationData, rowHasContent)
      await processEducationMutations(store, subject, plan)
      rerender()
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveEducationUpdatesFailedPrefixText} ${message}`
    }
  })

  if (!result) return
  await alertDialog('Education updates saved. Refresh to see latest values.', 'Saved', dom)
}
