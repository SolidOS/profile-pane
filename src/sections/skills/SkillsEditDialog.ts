import { getSharedDialogSaveButton, openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import 'solid-ui/components/actions/button'
import 'solid-ui/components/forms/combobox'
import { SkillDetails, SkillRow } from './types'
import '../../styles/EditDialogs.css'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { processSkillsMutations } from './mutations'
import { trashIcon } from '../../icons-svg/profileIcons'
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editSkillsDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveContactUpdatesFailedPrefixText,
} from '../../texts'

type SkillFormState = {
  skills: SkillRow[]
}

type SkillSuggestion = {
  label: string
  publicId: string
}

type SkillComboboxOption = {
  label: string
  value: string
  publicId?: string
}

type SkillComboboxElement = HTMLElement & {
  suggestionProvider?: (query: string) => Promise<SkillComboboxOption[]>
  options?: SkillComboboxOption[]
  value?: string
  inputValue?: string
  label?: string
  placeholder?: string
}

type SkillRerenderOptions = {
  focusSelector?: string
}

const ESCO_SKILL_SEARCH_URI = 'https://ec.europa.eu/esco/api/search?language=$(language)&limit=$(limit)&type=skill&text=$(name)&selectedVersion=v1.2.0'
const ESCO_SEARCH_LANGUAGE = 'en'
const ESCO_SEARCH_LIMIT = 8
const ESCO_SKILL_BASE_URI = 'http://data.europa.eu/esco/skill/'

function normalizeSkillPublicId(value: string): string {
  const normalized = sanitizeSkillFieldValue(value)
  if (!normalized) return ''
  if (normalized.startsWith('skill:')) return normalized
  if (normalized.startsWith(ESCO_SKILL_BASE_URI)) {
    const suffix = normalized.slice(ESCO_SKILL_BASE_URI.length)
    return suffix ? `skill:${suffix}` : normalized
  }
  return normalized
}

function buildEscoSkillSearchUrl(name: string): string {
  return ESCO_SKILL_SEARCH_URI
    .replace('$(language)', encodeURIComponent(ESCO_SEARCH_LANGUAGE))
    .replace('$(limit)', encodeURIComponent(String(ESCO_SEARCH_LIMIT)))
    .replace('$(name)', encodeURIComponent(name))
}

function toSkillLabel(result: any): string {
  return result?.title || result?.searchHit || result?.preferredLabel?.en || result?.uri || ''
}

async function fetchEscoSkillSuggestions(name: string): Promise<SkillSuggestion[]> {
  const query = sanitizeSkillFieldValue(name)
  if (query.length < 2 || typeof fetch !== 'function') return []

  try {
    const response = await fetch(buildEscoSkillSearchUrl(query), {
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) return []

    const payload = await response.json() as any
    const results = Array.isArray(payload?._embedded?.results) ? payload._embedded.results : []
    const seen = new Set<string>()

    return results
      .map((result: any) => {
        const label = sanitizeSkillFieldValue(toSkillLabel(result))
        const publicId = normalizeSkillPublicId(typeof result?.uri === 'string' ? result.uri : '')
        return { label, publicId }
      })
      .filter((suggestion: SkillSuggestion) => {
        if (!suggestion.label) return false
        const key = suggestion.label.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  } catch {
    return []
  }
}

type SkillEditableField = 'name'

function sanitizeSkillFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function rowHasContent(row: SkillRow): boolean {
  return [
    row.name
  ].some(hasNonEmptyText)
}

function toFormState(details: SkillDetails[]): SkillFormState {
  const rows = (details || [])
    .map((detail) => ({
      name: sanitizeSkillFieldValue(toText(detail.name)),
      publicId: normalizeSkillPublicId(toText(detail.publicId)),
      entryNode: toText(detail.entryNode),
      status: toText(detail.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((row) => Boolean(row.name || row.publicId || row.entryNode))

 
  return {
    skills: rows.length ? rows : [{ name: '', publicId: '', entryNode: '', status: 'new' }],
  }
}

function toSkillComboboxOption(suggestion: SkillSuggestion): SkillComboboxOption {
  return {
    label: suggestion.label,
    value: suggestion.publicId,
    publicId: suggestion.publicId
  }
}

function readSkillComboboxInputValue(event: Event): string {
  const customEvent = event as CustomEvent<{ value?: string }>
  if (typeof customEvent.detail?.value === 'string') {
    return customEvent.detail.value
  }

  const target = event.target as HTMLInputElement | null
  return typeof target?.value === 'string' ? target.value : ''
}

function readSkillComboboxChange(event: Event): SkillComboboxOption | null {
  const customEvent = event as CustomEvent<{
    value?: string
    label?: string
    option?: SkillComboboxOption
  }>

  if (customEvent.detail?.option) {
    return customEvent.detail.option
  }

  if (typeof customEvent.detail?.value === 'string') {
    return {
      label: typeof customEvent.detail?.label === 'string' ? customEvent.detail.label : '',
      value: customEvent.detail.value,
      publicId: customEvent.detail.value
    }
  }

  return null
}

function createSkillSuggestionProvider(): (query: string) => Promise<SkillComboboxOption[]> {
  return async (query: string) => {
    const suggestions = await fetchEscoSkillSuggestions(query)
    return suggestions.map(toSkillComboboxOption)
  }
}

function initializeSkillComboboxes(form: HTMLFormElement, rows: SkillRow[]): void {
  const comboboxElements = form.querySelectorAll('solid-ui-combobox[data-skill-row-index]') as NodeListOf<SkillComboboxElement>

  comboboxElements.forEach((comboboxElement) => {
    const rowIndex = Number(comboboxElement.dataset.skillRowIndex)
    if (Number.isNaN(rowIndex)) return

    const row = rows[rowIndex]
    const options = row?.publicId && row?.name
      ? [{ label: row.name, value: row.publicId, publicId: row.publicId }]
      : []

    comboboxElement.suggestionProvider = createSkillSuggestionProvider()
    comboboxElement.options = options
    comboboxElement.value = row?.publicId || ''
    comboboxElement.inputValue = row?.name || ''
    comboboxElement.label = ''
    comboboxElement.placeholder = 'Skill'
  })
}

function validateSkillsBeforeSave(rows: SkillRow[]): string | null {
  const ops = summarizeRowOps(rows, rowHasContent)
  const hasChanges = ops.create.length > 0 || ops.update.length > 0 || ops.remove.length > 0
  if (!hasChanges) return 'No skill changes detected.'

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.status === 'deleted') continue
    if (!hasNonEmptyText(row.name)) continue

    if (row.status !== 'existing' && !hasNonEmptyText(row.publicId)) {
      return `Skill ${i + 1}: please select a skill from the ESCO suggestions.`
    }
  }

  return null
}

function hasInvalidSkillSelection(rows: SkillRow[]): boolean {
  return rows.some((row) => {
    if (!row || row.status === 'deleted') return false
    if (!hasNonEmptyText(row.name)) return false
    return !hasNonEmptyText(row.publicId)
  })
}

function updateSkillsSubmitEnabled(rows: SkillRow[]): void {
  const submitButton = getSharedDialogSaveButton(document)
  if (!submitButton) return
  submitButton.disabled = hasInvalidSkillSelection(rows)
}

function focusSkillField(form: HTMLFormElement, selector: string): void {
  const nextField = form.querySelector(selector) as HTMLElement | null
  if (!nextField || typeof nextField.focus !== 'function') return

  nextField.scrollIntoView({ block: 'start', behavior: 'auto' })
  const comboboxInput = nextField.tagName === 'SOLID-UI-COMBOBOX'
    ? nextField.shadowRoot?.querySelector('input') as HTMLInputElement | null
    : null
  const focusTarget = comboboxInput || nextField
  focusTarget.focus()
  if (focusTarget instanceof HTMLInputElement || focusTarget instanceof HTMLTextAreaElement) {
    focusTarget.select()
  }
}

type SkillsInputRowProps = {
  rows: SkillRow[]
  index: number
  displayIndex: number
  onDelete: () => void
}

function renderSkillInputRow({
  rows,
  index,
  displayIndex,
  onDelete
}: SkillsInputRowProps) {
  const row = rows[index]
  const label = `Skill ${displayIndex + 1}`
  const hasSelectionIssue = Boolean(row && row.status !== 'deleted' && hasNonEmptyText(row.name) && !hasNonEmptyText(row.publicId))

  const handleSkillInput = (_field: SkillEditableField) => (e: Event) => {
    const nextValue = sanitizeSkillFieldValue(readSkillComboboxInputValue(e))
    if (rows[index]) {
      applyRowFieldChange(rows[index], 'name', nextValue, rowHasContent)
      rows[index].publicId = ''
      updateSkillsSubmitEnabled(rows)
    }
  }

  const handleSkillChange = (e: Event) => {
    const selectedOption = readSkillComboboxChange(e)
    if (!rows[index] || !selectedOption) return

    applyRowFieldChange(rows[index], 'name', sanitizeSkillFieldValue(selectedOption.label), rowHasContent)
    rows[index].publicId = selectedOption.publicId || selectedOption.value || ''
    updateSkillsSubmitEnabled(rows)
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--full profile-edit-dialog__row--skill">
      <label aria-label=${`${label} Name`} class="label profile-edit-dialog__field profile-edit-dialog__field--full">
        <solid-ui-combobox
          aria-label=${`${label} Name`}
          data-skill-row-index=${String(index)}
          aria-invalid=${hasSelectionIssue ? 'true' : 'false'}
          @input=${handleSkillInput('name')}
          @change=${handleSkillChange}
        ></solid-ui-combobox>
        <small class="profile-edit-dialog__input-help-text">Type to search ESCO and select one suggestion.</small>
      </label>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge flex-row align-center justify-end">
        <solid-ui-button
          type="button"
          variant="icon"
          size="md"
          label=${deleteEntryButtonTitleText}
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete skill ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span slot="icon" class="profile-edit-dialog__delete-icon inline-flex-row justify-center" aria-hidden="true">${trashIcon}</span>
        </solid-ui-button>
      </div>
    </div>
  `
}

function renderSkillsSection(
  rows: SkillRow[],
  onAddRow: (options?: SkillRerenderOptions) => void
) {
  const visibleRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.status !== 'deleted')

  return html`
    <section class="profile-edit-dialog__section flex-column gap-xs" aria-label="Skills">
      <fieldset>
        <legend class="sr-only">Skill entries</legend>
        ${visibleRows.map(({ index }, displayIndex) => renderSkillInputRow({
          rows,
          index,
          displayIndex,
          onDelete: () => {
            deleteRow(rows, index)
            onAddRow()
          }
        }))}
      </fieldset>
    </section>
  `
}

function renderSkillsEditTemplate(
  form: HTMLFormElement,
  formState: SkillFormState,
  viewerMode: ViewerMode,
  options: SkillRerenderOptions = {}
) {
  const rerender = (nextOptions: SkillRerenderOptions = {}) => renderSkillsEditTemplate(form, formState, viewerMode, nextOptions)

  render(html`
    ${renderSkillsSection(formState.skills, rerender)}
    ${viewerMode !== 'owner'
      ? html`<p class="profile-edit-dialog__login-message">${ownerLoginRequiredDialogMessageText}</p>`
      : null}
  `, form)

  initializeSkillComboboxes(form, formState.skills)
  updateSkillsSubmitEnabled(formState.skills)

  if (options.focusSelector) {
    focusSkillField(form, options.focusSelector)
  }
}

function createSkillsEditForm(details: SkillDetails[], viewerMode: ViewerMode) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')

  const formState = toFormState(details)
  renderSkillsEditTemplate(form, formState, viewerMode)

  const addRow = () => {
    formState.skills.unshift({
      name: '',
      publicId: '',
      entryNode: '',
      status: 'new'
    })
    renderSkillsEditTemplate(form, formState, viewerMode, { focusSelector: '[data-skill-row-index="0"]' })
  }

  return { form, formState, addRow }
}


export async function createSkillsEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  skills: SkillDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState, addRow } = createSkillsEditForm(skills, viewerMode)

  const result = await openInputDialog({
    title: editSkillsDialogTitleText,
    dom,
    form,
    headerAction: {
      type: 'button',
      label: '+ Add More',
      ariaLabel: 'Add another skill',
      onClick: addRow
    },
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }
      return validateSkillsBeforeSave(formState.skills)
    },
    onSave: async () => {
      const skillOps = summarizeRowOps(formState.skills, rowHasContent)
      const plan: MutationOps<SkillRow> = {
        create: skillOps.create,
        update: skillOps.update,
        remove: skillOps.remove
      }
      await processSkillsMutations(store, subject, plan)
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveContactUpdatesFailedPrefixText} ${message}`
    }
  })

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
