import { openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
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

const WIKIDATA_LANGUAGE_ENDPOINT = 'https://query.wikidata.org/sparql'
const LANGUAGE_OBJECT_URI_BASE = 'https://www.w3.org/ns/iana/language-code/'

type LanguageEditableField = 'name' | 'proficiency'

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

function normalizeSuggestionKey(value: string): string {
  return sanitizeLanguageFieldValue(value)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

function matchLanguageSuggestion(suggestions: LanguageSuggestion[], value: string): LanguageSuggestion | null {
  const normalized = sanitizeLanguageFieldValue(value).toLowerCase()
  if (!normalized) return null

  const exact = suggestions.find((suggestion) => suggestion.name.toLowerCase() === normalized)
  if (exact) return exact

  const normalizedKey = normalizeSuggestionKey(value)
  if (!normalizedKey) return null

  return suggestions.find((suggestion) => normalizeSuggestionKey(suggestion.name) === normalizedKey) || null
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
  const submitButton = document.querySelector('#profile-modal #modal-buttons button.btn-primary') as HTMLButtonElement | null
  if (!submitButton) return
  submitButton.disabled = hasInvalidLanguageSelection(rows)
}

type ContactLanguageInputRowProps = {
  rows: LanguageRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
  onSearch: (index: number, term: string) => void
  suggestions: LanguageSuggestion[]
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
  onChange,
  onSearch,
  suggestions,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDropTarget
}: ContactLanguageInputRowProps) {
  const row = rows[index]
  const label = `Language ${displayIndex + 1}`
  const proficiencyLabel = `Language Proficiency ${displayIndex + 1}`
  const languageName = `language-${index}`
  const proficiencyInputName = `proficiency-${index}`
  const proficiencySelectId = `proficiency-${index}`
  const datalistId = `language-suggestions-${index}`
  const hasSelectionIssue = Boolean(row && row.status !== 'deleted' && hasNonEmptyText(row.name) && !hasNonEmptyText(row.publicId))

  const handleLanguageInput = (field: LanguageEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeLanguageFieldValue(target.value)
    if (rows[index]) {
      applyRowFieldChange(rows[index], field, nextValue, rowHasContent)
      const matchedSuggestion = matchLanguageSuggestion(suggestions, nextValue)
      rows[index].publicId = matchedSuggestion?.publicId || ''
      if (matchedSuggestion) {
        rows[index].name = sanitizeLanguageFieldValue(matchedSuggestion.name)
      }
      onSearch(index, nextValue)
      onChange()
    }
  }

  const handleLanguageChange = (field: LanguageEditableField) => (e: Event) => {
    handleLanguageInput(field)(e)
  }

  const handleProficiencyInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextType = target.value
    if (rows[index]) {
      applyRowSelectChange(rows[index], 'proficiency', nextType)
      onChange()
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
      <button
        type="button"
        class="profile-edit-dialog__drag-handle"
        aria-label=${`Reorder language ${displayIndex + 1}`}
        title="Drag to reorder"
        draggable="true"
        @dragstart=${() => onDragStart(index)}
        @dragend=${() => onDragEnd()}
      >
        ${bentoIcon}
      </button>
      <label aria-label=${`${label} Language`} class="label profile-edit-dialog__field">
        <input
          class="input"
          type="text"
          name=${languageName}
          .value=${row?.name || ''}
          required
          data-contact-field="name"
          data-entry-node=${row?.entryNode || ''}
          data-row-status=${row?.status || 'n/a'}
          placeholder="Language"
          autocomplete="off"
          list=${datalistId}
          inputmode="text"
          aria-invalid=${hasSelectionIssue ? 'true' : 'false'}
          @input=${handleLanguageInput('name')}
          @change=${handleLanguageChange('name')}
        />
        <datalist id=${datalistId}>
          ${suggestions.map((suggestion) => html`<option value=${suggestion.name}></option>`)}
        </datalist>
        <small class="inputHelpText">Type to search and select one language suggestion.</small>
      </label>
      <label aria-label=${proficiencyLabel} class="label" hidden>
        <select name=${proficiencyInputName} id=${proficiencySelectId} @change=${handleProficiencyInput} .value=${row?.proficiency || ''}>
          <option value="Basic">Basic</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Fluent">Fluent</option>
        </select>
      </label>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge">
        <button
          type="button"
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete language ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span class="profile-edit-dialog__delete-icon" aria-hidden="true">${trashIcon}</span>
        </button>
      </div>
    </div>
  `
}

function renderLanguageSection(
  rows: LanguageRow[],
  onAddRow: () => void,
  suggestionByIndex: Record<number, LanguageSuggestion[]>,
  onSearch: (index: number, term: string) => void
) {
  let dragSourceIndex: number | null = null
  let dropTargetIndex: number | null = null

  const reorderRows = (from: number, to: number) => {
    if (from === to) return
    const row = rows[from]
    if (!row) return
    rows.splice(from, 1)
    rows.splice(to, 0, row)

    Object.keys(suggestionByIndex).forEach((key) => {
      delete suggestionByIndex[Number(key)]
    })
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
    <section class="contactsEditSection section-bg" aria-label="Languages">
      <fieldset>
        <legend class="sr-only">Language entries</legend>
        ${visibleRows.map(({ index }, displayIndex) => renderLanguageInputRow({
          rows,
          index,
          displayIndex,
          onChange: onAddRow,
          onSearch,
          suggestions: suggestionByIndex[index] || [],
          onDragStart: handleDragStart,
          onDragOver: handleDragOver,
          onDrop: handleDrop,
          onDragEnd: handleDragEnd,
          isDropTarget: dropTargetIndex === index,
          onDelete: () => {
            deleteRow(rows, index)
            delete suggestionByIndex[index]
            onAddRow()
          }
        }))}
      </fieldset>
    </section>
  `
}

function renderLanguageEditTemplate(form: HTMLFormElement, formState: LanguageFormState) {
  const formStateWithSearch = formState as LanguageFormState & {
    suggestionByIndex?: Record<number, LanguageSuggestion[]>
    searchSeqByIndex?: Record<number, number>
    searchTimerByIndex?: Record<number, ReturnType<typeof setTimeout>>
  }

  const suggestionByIndex = formStateWithSearch.suggestionByIndex || (formStateWithSearch.suggestionByIndex = {})
  const searchSeqByIndex = formStateWithSearch.searchSeqByIndex || (formStateWithSearch.searchSeqByIndex = {})
  const searchTimerByIndex = formStateWithSearch.searchTimerByIndex || (formStateWithSearch.searchTimerByIndex = {})

  const rerender = () => renderLanguageEditTemplate(form, formState)
  const onSearch = (index: number, term: string) => {
    if (searchTimerByIndex[index]) {
      clearTimeout(searchTimerByIndex[index])
    }

    const normalized = sanitizeLanguageFieldValue(term)
    if (normalized.length < 2) {
      suggestionByIndex[index] = []
      rerender()
      return
    }

    const seq = (searchSeqByIndex[index] || 0) + 1
    searchSeqByIndex[index] = seq

    searchTimerByIndex[index] = setTimeout(async () => {
      const suggestions = await fetchLanguageSuggestions(normalized)
      if (searchSeqByIndex[index] !== seq) return
      suggestionByIndex[index] = suggestions

      const row = formState.languages[index]
      if (row) {
        const matchedSuggestion = matchLanguageSuggestion(suggestions, row.name)
        row.publicId = matchedSuggestion?.publicId || row.publicId
      }

      rerender()
    }, 220)
  }


  render(html`
    ${renderLanguageSection(formState.languages, rerender, suggestionByIndex, onSearch)}
  `, form)

  updateLanguagesSubmitEnabled(formState.languages)
}

function createLanguageEditForm(details: LanguageDetails[]) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')

  const formState = toFormState(details)
  formState.initialExistingOrder = formState.languages
    .filter((row) => Boolean((row.entryNode || '').trim()))
    .map((row) => (row.entryNode || '').trim())
  renderLanguageEditTemplate(form, formState)

  const addRow = () => {
    formState.languages.push({
      name: '',
      publicId: '',
      proficiency: '',
      entryNode: '',
      status: 'new'
    })
    renderLanguageEditTemplate(form, formState)
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
  const { form, formState, addRow } = createLanguageEditForm(languages)

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
