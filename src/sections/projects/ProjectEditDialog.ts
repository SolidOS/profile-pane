import { openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import { ProjectDetails, ProjectRow } from './types'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { processProjectsMutations } from './mutations'
import { fetchLinkPreview, LinkCategory } from './linkPreview'
import { addIcon } from '../../icons-svg/profileIcons'
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editProjectsDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveProjectsUpdatesFailedPrefixText,
} from '../../texts'

type ProjectFormState = {
  projects: ProjectRow[]
}

function sanitizeProjectFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function isValidProjectUrl(value: string): boolean {
  const text = sanitizeProjectFieldValue(value)
  if (!text) return false

  try {
    const parsed = new URL(text)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function rowHasContent(row: ProjectRow): boolean {
  return [
    row.url,
    row.entryNode
  ].some(hasNonEmptyText)
}

function toFormState(details: ProjectDetails[]): ProjectFormState {
  const rows = (details || [])
    .map((detail) => ({
      url: sanitizeProjectFieldValue(toText(detail.url)),
      title: sanitizeProjectFieldValue(toText(detail.title)),
      businessType: sanitizeProjectFieldValue(toText(detail.businessType)),
      description: sanitizeProjectFieldValue(toText(detail.description)),
      imageUrl: sanitizeProjectFieldValue(toText(detail.imageUrl)),
      category: (toText(detail.category) as LinkCategory) || 'unknown',
      entryNode: toText(detail.entryNode),
      status: toText(detail.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((row) => Boolean(row.url || row.entryNode || row.title || row.businessType || row.description || row.imageUrl))

 
  return {
    projects: rows.length ? rows : [{ url: '', title: '', businessType: '', description: '', imageUrl: '', category: 'unknown', entryNode: '', status: 'new' }]
  }
}

function validateProjectsBeforeSave(rows: ProjectRow[]): string | null {
  if (!rows.some((row) => hasNonEmptyText(row.url) || hasNonEmptyText(row.entryNode))) {
    return 'Add at least one project URL.'
  }

  const visibleRows = rows.filter((row) => row.status !== 'deleted')
  for (let index = 0; index < visibleRows.length; index++) {
    const row = visibleRows[index]
    if (!hasNonEmptyText(row.url)) {
      return `Project ${index + 1}: URL is required.`
    }
    if (!isValidProjectUrl(row.url)) {
      return `Project ${index + 1}: please enter a valid URL starting with http:// or https://.`
    }
  }

  return null
}

async function hydrateProjectRowMetadata(row: ProjectRow): Promise<void> {
  const url = sanitizeProjectFieldValue(row.url)
  if (!url) return

  try {
    const preview = await fetchLinkPreview(url)

    row.url = sanitizeProjectFieldValue(preview.url || row.url || '')
    row.title = sanitizeProjectFieldValue(preview.title || row.title || '')
    row.businessType = sanitizeProjectFieldValue(preview.businessType || row.businessType || '')
    row.description = sanitizeProjectFieldValue(preview.description || row.description || '')
    row.imageUrl = sanitizeProjectFieldValue(preview.imageUrl || row.imageUrl || '')
    row.category = preview.category || row.category || 'unknown'
  } catch {
    // Keep save resilient even if preview API is unavailable.
  }
}

async function hydrateProjectMetadataBeforeSave(rows: ProjectRow[]): Promise<void> {
  const activeRows = rows.filter((row) => row.status !== 'deleted' && hasNonEmptyText(row.url))
  for (const row of activeRows) {
    await hydrateProjectRowMetadata(row)
  }
}

type ProjectInputRowProps = {
  rows: ProjectRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
}

function renderProjectInputRow({
  rows,
  index,
  displayIndex,
  onDelete,
  onChange
}: ProjectInputRowProps) {
  const row = rows[index]
  const label = `Project ${displayIndex + 1}`
  const projectUrl = `project-${index}`

  const hydratePreviewFromUrl = async (rawUrl: string) => {
    const url = sanitizeProjectFieldValue(rawUrl)
    if (!url || !rows[index]) return

    try {
      const preview = await fetchLinkPreview(url)
      if (!rows[index]) return

      applyRowFieldChange(rows[index], 'url', sanitizeProjectFieldValue(preview.url || url), rowHasContent)
      applyRowFieldChange(rows[index], 'title', sanitizeProjectFieldValue(preview.title || rows[index].title || ''), rowHasContent)
      applyRowFieldChange(rows[index], 'businessType', sanitizeProjectFieldValue(preview.businessType || rows[index].businessType || ''), rowHasContent)
      applyRowFieldChange(rows[index], 'description', sanitizeProjectFieldValue(preview.description || rows[index].description || ''), rowHasContent)
      applyRowFieldChange(rows[index], 'imageUrl', sanitizeProjectFieldValue(preview.imageUrl || rows[index].imageUrl || ''), rowHasContent)
      applyRowFieldChange(rows[index], 'category', preview.category || rows[index].category || 'unknown', rowHasContent)
      onChange()
    } catch {
      // Keep manual entry flow usable even if preview fetch fails.
    }
  }

  const handleUrlInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeProjectFieldValue(target.value)
    if (rows[index]) {
      applyRowFieldChange(rows[index], 'url', nextValue, rowHasContent)
      onChange()
    }
  }

  const handleUrlBlur = async (e: Event) => {
    const target = e.target as HTMLInputElement
    await hydratePreviewFromUrl(target.value)
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  return html`
    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Project URL`} class="label profile-edit-dialog__field">
        <input
          class="input"
          type="url"
          name=${projectUrl}
          .value=${row?.url || ''}
          required
          data-contact-field="url"
          data-entry-node=${row?.entryNode || ''}
          data-row-status=${row?.status || 'n/a'}
          placeholder="Project URL"
          autocomplete="off"
          inputmode="text"
          @input=${handleUrlInput}
          @blur=${handleUrlBlur}
        />
      </label>
      ${row?.title || row?.businessType || row?.category !== 'unknown' || row?.description
        ? html`
          <div class="profile-edit-dialog__field profile-edit-dialog__field--full">
            ${row?.title ? html`<p><strong>${row.title}</strong></p>` : html``}
            ${row?.businessType ? html`<p>${row.businessType}</p>` : html``}
            ${row?.category && row.category !== 'unknown' ? html`<p>${row.category}</p>` : html``}
            ${row?.description ? html`<p>${row.description}</p>` : html``}
          </div>
        `
        : html``}
      ${row?.imageUrl ? html`
        <div class="profile-edit-dialog__field profile-edit-dialog__field--full">
          <img src=${row.imageUrl} alt=${row.title || 'Project preview image'} style="max-width: 180px; border-radius: 6px;" />
        </div>
      ` : html``}
      <div class="inputActions inputActions--edge">
        <button
          type="button"
          class="deleteEntryButton"
          aria-label=${`Delete project ${displayIndex + 1}`}
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

function renderProjectSection(rows: ProjectRow[], onAddRow: () => void) {
  const createNewRow = (event: Event) => {
    event.preventDefault()
    rows.push({
      url: '',
      title: '',
      businessType: '',
      description: '',
      imageUrl: '',
      category: 'unknown',
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
      aria-labelledby="project-heading" 
      class="editSection section-bg">
      <header class="profile__section-header">
        <h4 id="project-heading">
          <span class="sectionTitleIcon" aria-hidden="true">&#9993;</span>
          Projects & Communities
        </h4>
        <button
          type="button"
          class="profile__action-button u-profile-action-text"
          aria-label="Add another project"
          @click=${createNewRow}
        >
          <span class="profile__add-more-content">
            <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
            Add More
          </span>
        </button>
      </header>
      <fieldset>
        <legend class="sr-only">Project entries</legend>
        ${visibleRows.map(({ index }, displayIndex) => renderProjectInputRow({
          rows,
          index,
          displayIndex,
          onDelete: () => {
            deleteRow(rows, index)
            onAddRow()
          },
          onChange: onAddRow
        }))}
      </fieldset>
    </section>
  `
}

function renderProjectsEditTemplate(form: HTMLFormElement, formState: ProjectFormState) {
  const rerender = () => renderProjectsEditTemplate(form, formState)

  render(html`
    ${renderProjectSection(formState.projects, rerender)}
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

  const result = await openInputDialog({
    title: editProjectsDialogTitleText,
    dom,
    form,
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }
      return validateProjectsBeforeSave(formState.projects)
    },
    onSave: async () => {
      await hydrateProjectMetadataBeforeSave(formState.projects)
      const projectOps = summarizeRowOps(formState.projects, rowHasContent)
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

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
