import { openInputDialog } from '../../ui/dialog'
import { html, render, TemplateResult } from 'lit-html'
import type { BioDetails, BioRow } from './types'
import '../../styles/EditDialogs.css'
import { LiveStore, NamedNode } from 'rdflib'
import { processBioMutations } from './mutations'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import {
  dialogCancelLabelText,
  dialogSubmitLabelText,
  ownerLoginRequiredDialogMessageText,
  saveBioUpdatesFailedPrefixText
} from '../../texts'

type BioFormState = {
  bio: BioRow
}

function rowHasContent(row: BioRow): boolean {
  return hasNonEmptyText(row.description)
}

function toFormState(bioData: BioDetails): BioFormState {
  const row: BioRow = {
    description: sanitizeTextValue(toText(bioData?.description || '')),
    entryNode: toText(bioData?.entryNode || ''),
    status: toText(bioData?.entryNode || '') ? 'existing' as const : 'new' as const
  }

  return {
    bio: row
  }
}

function renderBioSection(bioRow: BioRow, onChange: () => void): TemplateResult {
  const descriptionName = 'bio-description'
  const descriptionCounterId = 'bio-description-counter'
  const descriptionMaxLength = 2600
  const descriptionCount = (bioRow?.description || '').length

  const handleDescriptionInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    const nextValue = sanitizeTextValue(target.value.slice(0, descriptionMaxLength))
    applyRowFieldChange(bioRow, 'description', nextValue, rowHasContent)
    onChange()
  }

  return html`
    <section aria-label="Bio editor">

      <label aria-label="Bio description" class="label profile-edit-dialog__field profile-edit-dialog__field--full profile-edit-dialog__field--stack profile-edit-dialog__bio-field-container">
        <span class="profile-edit-dialog__field-description">
          You can write about your years of experience, industry, or skills.
          People also talk about their achievements or previous job experiences.
        </span>
        <textarea
          class="profile-edit-dialog__textarea profile-edit-dialog__textarea--multiline"
          name=${descriptionName}
          rows="5"
          .value=${bioRow?.description || ''}
          maxlength=${descriptionMaxLength}
          aria-describedby=${descriptionCounterId}
          data-contact-field="description"
          data-entry-node=${bioRow?.entryNode || ''}
          data-row-status=${bioRow?.status || 'n/a'}
          placeholder="Write a short bio"
          autocomplete="off"
          @input=${handleDescriptionInput}
        ></textarea>
        <small id=${descriptionCounterId} aria-live="polite">${descriptionCount}/${descriptionMaxLength}</small>
      </label>
    </section>
  `
}

function renderBioEditTemplate(form: HTMLFormElement, formState: BioFormState) {
  const rerender = () => renderBioEditTemplate(form, formState)
  render(html`${renderBioSection(formState.bio, rerender)}`, form)
}

function createBioEditForm(bioData: BioDetails) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')

  const formState = toFormState(bioData)
  renderBioEditTemplate(form, formState)

  return { form, formState }
}

export async function createBioEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  bioData: BioDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState } = createBioEditForm(bioData)

  const result = await openInputDialog({
    title: 'Edit Bio',
    dom,
    form,
    headerAction: { type: 'none' },
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }

      const bioOps = summarizeRowOps([formState.bio], rowHasContent)
      const hasChanges = bioOps.create.length > 0 || bioOps.update.length > 0 || bioOps.remove.length > 0
      if (!hasChanges) return 'No bio changes detected.'
      return null
    },
    onSave: async () => {
      const bioOps = summarizeRowOps([formState.bio], rowHasContent)
      await processBioMutations(store, subject, bioOps)
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveBioUpdatesFailedPrefixText} ${message}`
    }
  })

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
