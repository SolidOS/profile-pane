import { alertDialog, openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import 'solid-ui/components/actions/button'
import 'solid-ui/components/forms/select'
import { EducationRow, EducationDetails } from './types'
import '../../styles/EditDialogs.css'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { processEducationMutations } from './mutations'
import { ViewerMode } from '../../types'
import { addIcon, trashIcon } from '../../icons-svg/profileIcons'
import { applyRowFieldChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editEducationDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveEducationUpdatesFailedPrefixText,
} from '../../texts'

type EducationFormState = {
  educationData: EducationRow[]
}

type EducationValidationResult = {
  ok: boolean
  message?: string
}

type EducationSelectOption = {
  label: string
  value: string
}

type EducationDateSelectKind = 'start-month' | 'start-year' | 'end-month' | 'end-year'

type EducationSelectElement = HTMLElement & {
  options?: EducationSelectOption[]
  value?: string
  label?: string
}

const EDUCATION_MONTH_OPTIONS: EducationSelectOption[] = [
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

function sanitizeEducationFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function readEducationSelectChange(event: Event): string {
  const customEvent = event as CustomEvent<{ value?: string }>
  if (typeof customEvent.detail?.value === 'string') {
    return customEvent.detail.value
  }

  const target = event.target as HTMLSelectElement | HTMLInputElement | null
  return typeof target?.value === 'string' ? target.value : ''
}

function getEducationYearOptions(selectedYears: string[]): EducationSelectOption[] {
  const currentYear = new Date().getFullYear()
  const baseYearOptions = Array.from({ length: 120 }, (_, i) => String(currentYear - i))
  const yearOptions = Array.from(new Set([
    ...baseYearOptions,
    ...selectedYears
  ].filter(Boolean))).sort((a, b) => Number(b) - Number(a))

  return yearOptions.map((year) => ({ label: year, value: year }))
}

function getEducationDateSelectOptions(kind: EducationDateSelectKind, selectedYears: string[]): EducationSelectOption[] {
  if (kind === 'start-month' || kind === 'end-month') {
    return EDUCATION_MONTH_OPTIONS
  }

  return getEducationYearOptions(selectedYears)
}

function getEducationDateSelectValue(kind: EducationDateSelectKind, row: EducationRow): string {
  const startDateParts = parseYearMonthFromDateText(toText(row?.startDate))
  const endDateParts = parseYearMonthFromDateText(toText(row?.endDate))

  switch (kind) {
    case 'start-month':
      return startDateParts.month
    case 'start-year':
      return startDateParts.year
    case 'end-month':
      return endDateParts.month
    case 'end-year':
      return endDateParts.year
    default:
      return ''
  }
}

function getEducationDateSelectLabel(kind: EducationDateSelectKind): string {
  return kind === 'start-month' || kind === 'end-month' ? 'Select Month' : 'Select Year'
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

function initializeEducationDateSelects(form: HTMLFormElement, educationData: EducationRow[]): void {
  const selectElements = form.querySelectorAll('solid-ui-select[data-education-date-kind]') as NodeListOf<EducationSelectElement>

  selectElements.forEach((selectElement) => {
    const kind = selectElement.dataset.educationDateKind as EducationDateSelectKind | undefined
    const rowIndex = Number(selectElement.dataset.educationRowIndex)
    if (!kind || Number.isNaN(rowIndex)) return

    const educationRow = educationData[rowIndex]
    if (!educationRow) return

    const startDateParts = parseYearMonthFromDateText(toText(educationRow.startDate))
    const endDateParts = parseYearMonthFromDateText(toText(educationRow.endDate))
    const selectedYears = [startDateParts.year, endDateParts.year]

    selectElement.options = getEducationDateSelectOptions(kind, selectedYears)
    selectElement.value = getEducationDateSelectValue(kind, educationRow)
    selectElement.label = getEducationDateSelectLabel(kind)
  })
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
  const selectedYears = [startYearText, endYearParsedText]
  
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
    const month = readEducationSelectChange(event)
    const year = parseYearMonthFromDateText(toText(educationData[index]?.startDate)).year || String(currentYear)
    const nextStartDate = buildDateLiteral(month, year)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleStartYearChange = (event: Event) => {
    const year = readEducationSelectChange(event)
    const month = parseYearMonthFromDateText(toText(educationData[index]?.startDate)).month || '01'
    const nextStartDate = buildDateLiteral(month, year)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleEndMonthChange = (event: Event) => {
    const month = readEducationSelectChange(event)
    const year = parseYearMonthFromDateText(toText(educationData[index]?.endDate)).year || String(currentYear)
    const nextEndDate = buildDateLiteral(month, year)
    if (educationData[index]) {
      applyRowFieldChange(educationData[index], 'endDate', nextEndDate, rowHasContent)
      onChange()
    }
  }

  const handleEndYearChange = (event: Event) => {
    const year = readEducationSelectChange(event)
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
    <div class="profile-edit-dialog__row" role="group" aria-labelledby=${educationHeadingId}>
      <h4 id=${educationHeadingId} class="profile-edit-dialog__entry-heading">${label}</h4>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge flex-row align-center justify-end">
        <solid-ui-button
          type="button"
          variant="icon"
          size="md"
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete education ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span slot="icon" class="profile-edit-dialog__delete-icon" aria-hidden="true">${trashIcon}</span>
        </solid-ui-button>
      </div>
    </div>
    <label aria-label=${`${label} School/College`} class="label profile-edit-dialog__field">
      School/College
      <input
        class="input"
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
    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Degree`} class="label profile-edit-dialog__field">
        Degree
        <input
          class="input"
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
    <div class="profile-edit-dialog__row">
      <label aria-label=${startMonthLabel} class="label profile-edit-dialog__field-type">
        Start Month
        <solid-ui-select
          class="profile-edit-dialog__education-date-select"
          name=${startMonthInputName}
          id=${startMonthSelectId}
          data-education-date-kind="start-month"
          data-education-row-index=${String(index)}
          .options=${getEducationDateSelectOptions('start-month', selectedYears)}
          .value=${startMonthValue}
          .label=${getEducationDateSelectLabel('start-month')}
          @change=${handleStartMonthChange}
        ></solid-ui-select>
      </label>
      <label aria-label=${startYearLabel} class="label profile-edit-dialog__field-type">
        Start Year
        <solid-ui-select
          class="profile-edit-dialog__education-date-select"
          name=${startYearInputName}
          id=${startYearSelectId}
          data-education-date-kind="start-year"
          data-education-row-index=${String(index)}
          .options=${getEducationDateSelectOptions('start-year', selectedYears)}
          .value=${startYearText}
          .label=${getEducationDateSelectLabel('start-year')}
          @change=${handleStartYearChange}
        ></solid-ui-select>
      </label>
      <label aria-label=${endMonthLabel} class="label profile-edit-dialog__field-type">
        End Month
        <solid-ui-select
          class="profile-edit-dialog__education-date-select"
          name=${endMonthInputName}
          id=${endMonthSelectId}
          data-education-date-kind="end-month"
          data-education-row-index=${String(index)}
          .options=${getEducationDateSelectOptions('end-month', selectedYears)}
          .value=${endMonthValue}
          .label=${getEducationDateSelectLabel('end-month')}
          @change=${handleEndMonthChange}
        ></solid-ui-select>
      </label>
      <label aria-label=${endYearLabel} class="label profile-edit-dialog__field-type">
        End Year
        <solid-ui-select
          class="profile-edit-dialog__education-date-select"
          name=${endYearInputName}
          id=${endYearSelectId}
          data-education-date-kind="end-year"
          data-education-row-index=${String(index)}
          .options=${getEducationDateSelectOptions('end-year', selectedYears)}
          .value=${endYearParsedText}
          .label=${getEducationDateSelectLabel('end-year')}
          @change=${handleEndYearChange}
        ></solid-ui-select>
      </label>
    </div>
    <label aria-label=${`${label} Description`} class="label profile-edit-dialog__field profile-edit-dialog__field--full profile-edit-dialog__field--stack">
      <span>Description</span>
      <textarea
        class="profile-edit-dialog__textarea"
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
      class="profile-edit-dialog__section--education section-bg">
      <header class="profile__section-header">
        <h3 id="education-heading" class="profile-edit-dialog__section-heading">
          <span class="profile-edit-dialog__section-title-icon" aria-hidden="true">&#9993;</span>
          Education
        </h3>
        <solid-ui-button
          type="button"
          variant="secondary"
          size="sm"
          class="profile__action-button profile-action-text flex-center"
          data-dialog-add-more="true"
          aria-label="Add another education entry"
          @click=${createNewRow}
        >
          <span class="profile__add-more-content">
            <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
            <span>Add More</span>
          </span>
        </solid-ui-button>
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

function renderEducationEditTemplate(
  form: HTMLFormElement,
  formState: EducationFormState,
  rerender: () => void,
  viewerMode: ViewerMode
) {
  render(html`
    ${renderEducationSection(formState.educationData, rerender)}
    ${viewerMode !== 'owner'
      ? html`<p class="profile-edit-dialog__login-message">${ownerLoginRequiredDialogMessageText}</p>`
      : null}
  `, form)

  initializeEducationDateSelects(form, formState.educationData)
}

function createEducationEditForm(educationData: EducationDetails[], viewerMode: ViewerMode) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')

  const formState = toFormState(educationData)
  const rerender = () => renderEducationEditTemplate(form, formState, rerender, viewerMode)
  rerender()

  return { form, formState, rerender }
}


export async function createEducationEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  educationData: EducationDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState, rerender } = createEducationEditForm(educationData, viewerMode)
  const triggerAddMore = () => {
    const addMoreButton = form.querySelector('[data-dialog-add-more="true"]') as HTMLButtonElement | null
    if (addMoreButton) addMoreButton.click()
  }

  const result = await openInputDialog({
    title: editEducationDialogTitleText,
    dom,
    form,
    headerAction: {
      type: 'button',
      label: 'Add More',
      ariaLabel: 'Add another education entry',
      onClick: triggerAddMore
    },
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
  if (onSaved) {
    await onSaved()
    return
  }
  await alertDialog('Education updates saved. Refresh to see latest values.', 'Saved', dom)
}
