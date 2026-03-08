import { DataBrowserContext } from  'pane-registry'
import { complain } from  './buttonsHelper'

export const addErrorToErrorDisplay = (
  context: DataBrowserContext,
  message: string
) => {
  const errorDisplaySection = context.dom.getElementById('error-display-section')
  if (errorDisplaySection) {
    errorDisplaySection.classList.add('contactsShowErrors')
    errorDisplaySection.textContent = message
  } else {
    const buttonContainer = context.dom.getElementById('add-to-contacts-button-container')
    complain(buttonContainer as HTMLDivElement , context, message)
  }
}

export const checkAndAddErrorDisplay = (
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

