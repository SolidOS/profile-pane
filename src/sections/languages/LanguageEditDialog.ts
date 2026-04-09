import { openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import { LanguageDetails, LanguageRow } from './types'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, applyRowSelectChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { processLanguageMutations } from './mutations'
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

function pickSuggestionByName(inputValue: string, suggestions: LanguageSuggestion[]): LanguageSuggestion | undefined {
  const value = sanitizeLanguageFieldValue(inputValue)
  if (!value) return undefined
  const normalizedValue = normalizeSuggestionKey(value)

  const exact = suggestions.find((suggestion) => sanitizeLanguageFieldValue(suggestion.name) === value)
  if (exact) return exact

  const ci = suggestions.find((suggestion) => sanitizeLanguageFieldValue(suggestion.name).toLowerCase() === value.toLowerCase())
  if (ci) return ci

  const normalized = suggestions.find((suggestion) => normalizeSuggestionKey(suggestion.name) === normalizedValue)
  if (normalized) return normalized

  const fuzzyMatches = suggestions.filter((suggestion) => {
    const key = normalizeSuggestionKey(suggestion.name)
    return key.includes(normalizedValue) || normalizedValue.includes(key)
  })
  if (fuzzyMatches.length === 1) return fuzzyMatches[0]

  return undefined
}

async function resolvePublicIdFromName(name: string): Promise<string> {
  const value = sanitizeLanguageFieldValue(name)
  if (!value) return ''
  const suggestions = await fetchLanguageSuggestions(value)
  const matched = pickSuggestionByName(value, suggestions)
  return matched?.publicId || ''
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
  }
}

async function validateLanguagesBeforeSave(rows: LanguageRow[]): Promise<string | null> {
  const ops = summarizeRowOps(rows, rowHasContent)
  const hasChanges = ops.create.length > 0 || ops.update.length > 0 || ops.remove.length > 0
  if (!hasChanges) return 'No language changes detected.'

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.status === 'deleted') continue
    if (!hasNonEmptyText(row.name)) continue
    if (!hasNonEmptyText(row.publicId)) {
      const resolved = await resolvePublicIdFromName(row.name)
      if (resolved) {
        row.publicId = resolved
        continue
      }
      return `Language ${i + 1}: please choose a language from the suggestions list.`
    }
  }

  return null
}

type ContactLanguageInputRowProps = {
  rows: LanguageRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
  onSearch: (index: number, term: string) => void
  suggestions: LanguageSuggestion[]
}

function renderLanguageInputRow({
  rows,
  index,
  displayIndex,
  onDelete,
  onChange,
  onSearch,
  suggestions
}: ContactLanguageInputRowProps) {
  const row = rows[index]
  const label = `Language ${displayIndex + 1}`
  const proficiencyLabel = `Language Proficiency ${displayIndex + 1}`
  const languageName = `language-${index}`
  const proficiencyInputName = `proficiency-${index}`
  const proficiencySelectId = `proficiency-${index}`
  const datalistId = `language-suggestions-${index}`
  const optionValueToSuggestion = new Map<string, LanguageSuggestion>()
  const optionValueToSuggestionCI = new Map<string, LanguageSuggestion>()
  const optionValueToSuggestionNormalized = new Map<string, LanguageSuggestion>()
  suggestions.forEach((suggestion) => {
    const key = sanitizeLanguageFieldValue(suggestion.name)
    const ciKey = key.toLowerCase()
    const normalizedKey = normalizeSuggestionKey(key)
    if (!optionValueToSuggestion.has(key)) {
      optionValueToSuggestion.set(key, suggestion)
    }
    if (!optionValueToSuggestionCI.has(ciKey)) {
      optionValueToSuggestionCI.set(ciKey, suggestion)
    }
    if (normalizedKey && !optionValueToSuggestionNormalized.has(normalizedKey)) {
      optionValueToSuggestionNormalized.set(normalizedKey, suggestion)
    }
  })

  const applySelectedSuggestion = (row: LanguageRow, rawValue: string) => {
    const value = sanitizeLanguageFieldValue(rawValue)
    const normalizedValue = normalizeSuggestionKey(value)

    const exactMatch =
      optionValueToSuggestion.get(value) ||
      optionValueToSuggestionCI.get(value.toLowerCase()) ||
      optionValueToSuggestionNormalized.get(normalizedValue)

    let matchedSuggestion = exactMatch
    if (!matchedSuggestion && normalizedValue) {
      const fuzzyMatches = suggestions.filter((suggestion) => {
        const key = normalizeSuggestionKey(suggestion.name)
        return key.includes(normalizedValue) || normalizedValue.includes(key)
      })
      if (fuzzyMatches.length === 1) {
        matchedSuggestion = fuzzyMatches[0]
      }
    }

    const previousName = sanitizeLanguageFieldValue(row.name)
    const previousPublicId = sanitizeLanguageFieldValue(row.publicId)

    if (matchedSuggestion) {
      row.publicId = matchedSuggestion.publicId
      row.name = sanitizeLanguageFieldValue(matchedSuggestion.name)
      return
    }

    row.name = value
    if (previousPublicId && previousName.toLowerCase() === value.toLowerCase()) {
      row.publicId = previousPublicId
      return
    }

    row.publicId = ''
  }


  const handleLanguageInput = (field: LanguageEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeLanguageFieldValue(target.value)
    if (rows[index]) {
      applySelectedSuggestion(rows[index], nextValue)
      applyRowFieldChange(rows[index], field, rows[index].name, rowHasContent)
      onSearch(index, rows[index].name)
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
    <div class="inputRow">
      <label aria-label=${`${label} Language`} class="inputValueRow">
        <input
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
          @input=${handleLanguageInput('name')}
          @change=${handleLanguageChange('name')}
        />
        <datalist id=${datalistId}>
          ${suggestions.map((suggestion) => html`<option value=${suggestion.name}></option>`)}
        </datalist>
      </label>
      <label aria-label=${proficiencyLabel} class="inputTypeRow">
        <select name=${proficiencyInputName} id=${proficiencySelectId} @change=${handleProficiencyInput} .value=${row?.proficiency || ''}>
          <option value="Basic">Basic</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Fluent">Fluent</option>
        </select>
      </label>
      <div class="inputActions inputActions--edge">
        <button
          type="button"
          class="deleteEntryButton"
          aria-label=${`Delete language ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <svg class="deleteEntryIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-1 6h2v9H8V9zm6 0h2v9h-2V9zM6 9h12l-1 12H7L6 9z" />
          </svg>
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
  const createNewRow = (event: Event) => {
    event.preventDefault()
    rows.push({
      name: '',
      publicId: '',
      proficiency: '',
      entryNode: '',
      status: 'new'
    })
    onAddRow()
  }


  const visibleRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.status !== 'deleted')

  return html`
    <section 
      aria-labelledby="language-heading" 
      class="contactsEditSection section-bg">
      <header class="profile__section-header">
        <h4 id="language-heading">
          <span class="sectionTitleIcon" aria-hidden="true">&#9993;</span>
          Languages
        </h4>
        <button
          type="button"
          class="profile__action-button u-profile-action-text"
          aria-label="Add another language"
          @click=${createNewRow}
        >
          + Add More
        </button>
      </header>
      <fieldset>
        <legend class="sr-only">Language entries</legend>
        ${visibleRows.map(({ index }, displayIndex) => renderLanguageInputRow({
          rows,
          index,
          displayIndex,
          onChange: onAddRow,
          onSearch,
          suggestions: suggestionByIndex[index] || [],
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
      rerender()
    }, 220)
  }


  render(html`
    ${renderLanguageSection(formState.languages, rerender, suggestionByIndex, onSearch)}
  `, form)
}

function createLanguageEditForm(details: LanguageDetails[]) {
  const form = document.createElement('form')
  form.classList.add('section-edit-form')

  const formState = toFormState(details)
  renderLanguageEditTemplate(form, formState)

  return { form, formState }
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
  const { form, formState } = createLanguageEditForm(languages)

  const result = await openInputDialog({
    title: editLanguagesDialogTitleText,
    dom,
    form,
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }
      return validateLanguagesBeforeSave(formState.languages)
    },
    onSave: async () => {
      const languageOps = summarizeRowOps(formState.languages, rowHasContent)
      const plan: MutationOps<LanguageRow> = {
        create: languageOps.create,
        update: languageOps.update,
        remove: languageOps.remove
      }
      await processLanguageMutations(store, subject, plan)
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
