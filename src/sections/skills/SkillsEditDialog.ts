import { openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import { SkillDetails, SkillRow } from './types'
import '../../styles/EditDialogs.css'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { processSkillsMutations } from './mutations'
import { searchIcon, trashIcon } from '../../icons-svg/profileIcons'
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
  uri: string
}

const ESCO_SKILL_SEARCH_URI = 'https://ec.europa.eu/esco/api/search?language=$(language)&limit=$(limit)&type=skill&text=$(name)'
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
        const uri = typeof result?.uri === 'string' ? result.uri : ''
        return { label, uri }
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

function matchSkillSuggestion(suggestions: SkillSuggestion[], value: string): SkillSuggestion | null {
  const normalized = sanitizeSkillFieldValue(value).toLowerCase()
  if (!normalized) return null
  return suggestions.find((suggestion) => suggestion.label.toLowerCase() === normalized) || null
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
  const submitButton = document.querySelector('#profile-modal #modal-buttons button.btn-primary') as HTMLButtonElement | null
  if (!submitButton) return
  submitButton.disabled = hasInvalidSkillSelection(rows)
}

type SkillsInputRowProps = {
  rows: SkillRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
  onSkillSearch: (rowIndex: number, term: string) => void
  suggestions: SkillSuggestion[]
}

function renderSkillInputRow({
  rows,
  index,
  displayIndex,
  onDelete,
  onChange,
  onSkillSearch,
  suggestions
}: SkillsInputRowProps) {
  const row = rows[index]
  const label = `Skill ${displayIndex + 1}`
  const skillName = `skill-${index}`
  const datalistId = `skill-suggestions-${index}`
  const hasSelectionIssue = Boolean(row && row.status !== 'deleted' && hasNonEmptyText(row.name) && !hasNonEmptyText(row.publicId))

  const handleSkillInput = (field: SkillEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeSkillFieldValue(target.value)
    if (rows[index]) {
      applyRowFieldChange(rows[index], field, nextValue, rowHasContent)
      const matchedSuggestion = matchSkillSuggestion(suggestions, nextValue)
      rows[index].publicId = normalizeSkillPublicId(matchedSuggestion?.uri || '')
      onSkillSearch(index, nextValue)
      onChange()
    }
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--full profile-edit-dialog__row--skill">
      <label aria-label=${`${label} Name`} class="label profile-edit-dialog__field profile-edit-dialog__field--full">
        <div class="profile-edit-dialog__input-wrap">
          <span class="profile-edit-dialog__search-icon" aria-hidden="true">${searchIcon}</span>
          <input
            class="input profile-edit-dialog__input--with-leading-icon"
            type="text"
            name=${skillName}
            .value=${row?.name || ''}
            required
            data-contact-field="name"
            data-entry-node=${row?.entryNode || ''}
            data-row-status=${row?.status || 'n/a'}
            placeholder="Skill"
            autocomplete="off"
            list=${datalistId}
            inputmode="text"
            aria-invalid=${hasSelectionIssue ? 'true' : 'false'}
            @input=${handleSkillInput('name')}
          />
        </div>
        <datalist id=${datalistId}>
          ${suggestions.map((suggestion) => html`<option value=${suggestion.label}></option>`)}
        </datalist>
        <small class="inputHelpText">Type to search ESCO and select one suggestion.</small>
      </label>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge">
        <button
          type="button"
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete skill ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span class="profile-edit-dialog__delete-icon" aria-hidden="true">${trashIcon}</span>
        </button>
      </div>
    </div>
  `
}

function renderSkillsSection(
  rows: SkillRow[],
  onAddRow: () => void,
  suggestionByIndex: Record<number, SkillSuggestion[]>,
  handleSearch: (rowIndex: number, term: string) => void
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
          onChange: onAddRow,
          onSkillSearch: handleSearch,
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

function renderSkillsEditTemplate(form: HTMLFormElement, formState: SkillFormState) {
  const formStateWithSearch = formState as SkillFormState & {
    suggestionByIndex?: Record<number, SkillSuggestion[]>
    searchSeqByIndex?: Record<number, number>
    searchTimerByIndex?: Record<number, ReturnType<typeof setTimeout>>
  }

  const suggestionByIndex = formStateWithSearch.suggestionByIndex || (formStateWithSearch.suggestionByIndex = {})
  const searchSeqByIndex = formStateWithSearch.searchSeqByIndex || (formStateWithSearch.searchSeqByIndex = {})
  const searchTimerByIndex = formStateWithSearch.searchTimerByIndex || (formStateWithSearch.searchTimerByIndex = {})

  const rerender = () => renderSkillsEditTemplate(form, formState)
  const handleSearch = (rowIndex: number, term: string) => {
    if (searchTimerByIndex[rowIndex]) {
      clearTimeout(searchTimerByIndex[rowIndex])
    }

    const normalized = sanitizeSkillFieldValue(term)
    if (normalized.length < 2) {
      suggestionByIndex[rowIndex] = []
      rerender()
      return
    }

    const seq = (searchSeqByIndex[rowIndex] || 0) + 1
    searchSeqByIndex[rowIndex] = seq

    searchTimerByIndex[rowIndex] = setTimeout(async () => {
      const suggestions = await fetchEscoSkillSuggestions(normalized)
      if (searchSeqByIndex[rowIndex] !== seq) return
      suggestionByIndex[rowIndex] = suggestions

      const row = formState.skills[rowIndex]
      if (row) {
        const matchedSuggestion = matchSkillSuggestion(suggestions, row.name)
        row.publicId = matchedSuggestion ? normalizeSkillPublicId(matchedSuggestion.uri) : row.publicId
      }

      rerender()
    }, 220)
  }


  render(html`
    ${renderSkillsSection(formState.skills, rerender, suggestionByIndex, handleSearch)}
  `, form)

  updateSkillsSubmitEnabled(formState.skills)
}

function createSkillsEditForm(details: SkillDetails[]) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')

  const formState = toFormState(details)
  renderSkillsEditTemplate(form, formState)

  const addRow = () => {
    formState.skills.push({
      name: '',
      publicId: '',
      entryNode: '',
      status: 'new'
    })
    renderSkillsEditTemplate(form, formState)
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
  const { form, formState, addRow } = createSkillsEditForm(skills)

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
