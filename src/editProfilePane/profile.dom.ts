import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'

export function paneDiv (
  context: DataBrowserContext, 
  subject: NamedNode,
  paneName: string
): HTMLElement {
  const view = context.session.paneRegistry.byName(paneName)
  if (!view) {
    const warning = context.dom.createElement('div')
    warning.innerText = `Unable to load view: ${paneName}`
    return warning
  }
  const viewContainer = view.render(subject, context)
  
  // Handle different node types
  let container: HTMLElement
  
  if (viewContainer && typeof viewContainer.setAttribute === 'function') {
    // It's already an Element node
    container = viewContainer as HTMLElement
  } else if (viewContainer && viewContainer.nodeType === Node.TEXT_NODE) {
    // It's a Text node, wrap it in a div
    container = context.dom.createElement('div')
    container.appendChild(viewContainer)
  } else {
    // Fallback for other cases
    container = context.dom.createElement('div')
    container.innerText = `View render did not return a valid Node for: ${paneName}`
  }
  
  container.setAttribute(
    'style', 'border: 0.3em solid #444; border-radius: 0.5em'
  )
  return container
}
