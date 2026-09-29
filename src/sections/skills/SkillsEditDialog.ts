import { getSharedDialogSaveButton, openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import 'solid-ui/components/button'
import 'solid-ui/components/combobox'
import { SkillDetails, SkillRow } from './types'
import '../../styles/EditDialogs.css'
import '../contactInfo/ContactInfoEditDialog.css'
import { defineAsyncComboboxOptionsProvider, ComboboxChangeEvent, Combobox, ComboboxOptionData } from 'solid-ui/components/combobox'
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

type SkillRerenderOptions = {
  focusSelector?: string
}

const ESCO_SKILL_SEARCH_URI = 'https://ec.europa.eu/esco/api/search?language=$(language)&limit=$(limit)&type=skill&text=$(name)&selectedVersion=v1.2.0'
const ESCO_SEARCH_LANGUAGE = 'en'
const ESCO_SEARCH_LIMIT = 8
const ESCO_SKILL_BASE_URI = 'http://data.europa.eu/esco/skill/'

const skillsProvider = defineAsyncComboboxOptionsProvider(async (rawQuery) => {
    const query = sanitizeSkillFieldValue(rawQuery)

    if (query.length < 2) {
      return [{
        value: '',
        label: 'Type at least 2 characters to search',
        selectable: false
      }]
    }

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
          const value = normalizeSkillPublicId(typeof result?.uri === 'string' ? result.uri : '')
          return { label, value }
        })
        .filter((option: ComboboxOptionData) => {
          if (!option.label) return false
          const key = option.label.toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
    } catch {
      return []
    }

})

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

function initializeSkillComboboxes(form: HTMLFormElement, rows: SkillRow[]): void {
  const comboboxElements = form.querySelectorAll('solid-ui-combobox[data-skill-row-index]') as NodeListOf<Combobox>

  comboboxElements.forEach((comboboxElement) => {
    const rowIndex = Number(comboboxElement.dataset.skillRowIndex)
    if (Number.isNaN(rowIndex)) return

    const row = rows[rowIndex]
    if (!row) return

    comboboxElement.optionsFallback = row.name
      ? [{ label: row.name, value: row.publicId }]
      : []
    comboboxElement.asyncOptionsProvider = skillsProvider
    comboboxElement.value = row.publicId || row.name
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

  const handleSkillInput = (event: Event) => {
    const combobox = event.target as Combobox

    applyRowFieldChange(rows[index], 'name', sanitizeSkillFieldValue(String(combobox.value)), rowHasContent)
    rows[index].publicId = ''
    updateSkillsSubmitEnabled(rows)
  }

  const handleSkillChange = (event: ComboboxChangeEvent) => {
    if (!rows[index] || !event.detail.option) return

    applyRowFieldChange(rows[index], 'name', sanitizeSkillFieldValue(event.detail.option.label), rowHasContent)
    rows[index].publicId = String(event.detail.option.value)
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
          placeholder="Skill"
          @input=${handleSkillInput}
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
    onOpen: () => focusSkillField(form, '[data-skill-row-index="0"]'),
    shouldCloseWithoutSave: () => {
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
      return error instanceof Error ? error.message : saveSkillsUpdatesFailedMessageText
    }
  })

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
