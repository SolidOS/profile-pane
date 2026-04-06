import { openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import { SkillDetails, SkillRow } from './types'
import '../../styles/ContactInfoEditDialog.css'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { processSkillsMutations } from './mutations'
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
      entryNode: toText(detail.entryNode),
      status: toText(detail.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((row) => Boolean(row.name || row.entryNode))

 
  return {
    skills: rows.length ? rows : [{ name: '', entryNode: '', status: 'new' }],
  }
}

function validateSkillsBeforeSave(rows: SkillRow[]): string | null {
  const ops = summarizeRowOps(rows, rowHasContent)
  const hasChanges = ops.create.length > 0 || ops.update.length > 0 || ops.remove.length > 0
  if (!hasChanges) return 'No skill changes detected.'
  return null
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
  const skillName = `skill-${index}`

  const handleSkillInput = (field: SkillEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeSkillFieldValue(target.value)
    if (rows[index]) {
      applyRowFieldChange(rows[index], field, nextValue, rowHasContent)
    }
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  return html`
    <div class="inputRow">
      <label aria-label=${`${label} Name`} class="inputValueRow">
        <input
          type="text"
          name=${skillName}
          .value=${row?.name || ''}
          required
          data-contact-field="name"
          data-entry-node=${row?.entryNode || ''}
          data-row-status=${row?.status || 'n/a'}
          placeholder="Skill"
          autocomplete="off"
          inputmode="text"
          @change=${handleSkillInput('name')}
        />
      </label>
      <div class="inputActions inputActions--edge">
        <button
          type="button"
          class="deleteEntryButton"
          aria-label=${`Delete skill ${displayIndex + 1}`}
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

function renderSkillsSection(rows: SkillRow[], onAddRow: () => void) {
  const createNewRow = (event: Event) => {
    event.preventDefault()
    rows.push({
      name: '',
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
      aria-labelledby="skills-heading" 
      class="contactsEditSection section-bg">
      <header class="sectionHeader">
        <h4 id="skills-heading">
          <span class="sectionTitleIcon" aria-hidden="true">&#9993;</span>
          Skills
        </h4>
        <button
          type="button"
          class="actionButton"
          aria-label="Add another skill"
          @click=${createNewRow}
        >
          + Add More
        </button>
      </header>
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

function renderSkillsEditTemplate(form: HTMLFormElement, formState: SkillFormState) {
  const rerender = () => renderSkillsEditTemplate(form, formState)


  render(html`
    ${renderSkillsSection(formState.skills, rerender)}
  `, form)
}

function createSkillsEditForm(details: SkillDetails[]) {
  const form = document.createElement('form')
  form.classList.add('section-edit-form')

  const formState = toFormState(details)
  renderSkillsEditTemplate(form, formState)

  return { form, formState }
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
  const { form, formState } = createSkillsEditForm(skills)

  const result = await openInputDialog({
    title: editSkillsDialogTitleText,
    dom,
    form,
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
