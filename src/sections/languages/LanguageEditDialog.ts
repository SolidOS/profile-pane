import { getSharedDialogSaveButton, openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import 'solid-ui/components/actions/button'
import 'solid-ui/components/forms/combobox'
import { LanguageDetails, LanguageRow } from './types'
import '../../styles/EditDialogs.css'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, applyRowSelectChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { processLanguageMutations } from './mutations'
import { bentoIcon, trashIcon } from '../../icons-svg/profileIcons'
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editLanguagesDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveLanguageUpdatesFailedPrefixText,
} from '../../texts'

type LanguageFormState = {
  languages: LanguageRow[]
  initialExistingOrder: string[]
}

type LanguageSuggestion = {
  name: string
  publicId: string
  code: string
}

type LanguageComboboxOption = {
  label: string
  value: string
  publicId?: string
  meta?: Record<string, unknown>
}

type LanguageComboboxElement = HTMLElement & {
  suggestionProvider?: (query: string) => Promise<LanguageComboboxOption[]>
  options?: LanguageComboboxOption[]
  value?: string
  inputValue?: string
  label?: string
  placeholder?: string
}

const WIKIDATA_LANGUAGE_ENDPOINT = 'https://query.wikidata.org/sparql'
const LANGUAGE_OBJECT_URI_BASE = 'https://www.w3.org/ns/iana/language-code/'

type LanguageEditableField = 'name' | 'proficiency'

type LanguageRerenderOptions = {
  focusSelector?: string
}

function sanitizeLanguageFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function rowHasContent(row: LanguageRow): boolean {
  return [
    row.name,
    row.publicId,
    row.proficiency
  ].some(hasNonEmptyText)
}

function normalizeLanguageCode(value: string): string {
  return (value || '').trim().toLowerCase()
}

function escapeSparqlRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildLanguageSearchQuery(name: string): string {
  const escapedName = escapeSparqlRegex(name)
  return `SELECT ?item ?subject ?name WHERE {
    ?item wdt:P305 ?subject .
    OPTIONAL {
      ?item rdfs:label ?name .
      FILTER(langMatches(lang(?name), "en"))
    }
    FILTER regex(?name, "${escapedName}", "i")
    FILTER regex(?subject, "^..$", "i")
  } LIMIT 12`
}

function buildLanguagePublicId(subjectValue: string): string {
  const value = (subjectValue || '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `${LANGUAGE_OBJECT_URI_BASE}${normalizeLanguageCode(value)}`
}

function preferredBindingValue(binding: any, key: string): string {
  const value = binding?.[key]?.value
  return typeof value === 'string' ? value : ''
}

async function fetchLanguageSuggestions(term: string): Promise<LanguageSuggestion[]> {
  const queryTerm = sanitizeLanguageFieldValue(term)
  if (queryTerm.length < 2 || typeof fetch !== 'function') return []

  const params = new URLSearchParams({
    query: buildLanguageSearchQuery(queryTerm),
    format: 'json'
  })

  try {
    const response = await fetch(`${WIKIDATA_LANGUAGE_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: 'application/sparql-results+json, application/json' }
    })
    if (!response.ok) return []

    const payload = await response.json() as any
    const bindings = Array.isArray(payload?.results?.bindings) ? payload.results.bindings : []
    const seen = new Set<string>()

    return bindings
      .map((binding: any) => {
        const code = normalizeLanguageCode(preferredBindingValue(binding, 'subject'))
        const publicId = buildLanguagePublicId(code)
        const name = sanitizeLanguageFieldValue(preferredBindingValue(binding, 'name') || code)
        return { name, publicId, code }
      })
      .filter((item: LanguageSuggestion) => {
        if (!item.name || !item.publicId || item.code.length !== 2) return false
        const key = item.publicId.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  } catch {
    return []
  }
}

function toLanguageComboboxOption(suggestion: LanguageSuggestion): LanguageComboboxOption {
  return {
    label: suggestion.name,
    value: suggestion.publicId,
    publicId: suggestion.publicId,
    meta: { code: suggestion.code }
  }
}

function readLanguageComboboxInputValue(event: Event): string {
  const customEvent = event as CustomEvent<{ value?: string }>
  if (typeof customEvent.detail?.value === 'string') {
    return customEvent.detail.value
  }

  const target = event.target as HTMLInputElement | null
  return typeof target?.value === 'string' ? target.value : ''
}

function readLanguageComboboxChange(event: Event): LanguageComboboxOption | null {
  const customEvent = event as CustomEvent<{
    value?: string
    label?: string
    option?: LanguageComboboxOption
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

function createLanguageSuggestionProvider(): (query: string) => Promise<LanguageComboboxOption[]> {
  return async (query: string) => {
    const suggestions = await fetchLanguageSuggestions(query)
    return suggestions.map(toLanguageComboboxOption)
  }
}

function initializeLanguageComboboxes(form: HTMLFormElement, rows: LanguageRow[]): void {
  const comboboxElements = form.querySelectorAll('solid-ui-combobox[data-language-row-index]') as NodeListOf<LanguageComboboxElement>

  comboboxElements.forEach((comboboxElement) => {
    const rowIndex = Number(comboboxElement.dataset.languageRowIndex)
    if (Number.isNaN(rowIndex)) return

    const row = rows[rowIndex]
    const options = row?.publicId && row?.name
      ? [{ label: row.name, value: row.publicId, publicId: row.publicId }]
      : []

    comboboxElement.suggestionProvider = createLanguageSuggestionProvider()
    comboboxElement.options = options
    comboboxElement.value = row?.publicId || ''
    comboboxElement.inputValue = row?.name || ''
    comboboxElement.label = ''
    comboboxElement.placeholder = 'Language'
  })
}

function toFormState(details: LanguageDetails[]): LanguageFormState {
  const rows = (details || [])
    .map((detail) => ({
      name: sanitizeLanguageFieldValue(toText(detail.name)),
      publicId: sanitizeLanguageFieldValue(toText(detail.publicId)),
      proficiency: sanitizeLanguageFieldValue(toText(detail.proficiency)),
      entryNode: toText(detail.entryNode),
      status: toText(detail.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((row) => Boolean(row.name || row.entryNode || row.proficiency || row.publicId))

 
  return {
    languages: rows.length ? rows : [{ name: '', publicId: '', proficiency: '', entryNode: '', status: 'new' }],
    initialExistingOrder: [],
  }
}

function hasOrderChanged(rows: LanguageRow[], initialExistingOrder: string[]): boolean {
  const currentExistingOrder = rows
    .filter((row) => row.status !== 'deleted' && Boolean((row.entryNode || '').trim()))
    .map((row) => (row.entryNode || '').trim())

  if (currentExistingOrder.length !== initialExistingOrder.length) return true

  for (let i = 0; i < currentExistingOrder.length; i++) {
    if (currentExistingOrder[i] !== initialExistingOrder[i]) return true
  }

  return false
}

function validateLanguagesBeforeSave(rows: LanguageRow[], initialExistingOrder: string[]): string | null {
  const ops = summarizeRowOps(rows, rowHasContent)
  const hasChanges = ops.create.length > 0 || ops.update.length > 0 || ops.remove.length > 0
  const orderChanged = hasOrderChanged(rows, initialExistingOrder)
  if (!hasChanges && !orderChanged) return 'No language changes detected.'

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.status === 'deleted') continue
    if (!hasNonEmptyText(row.name)) continue
    if (!hasNonEmptyText(row.publicId)) {
      return `Language ${i + 1}: please choose a language from the suggestions list.`
    }
  }

  return null
}

function hasInvalidLanguageSelection(rows: LanguageRow[]): boolean {
  return rows.some((row) => {
    if (!row || row.status === 'deleted') return false
    if (!hasNonEmptyText(row.name)) return false
    return !hasNonEmptyText(row.publicId)
  })
}

function updateLanguagesSubmitEnabled(rows: LanguageRow[]): void {
  const submitButton = getSharedDialogSaveButton(document)
  if (!submitButton) return
  submitButton.disabled = hasInvalidLanguageSelection(rows)
}

function focusLanguageField(form: HTMLFormElement, selector: string): void {
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

type ContactLanguageInputRowProps = {
  rows: LanguageRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onDragStart: (index: number) => void
  onDragOver: (event: DragEvent) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
  isDropTarget: boolean
}

function renderLanguageInputRow({
  rows,
  index,
  displayIndex,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDropTarget
}: ContactLanguageInputRowProps) {
  const row = rows[index]
  const label = `Language ${displayIndex + 1}`
  const proficiencyLabel = `Language Proficiency ${displayIndex + 1}`
  const proficiencyInputName = `proficiency-${index}`
  const proficiencySelectId = `proficiency-${index}`
  const hasSelectionIssue = Boolean(row && row.status !== 'deleted' && hasNonEmptyText(row.name) && !hasNonEmptyText(row.publicId))

  const handleLanguageInput = (field: LanguageEditableField) => (e: Event) => {
    const nextValue = sanitizeLanguageFieldValue(readLanguageComboboxInputValue(e))
    if (rows[index]) {
      applyRowFieldChange(rows[index], field, nextValue, rowHasContent)
      rows[index].publicId = ''
      updateLanguagesSubmitEnabled(rows)
    }
  }

  const handleLanguageChange = (field: LanguageEditableField) => (e: Event) => {
    const selectedOption = readLanguageComboboxChange(e)
    if (!rows[index] || !selectedOption) return

    applyRowFieldChange(rows[index], field, sanitizeLanguageFieldValue(selectedOption.label), rowHasContent)
    rows[index].publicId = selectedOption.publicId || selectedOption.value || ''
    updateLanguagesSubmitEnabled(rows)
  }

  const handleProficiencyInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextType = target.value
    if (rows[index]) {
      applyRowSelectChange(rows[index], 'proficiency', nextType)
      updateLanguagesSubmitEnabled(rows)
    }
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  return html`
    <div
      class="profile-edit-dialog__row profile-edit-dialog__row--language ${isDropTarget ? 'profile-edit-dialog__row--drop-target' : ''}"
      @dragover=${(event: DragEvent) => onDragOver(event)}
      @drop=${() => onDrop(index)}
    >
      <solid-ui-button
        type="button"
        class="profile-edit-dialog__drag-handle"
        variant="icon"
        size="md"
        label=${`Reorder language ${displayIndex + 1}`}
        aria-label=${`Reorder language ${displayIndex + 1}`}
        title="Drag to reorder"
        draggable="true"
        @dragstart=${() => onDragStart(index)}
        @dragend=${() => onDragEnd()}
      >
        <span slot="icon" aria-hidden="true">${bentoIcon}</span>
      </solid-ui-button>
      <label aria-label=${`${label} Language`} class="label profile-edit-dialog__field">
        <solid-ui-combobox
          aria-label=${`${label} Language`}
          data-language-row-index=${String(index)}
          aria-invalid=${hasSelectionIssue ? 'true' : 'false'}
          @input=${handleLanguageInput('name')}
          @change=${handleLanguageChange('name')}
        ></solid-ui-combobox>
        <small class="profile-edit-dialog__input-help-text">Type to search and select one language suggestion.</small>
      </label>
      <label aria-label=${proficiencyLabel} class="label" hidden>
        <select name=${proficiencyInputName} id=${proficiencySelectId} @change=${handleProficiencyInput} .value=${row?.proficiency || ''}>
          <option value="Basic">Basic</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Fluent">Fluent</option>
        </select>
      </label>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge flex-row align-center justify-end">
        <solid-ui-button
          type="button"
          variant="icon"
          size="md"
          label=${deleteEntryButtonTitleText}
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete language ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span slot="icon" class="profile-edit-dialog__delete-icon inline-flex-row justify-center" aria-hidden="true">${trashIcon}</span>
        </solid-ui-button>
      </div>
    </div>
  `
}

function renderLanguageSection(
  rows: LanguageRow[],
  onAddRow: (options?: LanguageRerenderOptions) => void
) {
  let dragSourceIndex: number | null = null
  let dropTargetIndex: number | null = null

  const reorderRows = (from: number, to: number) => {
    if (from === to) return
    const row = rows[from]
    if (!row) return
    rows.splice(from, 1)
    rows.splice(to, 0, row)
  }

  const handleDragStart = (index: number) => {
    dragSourceIndex = index
    dropTargetIndex = index
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDrop = (index: number) => {
    if (dragSourceIndex === null) return
    reorderRows(dragSourceIndex, index)
    dragSourceIndex = null
    dropTargetIndex = null
    onAddRow()
  }

  const handleDragEnd = () => {
    dragSourceIndex = null
    dropTargetIndex = null
  }

  const visibleRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.status !== 'deleted')

  return html`
    <section class="profile-edit-dialog__section flex-column gap-xs" aria-label="Languages">
      <fieldset>
        <legend class="sr-only">Language entries</legend>
        ${visibleRows.map(({ index }, displayIndex) => renderLanguageInputRow({
          rows,
          index,
          displayIndex,
          onDragStart: handleDragStart,
          onDragOver: handleDragOver,
          onDrop: handleDrop,
          onDragEnd: handleDragEnd,
          isDropTarget: dropTargetIndex === index,
          onDelete: () => {
            deleteRow(rows, index)
            onAddRow()
          }
        }))}
      </fieldset>
    </section>
  `
}

function renderLanguageEditTemplate(
  form: HTMLFormElement,
  formState: LanguageFormState,
  viewerMode: ViewerMode,
  options: LanguageRerenderOptions = {}
) {
  const rerender = (nextOptions: LanguageRerenderOptions = {}) => renderLanguageEditTemplate(form, formState, viewerMode, nextOptions)

  render(html`
    ${renderLanguageSection(formState.languages, rerender)}
    ${viewerMode !== 'owner'
      ? html`<p class="profile-edit-dialog__login-message">${ownerLoginRequiredDialogMessageText}</p>`
      : null}
  `, form)

  initializeLanguageComboboxes(form, formState.languages)
  updateLanguagesSubmitEnabled(formState.languages)

  if (options.focusSelector) {
    focusLanguageField(form, options.focusSelector)
  }
}

function createLanguageEditForm(details: LanguageDetails[], viewerMode: ViewerMode) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')

  const formState = toFormState(details)
  formState.initialExistingOrder = formState.languages
    .filter((row) => Boolean((row.entryNode || '').trim()))
    .map((row) => (row.entryNode || '').trim())
  renderLanguageEditTemplate(form, formState, viewerMode)

  const addRow = () => {
    formState.languages.unshift({
      name: '',
      publicId: '',
      proficiency: '',
      entryNode: '',
      status: 'new'
    })
    renderLanguageEditTemplate(form, formState, viewerMode, { focusSelector: '[data-language-row-index="0"]' })
  }

  return { form, formState, addRow }
}


export async function createLanguageEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  languages: LanguageDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState, addRow } = createLanguageEditForm(languages, viewerMode)

  const result = await openInputDialog({
    title: editLanguagesDialogTitleText,
    dom,
    form,
    headerAction: {
      type: 'button',
      label: '+ Add More',
      ariaLabel: 'Add another language',
      onClick: addRow
    },
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }
      return validateLanguagesBeforeSave(formState.languages, formState.initialExistingOrder)
    },
    onSave: async () => {
      const languageOps = summarizeRowOps(formState.languages, rowHasContent)
      const plan: MutationOps<LanguageRow> = {
        create: languageOps.create,
        update: languageOps.update,
        remove: languageOps.remove
      }
      await processLanguageMutations(store, subject, plan, formState.languages)
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveLanguageUpdatesFailedPrefixText} ${message}`
    }
  })

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
