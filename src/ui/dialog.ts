import '../styles/dialog.css'
import 'solid-ui/components/actions/button'
import { html, render } from 'lit-html'
import { closeIcon } from '../icons-svg/profileIcons'
import { createSpinner } from './spinner'

/* Copied from issue-pane, minor typescript adjustments */
/* Changed modal from div to dialog element */
let modalDialog: HTMLDialogElement | null = null
let previousFocus: Element | null = null

type DialogButtonValue = boolean | 'save' | null
type DialogButton = {
  label: string,
  value: DialogButtonValue,
  primary?: boolean,
  cancel?: boolean,
  beforeClose?: () => Promise<boolean> | boolean
}

type DialogHeaderAction =
  | { type: 'close' }
  | { type: 'none' }
  | {
      type: 'button',
      label: string,
      ariaLabel?: string,
      className?: string,
      onClick?: () => Promise<void> | void
    }

type DialogElements = {
  dialog: HTMLDialogElement,
  title: HTMLHeadingElement,
  headerAction: HTMLDivElement,
  description: HTMLDivElement,
  error: HTMLElement,
  buttons: HTMLDivElement,
  savingOverlay: HTMLDivElement
}

type DialogActionControl = HTMLElement & {
  disabled?: boolean,
  label?: string,
  click: () => void,
  shadowRoot?: ShadowRoot | null
}

function isSolidUiButton(control: Element | null): control is DialogActionControl {
  return control?.tagName === 'SOLID-UI-BUTTON'
}

function focusDialogAction(control: Element | null): void {
  if (!control) return

  if (isSolidUiButton(control)) {
    const innerButton = control.shadowRoot?.querySelector('button') as HTMLButtonElement | null
    innerButton?.focus()
    return
  }

  if (control instanceof HTMLElement) {
    control.focus()
  }
}

function setDialogActionDisabled(control: DialogActionControl | null, disabled: boolean): void {
  if (!control) return
  control.disabled = disabled
  control.toggleAttribute('disabled', disabled)
}

function setDialogActionLabel(control: DialogActionControl | null, label: string): void {
  if (!control) return

  if (isSolidUiButton(control)) {
    control.label = label
    control.setAttribute('label', label)
    control.textContent = label
    return
  }

  ;(control as HTMLElement).textContent = label
}

export function getSharedDialogSaveButton(root: ParentNode): DialogActionControl | null {
  return root.querySelector('#modal-buttons [data-dialog-primary="true"]') as DialogActionControl | null
}

export function getSharedDialogCancelButton(root: ParentNode): DialogActionControl | null {
  return root.querySelector('#modal-buttons [data-cancel="true"]') as DialogActionControl | null
}

function ensureModalDialog (dom: Document): HTMLDialogElement {
  // if we previously created a dialog but it was removed from the document
  // (tests clear body), rebuild it. Checking presence ensures our reference
  // doesn't point at a detached element.
  if (modalDialog && dom.body.contains(modalDialog)) return modalDialog

  modalDialog = null
  modalDialog = dom.createElement('dialog')
  modalDialog.id = 'profile-modal'
  modalDialog.setAttribute('aria-modal', 'true')
  modalDialog.setAttribute('aria-labelledby', 'modal-title')
  modalDialog.setAttribute('aria-describedby', 'modal-desc')

  modalDialog.innerHTML = `
    <div class="modal">
      <div class="modal-header flex-row align-center justify-between">
        <h2 id="modal-title"></h2>
        <div id="modal-header-action" class="flex-row align-center"></div>
      </div>
      <div id="modal-desc"></div>
      <section id="modal-error" class="modal__error-section" aria-live="assertive" role="alert" hidden></section>
      <div id="modal-buttons" class="flex-row align-center justify-end"></div>
      <div id="modal-saving-overlay" hidden></div>
    </div>
  `

  dom.body.appendChild(modalDialog)
  return modalDialog
}

function getDialogElements (dialog: HTMLDialogElement): DialogElements {
  return {
    dialog,
    title: dialog.querySelector('#modal-title') as HTMLHeadingElement,
    headerAction: dialog.querySelector('#modal-header-action') as HTMLDivElement,
    description: dialog.querySelector('#modal-desc') as HTMLDivElement,
    error: dialog.querySelector('#modal-error') as HTMLElement,
    buttons: dialog.querySelector('#modal-buttons') as HTMLDivElement,
    savingOverlay: dialog.querySelector('#modal-saving-overlay') as HTMLDivElement
  }
}

function clearModalError(elements: DialogElements): void {
  elements.error.textContent = ''
  elements.error.hidden = true
}

function setModalError(elements: DialogElements, message: string): void {
  elements.error.textContent = message
  elements.error.hidden = false
}

function openDialogElement (dialog: HTMLDialogElement): void {
  if (typeof dialog.showModal === 'function') {
    try {
      if (!dialog.open) dialog.showModal()
      return
    } catch {
      // Fall back for jsdom or partial dialog implementations.
    }
  }

  dialog.setAttribute('open', '')
}

function closeDialogElement (dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function' && dialog.open) {
    dialog.close()
    return
  }

  dialog.removeAttribute('open')
}

function findInitialContentFocusTarget(container: ParentNode): HTMLElement | null {
  const focusable = Array.from(
    container.querySelectorAll('input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])')
  ) as HTMLElement[]

  for (const el of focusable) {
    const isDisabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
    const hiddenByAttr = el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true'
    if (!isDisabled && !hiddenByAttr) return el
  }

  return null
}

function focusInitialDialogTarget (description: HTMLDivElement, buttons: HTMLDivElement): void {
  const initialInput = findInitialContentFocusTarget(description)
  if (initialInput) {
    initialInput.focus()
    if (initialInput instanceof HTMLInputElement || initialInput instanceof HTMLTextAreaElement) {
      initialInput.select()
    }
    return
  }

  const firstButton = buttons.querySelector('solid-ui-button, button') as HTMLElement | null
  focusDialogAction(firstButton)
}

function collectFormValues (form: HTMLFormElement): InputDialogValues {
  const data = new FormData(form)
  const values: InputDialogValues = {}
  data.forEach((value, key) => {
    values[key] = String(value)
  })
  return values
}

function openModal ({
  title,
  message,
  buttons,
  headerAction,
  dom
}: {
  title?: string,
  message?: string | Node,
  buttons: DialogButton[],
  headerAction?: DialogHeaderAction,
  dom: Document
}) {
  const dialog = ensureModalDialog(dom)
  const elements = getDialogElements(dialog)

  previousFocus = dom.activeElement
  openDialogElement(dialog)

  elements.title.textContent = title || ''
  elements.description.innerHTML = ''
  if (typeof message === 'string') {
    elements.description.textContent = message
  } else {
    elements.description.appendChild(message)
  }

  elements.buttons.innerHTML = ''
  clearModalError(elements)

  return new Promise<DialogButtonValue>((resolve) => {
    const finish = (value: DialogButtonValue) => {
      closeModal(value)
      resolve(value)
    }

    const requestCancel = () => {
      const cancelBtn = getSharedDialogCancelButton(dialog)
      if (cancelBtn) {
        cancelBtn.click()
        return
      }

      finish(false)
    }

    dialog.oncancel = (event: Event) => {
      event.preventDefault()
      requestCancel()
    }

    elements.headerAction.innerHTML = ''
    const resolvedHeaderAction = headerAction || { type: 'close' as const }
    if (resolvedHeaderAction.type === 'close') {
      const closeButton = dom.createElement('solid-ui-button') as DialogActionControl
      closeButton.setAttribute('type', 'button')
      closeButton.setAttribute('variant', 'icon')
      closeButton.setAttribute('size', 'sm')
      closeButton.setAttribute('aria-label', 'Close dialog')
      const iconSlot = dom.createElement('span')
      iconSlot.setAttribute('slot', 'icon')
      render(closeIcon, iconSlot)
      closeButton.appendChild(iconSlot)
      closeButton.onclick = () => requestCancel()
      elements.headerAction.appendChild(closeButton)
    } else if (resolvedHeaderAction.type === 'button') {
      const actionButton = dom.createElement('solid-ui-button') as DialogActionControl
      actionButton.setAttribute('type', 'button')
      actionButton.setAttribute('variant', 'secondary')
      actionButton.setAttribute('size', 'sm')
      actionButton.className = resolvedHeaderAction.className || 'modal__header-action-button profile__action-button profile-action-text flex-center'
      actionButton.textContent = resolvedHeaderAction.label
      actionButton.setAttribute('label', resolvedHeaderAction.label)
      actionButton.setAttribute('aria-label', resolvedHeaderAction.ariaLabel || resolvedHeaderAction.label)
      actionButton.onclick = async () => {
        if (resolvedHeaderAction.onClick) {
          await resolvedHeaderAction.onClick()
        }
      }
      elements.headerAction.appendChild(actionButton)
    }

    buttons.forEach((btn) => {
      const b = dom.createElement('solid-ui-button') as DialogActionControl
      b.setAttribute('type', 'button')
      b.setAttribute('label', btn.label)
      b.setAttribute('size', 'md')
      b.setAttribute('variant', btn.primary ? 'primary' : 'secondary')
      b.textContent = btn.label
      if (btn.primary) {
        b.setAttribute('data-dialog-primary', 'true')
      }
      if (btn.cancel) {
        b.setAttribute('data-cancel', 'true')
      }
      b.addEventListener('click', async () => {
        if (btn.beforeClose) {
          const shouldClose = await btn.beforeClose()
          if (!shouldClose) return
        }
        finish(btn.value)
      })
      elements.buttons.appendChild(b)
    })

    focusInitialDialogTarget(elements.description, elements.buttons)
  })
}

function closeModal (_result: DialogButtonValue): void {
  if (modalDialog) {
    closeDialogElement(modalDialog)
    modalDialog.oncancel = null
    const headerActionButton = modalDialog.querySelector('#modal-header-action button') as HTMLButtonElement | null
    if (headerActionButton) headerActionButton.onclick = null
    if (previousFocus && 'focus' in previousFocus) (previousFocus as HTMLElement).focus()
  }
}

export function alertDialog (message: string, title = 'Information', dom: Document) {
  return openModal({
    title,
    message,
    buttons: [{ label: 'OK', value: true, primary: true }],
    dom
  })
}

function updateSavingUI (dialog: HTMLDialogElement, submitLabel: string, isSaving: boolean) {
  const elements = getDialogElements(dialog)
  const saveButton = getSharedDialogSaveButton(dialog)
  const cancelButton = getSharedDialogCancelButton(dialog)

  dialog.classList.toggle('modal--saving', isSaving)
  dialog.setAttribute('aria-busy', String(isSaving))
  elements.description.toggleAttribute('inert', isSaving)

  if (isSaving) {
    const activeElement = dialog.ownerDocument.activeElement as HTMLElement | null
    if (activeElement && dialog.contains(activeElement)) {
      activeElement.blur()
    }
  }

  if (saveButton) {
    setDialogActionDisabled(saveButton, isSaving)
    saveButton.setAttribute('aria-busy', String(isSaving))
    setDialogActionLabel(saveButton, submitLabel)
  }

  if (cancelButton) {
    setDialogActionDisabled(cancelButton, isSaving)
  }

  elements.savingOverlay.hidden = !isSaving
  if (isSaving) {
    render(html`
      <div class="modal__saving-indicator inline-flex-row justify-center" aria-live="polite" aria-label="Saving changes">
        ${createSpinner()}
      </div>
    `, elements.savingOverlay)
  } else {
    render(html``, elements.savingOverlay)
  }
}

export function setSharedDialogSavingState (dom: Document, isSaving: boolean, submitLabel = 'Saving Changes'): void {
  const dialog = ensureModalDialog(dom)
  updateSavingUI(dialog, submitLabel, isSaving)
}

type OpenInputDialogCustom = {
  title: string,
  dom: Document,
  form: HTMLFormElement,
  submitLabel?: string,
  cancelLabel?: string,
  headerAction?: DialogHeaderAction,
  hideFooterButtons?: boolean,
  validate?: () => Promise<string | null> | string | null,
  onSave?: () => Promise<void> | void,
  formatSaveError?: (error: unknown) => string
}

type InputDialogValues = Record<string, string>
/* Function below generated by AI Model: GPT-5.3-Codex */
/* Prompt: write me a reusable function to open a dialog with a form and return the form values on submit. 
The function should also support validation and display error messages in the dialog. 
It should reuse the OpenModal function for consistency. Done in 2 passes */
export function openInputDialog (options: OpenInputDialogCustom): Promise<InputDialogValues | null> {
  const submitLabel = options.submitLabel || 'Save Changes'
  const cancelLabel = options.cancelLabel || 'Cancel'
  const dialog = ensureModalDialog(options.dom)
  const elements = getDialogElements(dialog)
  const submitProxy = options.dom.createElement('button')
  submitProxy.type = 'submit'
  submitProxy.hidden = true
  submitProxy.tabIndex = -1
  options.form.appendChild(submitProxy)

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    const saveButton = getSharedDialogSaveButton(dialog)
    saveButton?.click()
  }

  options.form.addEventListener('submit', handleSubmit)

  const dialogPromise = openModal({
    title: options.title,
    message: options.form,
    headerAction: options.headerAction,
    buttons: [
      { label: cancelLabel, value: null, cancel: true },
      {
        label: submitLabel,
        value: 'save',
        primary: true,
        beforeClose: async () => {
          clearModalError(elements)

          if (options.validate) {
            const validationMessage = await options.validate()
            if (validationMessage) {
              setModalError(elements, validationMessage)
              return false
            }
          }

          if (!options.onSave) return true

          try {
            updateSavingUI(dialog, submitLabel, true)

            await options.onSave()
            return true
          } catch (error) {
            updateSavingUI(dialog, submitLabel, false)
            const fallback = error instanceof Error ? error.message : String(error)
            const message = options.formatSaveError ? options.formatSaveError(error) : fallback
            setModalError(elements, message)
            return false
          }
        }
      }
    ],
    dom: options.dom
  })

  elements.buttons.hidden = Boolean(options.hideFooterButtons)

  return dialogPromise
    .then((result) => {
      if (result !== 'save') return null
      return collectFormValues(options.form)
    })
    .finally(() => {
      elements.buttons.hidden = false
      updateSavingUI(dialog, submitLabel, false)
      options.form.removeEventListener('submit', handleSubmit)
      submitProxy.remove()
    })
}
