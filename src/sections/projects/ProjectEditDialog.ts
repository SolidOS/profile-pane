import { openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import { ProjectDetails, ProjectRow } from './types'
import '../../styles/EditDialogs.css'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { processProjectsMutations } from './mutations'
import { pasteIcon } from '../../icons-svg/profileIcons'
import {
  editProjectsDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  pasteEntryButtonTitleText,
  saveProjectsUpdatesFailedPrefixText,
} from '../../texts'

type ProjectFormState = {
  project: ProjectRow
}

function sanitizeProjectFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function isValidProjectUrl(value: string): boolean {
  const text = sanitizeProjectFieldValue(value)
  if (!text) return false

  try {
    const parsed = new URL(text)
    return (
      parsed.protocol === 'https:' &&
      parsed.pathname === '/profile/card' &&
      parsed.hash === '#me'
    )
  } catch {
    return false
  }
}

function rowHasContent(row: ProjectRow): boolean {
  return [row.url, row.entryNode].some(hasNonEmptyText)
}

async function pasteWebIdIntoRow(row: ProjectRow): Promise<string> {
  const clipboardText = await navigator.clipboard.readText()
  const url = sanitizeProjectFieldValue(clipboardText)
  if (!url) return ''

  applyRowFieldChange(row, 'url', url, rowHasContent)

  return url
}

function toFormState(_details: ProjectDetails[]): ProjectFormState {
  return {
    project: { url: '', entryNode: '', status: 'new' }
  }
}

function validateProjectBeforeSave(row: ProjectRow): string | null {
  if (!hasNonEmptyText(row.url) && !hasNonEmptyText(row.entryNode)) {
    return 'Add a project WebID.'
  }
  if (!hasNonEmptyText(row.url)) {
    return 'WebID is required.'
  }
  if (!isValidProjectUrl(row.url)) {
    return 'Please enter a valid WebID in the form https://example.com/profile/card#me.'
  }
  return null
}

function renderProjectInputRow(row: ProjectRow, onChange: () => void) {
  const projectUrl = 'project-0'

  const handleUrlInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeProjectFieldValue(target.value)
    applyRowFieldChange(row, 'url', nextValue, rowHasContent)
    onChange()
  }

  const handlePaste = async (event: Event) => {
    event.preventDefault()

    try {
      const url = await pasteWebIdIntoRow(row)
      onChange()

      if (!isValidProjectUrl(url)) return

      const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
      const saveButton = dom.querySelector('#profile-modal #modal-buttons .btn-primary') as HTMLButtonElement | null
      saveButton?.click()
    } catch {
      // Clipboard access may fail due to browser permissions; keep dialog usable.
    }
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--project">
      <label aria-label="Project or community URL" class="label profile-edit-dialog__field profile-edit-dialog__field--full">
      <p>Add a project or community by pasting a link.</p>  
      <div class="profile-edit-dialog__input-wrap">
          <input
            class="input profile-edit-dialog__input--with-action"
            type="url"
            name=${projectUrl}
            .value=${row?.url || ''}
            required
            data-contact-field="url"
            data-entry-node=${row?.entryNode || ''}
            data-row-status=${row?.status || 'n/a'}
            placeholder="Paste project or community URL here"
            autocomplete="off"
            inputmode="text"
            @input=${handleUrlInput}
          />
          <button
            type="button"
            class="profile-edit-dialog__paste-button rounded-sm"
            aria-label="Paste project or community URL from clipboard"
            title=${pasteEntryButtonTitleText}
            @click=${handlePaste}
          >
            <span class="profile__paste-icon" aria-hidden="true">${pasteIcon}</span>
            Paste
          </button>
        </div>
      </label>
    </div>
  `
}

function renderProjectsEditTemplate(form: HTMLFormElement, formState: ProjectFormState) {
  const rerender = () => renderProjectsEditTemplate(form, formState)

  render(html`
    ${renderProjectInputRow(formState.project, rerender)}
  `, form)
}

function createProjectsEditForm(details: ProjectDetails[]) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')

  const formState = toFormState(details)
  renderProjectsEditTemplate(form, formState)

  return { form, formState }
}


export async function createProjectsEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  projects: ProjectDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState } = createProjectsEditForm(projects)

  const dialogPromise = openInputDialog({
    title: editProjectsDialogTitleText,
    dom,
    form,
    headerAction: { type: 'close' },
    validate: () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }
      return validateProjectBeforeSave(formState.project)
    },
    onSave: async () => {
      const projectOps = summarizeRowOps([formState.project], rowHasContent)
      const plan: MutationOps<ProjectRow> = {
        create: projectOps.create,
        update: projectOps.update,
        remove: projectOps.remove
      }
      await processProjectsMutations(store, subject, plan)
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveProjectsUpdatesFailedPrefixText} ${message}`
    }
  })

  const modalButtons = dom.querySelector('#profile-modal #modal-buttons') as HTMLElement | null
  const previousButtonsDisplay = modalButtons?.style.display
  if (modalButtons) {
    modalButtons.style.display = 'none'
  }

  let result: Record<string, string> | null = null
  try {
    result = await dialogPromise
  } finally {
    if (modalButtons) {
      modalButtons.style.display = previousButtonsDisplay || ''
    }
  }

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
