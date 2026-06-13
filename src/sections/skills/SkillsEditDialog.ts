import { getSharedDialogSaveButton, openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import 'solid-ui/components/button'
<<<<<<< HEAD
import 'solid-ui/components/combobox'
=======
import 'solid-ui/components/forms/combobox'
>>>>>>> 92e88a4 (#401 skills)
import { SkillDetails, SkillRow } from './types'
import '../../styles/EditDialogs.css'
import '../contactInfo/ContactInfoEditDialog.css'
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
  saveSkillsUpdatesFailedMessageText,
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
  if (normalized.startsWith('_:')) return normalized
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
    const nextInputValue = row?.name || ''
    const options = row?.publicId && row?.name
      ? [{ label: row.name, value: row.publicId, publicId: row.publicId }]
      : []

    comboboxElement.suggestionProvider = createSkillSuggestionProvider()
    comboboxElement.options = options
    comboboxElement.value = row?.publicId || ''
    comboboxElement.inputValue = nextInputValue
    comboboxElement.label = ''
    comboboxElement.placeholder = 'Skill'

    const comboboxInput = comboboxElement.shadowRoot?.querySelector('input') as HTMLInputElement | null
    if (comboboxInput) {
      comboboxInput.value = nextInputValue
    }
  })
}

function syncSkillRowsFromComboboxes(form: HTMLFormElement, rows: SkillRow[]): void {
  const comboboxElements = form.querySelectorAll('solid-ui-combobox[data-skill-row-index]') as NodeListOf<SkillComboboxElement>

  comboboxElements.forEach((comboboxElement) => {
    const rowIndex = Number(comboboxElement.dataset.skillRowIndex)
    if (Number.isNaN(rowIndex) || !rows[rowIndex]) return

    const comboboxInput = comboboxElement.shadowRoot?.querySelector('input') as HTMLInputElement | null
    const nextName = sanitizeSkillFieldValue(comboboxInput?.value || comboboxElement.inputValue || '')
    const nextPublicId = normalizeSkillPublicId(comboboxElement.value || '')

    applyRowFieldChange(rows[rowIndex], 'name', nextName, rowHasContent)
    rows[rowIndex].publicId = nextPublicId
  })
}

function validateSkillsBeforeSave(_rows: SkillRow[]): string | null {
  return null
}

function hasInvalidSkillSelection(_rows: SkillRow[]): boolean {
  return false
}

function updateSkillsSubmitEnabled(rows: SkillRow[]): void {
  const submitButton = getSharedDialogSaveButton(document)
  if (!submitButton) return
  submitButton.disabled = hasInvalidSkillSelection(rows)
}

function focusSkillField(form: HTMLFormElement, selector: string): void {
  const nextField = form.querySelector(selector) as HTMLElement | null
  if (!nextField || typeof nextField.focus !== 'function') return

  if (typeof nextField.scrollIntoView === 'function') {
    nextField.scrollIntoView({ block: 'start', behavior: 'auto' })
  }
  const comboboxHost = nextField.tagName === 'SOLID-UI-COMBOBOX'
    ? (nextField as HTMLElement & { _closePopup?: () => void })
    : null
  const comboboxInput = comboboxHost
    ? comboboxHost.shadowRoot?.querySelector('input') as HTMLInputElement | null
    : null
  const focusTarget = comboboxInput || nextField
  focusTarget.focus()
  if (focusTarget instanceof HTMLInputElement) {
    const caretPosition = 0
    focusTarget.setSelectionRange(caretPosition, caretPosition)
    focusTarget.scrollLeft = 0
    requestAnimationFrame(() => {
      focusTarget.scrollLeft = 0
    })
  }

  if (comboboxHost?._closePopup) {
    requestAnimationFrame(() => {
      comboboxHost._closePopup?.()
    })
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
  const label = `Skill ${displayIndex + 1}`

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
    if (!rows[index] || !selectedOption?.publicId) return

    applyRowFieldChange(rows[index], 'name', sanitizeSkillFieldValue(selectedOption.label), rowHasContent)
    rows[index].publicId = selectedOption.publicId
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
          @input=${handleSkillInput('name')}
          @change=${handleSkillChange}
        ></solid-ui-combobox>
        <small class="profile-edit-dialog__input-help-text">Type to search ESCO, or enter your own skill.</small>
      </label>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge">
        <solid-ui-button
          variant="ghost"
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete skill ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span slot="icon" class="profile-edit-dialog__delete-icon" aria-hidden="true">${trashIcon}</span>
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
    <section class="profile-edit-dialog__section" aria-label="Skills">
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
  const rerender = (nextOptions: SkillRerenderOptions = {}) => {
    syncSkillRowsFromComboboxes(form, formState.skills)
    renderSkillsEditTemplate(form, formState, viewerMode, nextOptions)
  }

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
    syncSkillRowsFromComboboxes(form, formState.skills)
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
    onOpen: () => focusSkillField(form, '[data-skill-row-index="0"]'),
    shouldCloseWithoutSave: () => {
      syncSkillRowsFromComboboxes(form, formState.skills)
      const ops = summarizeRowOps(formState.skills, rowHasContent)
      return ops.create.length === 0 && ops.update.length === 0 && ops.remove.length === 0
    },
    headerAction: {
      type: 'button',
      label: '+ Add More',
      ariaLabel: 'Add another skill',
      onClick: addRow
    },
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      syncSkillRowsFromComboboxes(form, formState.skills)
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }
      return validateSkillsBeforeSave(formState.skills)
    },
    onSave: async () => {
      syncSkillRowsFromComboboxes(form, formState.skills)
      const skillOps = summarizeRowOps(formState.skills, rowHasContent)
      const plan: MutationOps<SkillRow> = {
        create: skillOps.create,
        update: skillOps.update,
        remove: skillOps.remove
      }
      await processSkillsMutations(store, subject, plan)
    },
    formatSaveError: (error: unknown) => {
      return error instanceof Error ? error.message : saveSkillsUpdatesFailedMessageText
    }
  })

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
