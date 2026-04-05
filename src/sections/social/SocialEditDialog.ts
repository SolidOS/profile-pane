import { openInputDialog } from "../../ui/dialog"
import { html, render } from "lit-html"
import type { Account, SocialRow } from "./types"
import "../../styles/ContactInfoEditDialog.css"
import "../../styles/SectionInputRows.css"
import { LiveStore, NamedNode } from "rdflib"
import { ViewerMode } from "../../types"
import { applyRowFieldChange, deleteRow, summarizeRowOps } from "../shared/rowState"
import { hasNonEmptyText, sanitizeTextValue, toText } from "../../textUtils"
import { MutationOps } from "../shared/types"
import { processSocialMutations } from "./mutations"
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editSocialDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveSocialUpdatesFailedPrefixText
} from "../../texts"
import { DEFAULT_ICON_URI } from "./constants"
import { getSocialAccountOptions, type SocialAccountOption } from "./helpers"

type SocialFormState = {
  socialAccounts: SocialRow[]
}

type SocialEditableField = "name" | "icon" | "homepage"

type SocialRowInputProps = {
  rows: SocialRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
  options: SocialAccountOption[]
}

function sanitizeSocialFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function sanitizeUrlFieldValue(value: string): string {
  return sanitizeTextValue(value).replace(/\s+/g, "")
}

function isValidProfileUrl(value: string): boolean {
  const normalized = (value || "").trim()
  if (!normalized) return false
  try {
    const parsed = new URL(normalized)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function rowHasContent(row: SocialRow): boolean {
  // A social account is considered meaningful only when a personal profile URL is set.
  return hasNonEmptyText(row.homepage)
}

function toFormState(socialAccounts: Account[]): SocialFormState {
  const rows = (socialAccounts || [])
    .map((account) => ({
      name: sanitizeSocialFieldValue(toText(account.name)),
      icon: sanitizeSocialFieldValue(toText(account.icon)),
      homepage: sanitizeSocialFieldValue(toText(account.homepage)),
      entryNode: toText(account.entryNode),
      status: toText(account.entryNode) ? "existing" as const : "new" as const
    }))
    .filter((row) => Boolean(row.name || row.icon || row.homepage || row.entryNode))

  return {
    socialAccounts: rows.length
      ? rows
      : [{ name: "", icon: "", homepage: "", entryNode: "", status: "new" }]
  }
}

function validateSocialBeforeSave(rows: SocialRow[]): string | null {
  const ops = summarizeRowOps(rows, rowHasContent)
  const hasChanges = ops.create.length > 0 || ops.update.length > 0 || ops.remove.length > 0
  if (!hasChanges) return "No social changes detected."

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.status === "deleted") continue

    const hasAnyValue = [row.name, row.icon, row.homepage].some(hasNonEmptyText)
    if (!hasAnyValue) continue

    if (!hasNonEmptyText(row.name) || !hasNonEmptyText(row.icon)) {
      return `Social account ${i + 1}: please choose an account type from the dropdown.`
    }

    if (!hasNonEmptyText(row.homepage)) {
      return `Social account ${i + 1}: please enter your personal profile link.`
    }

    if (!isValidProfileUrl(row.homepage || "")) {
      return `Social account ${i + 1}: profile link must be a valid http(s) URL.`
    }
  }

  return null
}

function findOptionByName(options: SocialAccountOption[], name: string): SocialAccountOption | undefined {
  const key = (name || "").trim().toLowerCase()
  return options.find((option) => option.label.toLowerCase() === key)
}

function renderSocialAccountInputSelect(
  row: SocialRow,
  options: SocialAccountOption[],
  onChange: (event: Event) => void
) {
  const selected = findOptionByName(options, row?.name || "")
  const selectedValue = selected?.label || ""

  return html`
    <select class="inputSelect" name="social-account-type" .value=${selectedValue} @change=${onChange}>
      <option value="">Select account type</option>
      ${options.map((option) => html`<option value=${option.label}>${option.label}</option>`)}
    </select>
  `
}

function renderSocialInputRow({
  rows,
  index,
  displayIndex,
  onDelete,
  onChange,
  options
}: SocialRowInputProps) {
  const row = rows[index]
  const nameLabel = `Social Account Name ${displayIndex + 1}`
  const homepageLabel = `Social Account Homepage ${displayIndex + 1}`

  const handleTextInput = (field: SocialEditableField) => (event: Event) => {
    const target = event.target as HTMLInputElement
    const nextValue = field === "homepage"
      ? sanitizeUrlFieldValue(target.value)
      : sanitizeSocialFieldValue(target.value)
    if (rows[index]) {
      applyRowFieldChange(rows[index], field, nextValue, rowHasContent)
      onChange()
    }
  }

  const handleAccountTypeInput = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const selected = findOptionByName(options, target.value)
    if (!rows[index]) return

    if (!selected) {
      applyRowFieldChange(rows[index], "name", "", rowHasContent)
      applyRowFieldChange(rows[index], "icon", "", rowHasContent)
      onChange()
      return
    }

    applyRowFieldChange(rows[index], "name", selected.label, rowHasContent)
    applyRowFieldChange(rows[index], "icon", selected.icon || DEFAULT_ICON_URI, rowHasContent)

    onChange()
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  return html`
    <div class="inputRow">
     <img 
        class="socialIcon" 
        src="${row?.icon || DEFAULT_ICON_URI}" 
        alt="${row?.name || 'Social'} icon"
        width="30"
        height="30"
        loading="lazy"
      />
      <label aria-label=${nameLabel} class="inputValueRow">
        ${renderSocialAccountInputSelect(row, options, handleAccountTypeInput)}
      </label>
      <label aria-label=${homepageLabel} class="inputValueRow">
        <input
          type="url"
          name=${`social-homepage-${index}`}
          .value=${row?.homepage || ""}
          data-contact-field="homepage"
          data-entry-node=${row?.entryNode || ""}
          data-row-status=${row?.status || "n/a"}
          placeholder="Profile URL"
          autocomplete="url"
          inputmode="url"
          required
          @input=${handleTextInput("homepage")}
        />
        <small class="inputHelpText">Paste your full profile URL (for example: https://example.com/username)</small>
      </label>
      <div class="inputActions inputActions--edge">
        <button
          type="button"
          class="deleteEntryButton"
          aria-label=${`Delete social account ${displayIndex + 1}`}
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

function renderSocialSection(rows: SocialRow[], options: SocialAccountOption[], onRerender: () => void) {
  const createNewRow = (event: Event) => {
    event.preventDefault()
    rows.push({
      name: "",
      icon: "",
      homepage: "",
      entryNode: "",
      status: "new"
    })
    onRerender()
  }

  const visibleRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.status !== "deleted")

  return html`
    <section aria-labelledby="social-heading" class="contactsEditSection section-bg">
      <header class="sectionHeader">
        <h4 id="social-heading" tabindex="-1">Social Accounts</h4>
        <button
          type="button"
          class="actionButton"
          aria-label="Add another social account"
          @click=${createNewRow}
        >
          + Add More
        </button>
      </header>
      <fieldset>
        <legend class="sr-only">Social account entries</legend>
        ${visibleRows.map(({ index }, displayIndex) =>
          renderSocialInputRow({
            rows,
            index,
            displayIndex,
            onDelete: () => {
              deleteRow(rows, index)
              onRerender()
            },
            onChange: onRerender,
            options
          })
        )}
      </fieldset>
    </section>
  `
}

function renderSocialEditTemplate(form: HTMLFormElement, formState: SocialFormState, store: LiveStore) {
  const rerender = () => renderSocialEditTemplate(form, formState, store)
  const options = getSocialAccountOptions(store)
  render(html`${renderSocialSection(formState.socialAccounts, options, rerender)}`, form)
}

function createSocialEditForm(details: Account[], store: LiveStore) {
  const form = document.createElement("form")
  form.classList.add("section-edit-form")

  const formState = toFormState(details)
  renderSocialEditTemplate(form, formState, store)

  return { form, formState }
}

export async function createSocialEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  socialAccounts: Account[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState } = createSocialEditForm(socialAccounts, store)

  const result = await openInputDialog({
    title: editSocialDialogTitleText,
    dom,
    form,
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      if (viewerMode !== "owner") {
        return ownerLoginRequiredDialogMessageText
      }
      return validateSocialBeforeSave(formState.socialAccounts)
    },
    onSave: async () => {
      const socialOps = summarizeRowOps(formState.socialAccounts, rowHasContent)
      const plan: MutationOps<SocialRow> = {
        create: socialOps.create,
        update: socialOps.update,
        remove: socialOps.remove
      }
      await processSocialMutations(store, subject, plan)
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveSocialUpdatesFailedPrefixText} ${message}`
    }
  })

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
