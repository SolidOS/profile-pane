import { alertDialog, openInputDialog } from "../../ui/dialog"
import { html, render } from "lit-html"
import { LanguageDetails, LanguageRow } from "./types"
import "../../styles/ContactInfoEditDialog.css"
import { LiveStore, NamedNode } from "rdflib"
import { ViewerMode } from "../../types"
import { applyRowFieldChange, applyRowSelectChange, deleteRow, summarizeRowOps } from "../shared/rowState"
import { hasNonEmptyText, sanitizeTextValue, toText } from "../../textUtils"
import { MutationOps } from "../contactInfo/types"
import { processLanguageMutations } from "./mutations"

type LanguageFormState = {
  languages: LanguageRow[]
}

type LanguageEditableField = 'name' | 'proficiency'

function sanitizeLanguageFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function rowHasContent(row: LanguageRow): boolean {
  return [
    row.name,
    row.proficiency
  ].some(hasNonEmptyText)
}

function toFormState(details: LanguageDetails[]): LanguageFormState {
  const rows = (details || [])
    .map((detail) => ({
      name: sanitizeLanguageFieldValue(toText(detail.name)),
      proficiency: sanitizeLanguageFieldValue(toText(detail.proficiency)),
      entryNode: toText(detail.entryNode),
      status: toText(detail.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((row) => Boolean(row.name || row.entryNode || row.proficiency))

 
  return {
    languages: rows.length ? rows : [{ name: '', proficiency: '', entryNode: '', status: 'new' }],
  }
}

type ContactLanguageInputRowProps = {
  rows: LanguageRow[]
  index: number
  displayIndex: number
  onDelete: () => void
}

function renderLanguageInputRow({
  rows,
  index,
  displayIndex,
  onDelete
}: ContactLanguageInputRowProps) {
  const row = rows[index]
  const label = `Language ${displayIndex + 1}`
  const proficiencyLabel = `Language Proficiency ${displayIndex + 1}`
  const languageName = `language-${index}`
  const proficiencyInputName = `proficiency-${index}`
  const proficiencySelectId = `proficiency-${index}`


  const handleLanguageInput = (field: LanguageEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeLanguageFieldValue(target.value)
    if (rows[index]) {
      applyRowFieldChange(rows[index], field, nextValue, rowHasContent)
    }
  }

  const handleProficiencyInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextType = target.value
    if (rows[index]) {
      applyRowSelectChange(rows[index], 'proficiency', nextType)
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
          inputmode="text"
          @change=${handleLanguageInput('name')}
        />
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
          title="Delete entry"
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

function renderLanguageSection(rows: LanguageRow[], onAddRow: () => void) {
  const createNewRow = (event: Event) => {
    event.preventDefault()
    rows.push({
      name: '',
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
      <header class="sectionHeader">
        <h4 id="language-heading" tabindex="-1">
          <span class="sectionTitleIcon" aria-hidden="true">&#9993;</span>
          Languages
        </h4>
        <button
          type="button"
          class="actionButton"
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
          onDelete: () => {
            deleteRow(rows, index)
            onAddRow()
          }
        }))}
      </fieldset>
    </section>
  `
}

function renderLanguageEditTemplate(form: HTMLFormElement, formState: LanguageFormState) {
  const rerender = () => renderLanguageEditTemplate(form, formState)


  render(html`
    ${renderLanguageSection(formState.languages, rerender)}
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
  viewerMode: ViewerMode
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState } = createLanguageEditForm(languages)

  const result = await openInputDialog({
    title: 'Edit Languages',
    dom,
    form,
    submitLabel: 'Save Changes',
    cancelLabel: 'Cancel'
  })

  if (!result) return

  if (viewerMode !== 'owner') {
    await alertDialog('You need to log in as the profile owner to save contact updates.', 'Login Required', dom)
    return
  }

 const languageOps = summarizeRowOps(formState.languages, rowHasContent)
 const plan: MutationOps<LanguageRow> = {
  create: languageOps.create,
  update: languageOps.update,
  remove: languageOps.remove
}

  // Save wiring is section-specific and can be added when mutation logic is ready.
  console.log('Language edit values', result)
  console.log('Pending language operations', languageOps)

  try {
    await processLanguageMutations(store, subject, plan)

    const view = dom.defaultView
    if (view) {
      view.location.reload()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await alertDialog(`Could not save contact updates. ${message}`, 'Save Failed', dom)
  }
}
