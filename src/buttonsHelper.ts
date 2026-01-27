import { DataBrowserContext } from 'pane-registry'
import { widgets } from 'solid-ui'
import { NamedNode } from 'rdflib'

function complain(
  buttonContainer: HTMLDivElement,
  context: DataBrowserContext,
  error: string
): void {
  const errorBlock = widgets.errorMessageBlock(context.dom, error)
  errorBlock.setAttribute('role', 'alert')
  errorBlock.setAttribute('aria-live', 'assertive')
  errorBlock.setAttribute('tabindex', '0')

  // Focus the error message for screen readers
  setTimeout(() => {
    errorBlock.focus()
  }, 100)

  buttonContainer.appendChild(errorBlock)
}

function mention(buttonContainer: HTMLDivElement, message: string): void {
  const positiveFrontendMessageDiv = <HTMLDivElement>document.createElement('div')
  positiveFrontendMessageDiv.setAttribute('role', 'status')
  positiveFrontendMessageDiv.setAttribute('aria-live', 'polite')
  positiveFrontendMessageDiv.setAttribute('tabindex', '0')
  positiveFrontendMessageDiv.classList.add('actionButton', 'licOkay')
  positiveFrontendMessageDiv.innerHTML = message

  // Focus the success message for screen readers
  setTimeout(() => {
    positiveFrontendMessageDiv.focus()
  }, 100)

  buttonContainer.appendChild(positiveFrontendMessageDiv)
}

function clearPreviousMessage(buttonContainer: HTMLDivElement): void {
  while (buttonContainer.childNodes.length > 2) {
    buttonContainer.removeChild(buttonContainer.lastChild)
  }
}

function checkIfAnyUserLoggedIn(me: NamedNode): boolean {
  if (me) return true
  else return false
}

export { complain, mention, clearPreviousMessage, checkIfAnyUserLoggedIn }
