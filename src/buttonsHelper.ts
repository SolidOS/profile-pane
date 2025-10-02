import { DataBrowserContext } from 'pane-registry'
import { widgets } from 'solid-ui'

function complain(
  buttonContainer: HTMLDivElement,
  context: DataBrowserContext,
  error: string
): void {
  buttonContainer.appendChild(widgets.errorMessageBlock(context.dom, error))
}

function mention(buttonContainer: HTMLDivElement, message: string): void {
  const positiveFrontendMessageDiv = <HTMLDivElement>document.createElement('div')
  positiveFrontendMessageDiv.setAttribute(
    'style',
    'margin: 0.1em; padding: 0.5em; border: 0.05em solid gray; background-color: #efe; color:black;'
  )
  //positiveFrontendMessageDiv.setAttribute('style', UI.style.messageBodyStyle) -> using UI but missing green backgroung color
  positiveFrontendMessageDiv.innerHTML = message
  buttonContainer.appendChild(positiveFrontendMessageDiv)
}

function clearPreviousMessage(buttonContainer: HTMLDivElement): void {
  while (buttonContainer.childNodes.length > 1) {
    buttonContainer.removeChild(buttonContainer.lastChild)
  }
}

export { complain, mention, clearPreviousMessage }
