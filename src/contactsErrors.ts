import { DataBrowserContext } from  'pane-registry'
import { complain } from  './buttonsHelper'

const addErrorToErrorDisplay = (
  context: DataBrowserContext,
  message: string
) => {
  const errorDisplaySection = context.dom.getElementById('error-display-section')
  if (errorDisplaySection) {
    const errorMessage = context.dom.getElementById('error-display-message')
    errorDisplaySection.classList.add('contactsShowErrors')
    if (errorMessage) {
      errorMessage.textContent = message
    } else {
      errorDisplaySection.textContent = message
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
  
  const selectedGroupElements = context.dom.querySelectorAll('.selectedGroup')

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
    errorDisplaySection.classList.remove('contactsShowErrors')
    const errorMessage = context.dom.getElementById('error-display-message')
    if (errorMessage) errorMessage.textContent = ''
  }

  const errorDisplaySection = context.dom.createElement('section')
  errorDisplaySection.setAttribute('role', 'alert')
  errorDisplaySection.setAttribute('aria-label', 'Section to display error messages related to contact creation')
  errorDisplaySection.setAttribute('id', 'error-display-section')
  errorDisplaySection.classList.add('contactsErrorDisplay')

  const closeButton = context.dom.createElement('button')
  closeButton.setAttribute('type', 'button')
  closeButton.classList.add('contactsCloseErrorDisplayButton')
  closeButton.textContent = 'x'
  closeButton.addEventListener('click', setButtonOnClickHandler)

  const errorMessage = context.dom.createElement('p')
  errorMessage.setAttribute('id', 'error-display-message')
  errorMessage.classList.add('contactsErrorMessage')

  errorDisplaySection.appendChild(closeButton)
  errorDisplaySection.appendChild(errorMessage)
  return errorDisplaySection
}

const checkAndRemoveErrorDisplay = (
  context: DataBrowserContext
) => {
  const errorDisplaySection = context.dom.getElementById('error-display-section')
  if (errorDisplaySection && errorDisplaySection.classList.contains('contactsShowErrors')) {
    errorDisplaySection.classList.remove('contactsShowErrors')
    const errorMessage = context.dom.getElementById('error-display-message')
    if (errorMessage) errorMessage.textContent = ''
  }
}

export { 
  createErrorDisplaySection, 
  checkAndRemoveErrorDisplay,
  addErrorToErrorDisplay,
  checkAndAddErrorToDisplay
 }

