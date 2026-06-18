import type { Button as SolidUIButtonElement } from 'solid-ui/components/button'
import { DataBrowserContext } from  'pane-registry'
import { complain } from  '../../buttonsHelper'

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function formatContactsDialogError(prefix: string, error: unknown): string {
  const message = toErrorMessage(error)
  return message.startsWith(prefix) ? message : `${prefix}\n${message}`
}

function getSharedDialogErrorSection(context: DataBrowserContext): HTMLElement | null {
  return context.dom.querySelector('#profile-modal #modal-error') as HTMLElement | null
}

const addErrorToErrorDisplay = (
  context: DataBrowserContext,
  message: string
) => {
  const sharedDialogErrorSection = getSharedDialogErrorSection(context)
  if (sharedDialogErrorSection && context.dom.getElementById('contacts-addressbook-picker-dialog')) {
    sharedDialogErrorSection.textContent = message
    sharedDialogErrorSection.setAttribute('aria-hidden', 'false')
    sharedDialogErrorSection.hidden = false
    sharedDialogErrorSection.focus()
    return
  }

  const errorDisplaySection = context.dom.getElementById('error-display-section')
  if (errorDisplaySection) {
    const errorMessage = context.dom.getElementById('error-display-message')
    errorDisplaySection.classList.add('contacts-dialog__error--visible')
    errorDisplaySection.setAttribute('aria-hidden', 'false')
    if (errorMessage) {
      errorMessage.textContent = message
    } else {
      errorDisplaySection.textContent = message
    }
    if (errorDisplaySection instanceof HTMLElement) {
      errorDisplaySection.focus()
    }
  } else {
    const buttonContainer = context.dom.getElementById('add-to-contacts-button-container')
    complain(buttonContainer as HTMLDivElement , context, message)
  }
}

const checkAndAddErrorToDisplay = (
  context: DataBrowserContext,
  message: string
) => {
  
  const selectedGroupElements = context.dom.querySelectorAll('#group-list .contacts-dialog__list-button[selected]')

  const groupNameField = context.dom.querySelector('#groupNameInput')
  // @ts-ignore
  const enteredGroupName = groupNameField.value
  if (selectedGroupElements.length === 0 && !enteredGroupName) {
    addErrorToErrorDisplay(context, message)
  }
}

const createErrorDisplaySection = (
  context: DataBrowserContext
): HTMLElement => {
  const setButtonOnClickHandler = (event) => {
    event.preventDefault()
    errorDisplaySection.classList.remove('contacts-dialog__error--visible')
    errorDisplaySection.setAttribute('aria-hidden', 'true')
    const errorMessage = context.dom.getElementById('error-display-message')
    if (errorMessage) errorMessage.textContent = ''
  }

  const errorDisplaySection = context.dom.createElement('section')
  errorDisplaySection.setAttribute('role', 'alert')
  errorDisplaySection.setAttribute('aria-live', 'assertive')
  errorDisplaySection.setAttribute('aria-atomic', 'true')
  errorDisplaySection.setAttribute('aria-hidden', 'true')
  errorDisplaySection.setAttribute('aria-label', 'Section to display error messages related to contact creation')
  errorDisplaySection.setAttribute('id', 'error-display-section')
  errorDisplaySection.setAttribute('tabindex', '-1')
  errorDisplaySection.classList.add('contacts-dialog__error')

  const closeButton = context.dom.createElement('solid-ui-button') as SolidUIButtonElement
  closeButton.setAttribute('type', 'button')
  closeButton.setAttribute('variant', 'icon')
  closeButton.setAttribute('size', 'sm')
  closeButton.setAttribute('aria-label', 'Close error')
  closeButton.setAttribute('label', 'Close error')
  closeButton.classList.add('contacts-dialog__error-close')
  closeButton.textContent = 'x'
  closeButton.addEventListener('click', setButtonOnClickHandler)

  const errorMessage = context.dom.createElement('p')
  errorMessage.setAttribute('id', 'error-display-message')

  errorDisplaySection.appendChild(closeButton)
  errorDisplaySection.appendChild(errorMessage)
  return errorDisplaySection
}

const checkAndRemoveErrorDisplay = (
  context: DataBrowserContext
) => {
  const sharedDialogErrorSection = getSharedDialogErrorSection(context)
  if (sharedDialogErrorSection && context.dom.getElementById('contacts-addressbook-picker-dialog')) {
    sharedDialogErrorSection.textContent = ''
    sharedDialogErrorSection.setAttribute('aria-hidden', 'true')
    sharedDialogErrorSection.hidden = true
    return
  }

  const errorDisplaySection = context.dom.getElementById('error-display-section')
  if (errorDisplaySection && errorDisplaySection.classList.contains('contacts-dialog__error--visible')) {
    errorDisplaySection.classList.remove('contacts-dialog__error--visible')
    errorDisplaySection.setAttribute('aria-hidden', 'true')
    const errorMessage = context.dom.getElementById('error-display-message')
    if (errorMessage) errorMessage.textContent = ''
  }
}

export { 
  createErrorDisplaySection, 
  checkAndRemoveErrorDisplay,
  addErrorToErrorDisplay,
  checkAndAddErrorToDisplay,
  formatContactsDialogError
 }
