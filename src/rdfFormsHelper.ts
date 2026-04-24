/** Project-local: currently unused component. Keep temporarily; do not add new usage. */
import { NamedNode, Store, Namespace, sym, parse } from 'rdflib'
import { widgets } from 'solid-ui'

const baseUri = 'https://solidos.github.io/profile-pane/src/ontology/'

export default function renderForm(
  div: HTMLElement,
  subject: NamedNode, // Represents the RDF that fills the form
  formSource: string, // The imported form Turtle source
  formName: string,   // The name of the form file (e.g., 'socialMedia.ttl')
  store: Store,
  dom: Document,
  editableProfile: NamedNode | null,
  whichForm?: string ) {// Optional: specify which form to use if multiple 'a ui:Form' are present in the file{
    // --- Form resource setup ---
    const formUri = baseUri + formName                   // Full URI to the form file
    const exactForm = whichForm || 'this'                // If there are more 'a ui:Form' elements in a form file
    const formThis = Namespace(formUri + '#')(exactForm) // NamedNode for #this in the form

    loadDocument(store, formSource, formName, formUri)

    widgets.appendForm(
      dom,
      div,
      {},
      subject,
      formThis,
      editableProfile,
      (ok, mes) => {
        if (!ok) widgets.errorMessageBlock(dom, mes)
      }
    )

    // Ensure that when a user clicks “Add skill” or “Add language”, the newly
    // created input receives focus. Solid-UI provides only a generic "Add" button.
    // We detect the "add" control by the plus icon it uses and focus the last
    // text input in the surrounding multiple-field container.
    enableFocusOnAdd(div)

    // Track the last click/tap position so popups (like solid-ui delete confirmations)
    // can be positioned closer to where the user clicked.
    let lastClick = { x: 0, y: 0 }
    div.addEventListener(
      'pointerdown',
      (event) => {
        lastClick = { x: event.clientX, y: event.clientY }
      },
      { capture: true }
    )

    // Solid-UI injects a popup DIV (position:absolute, top:-1em) under a relative container.
    // Detect it and reposition it using last click coordinates.
    const repositionPopup = (popup: HTMLElement) => {
      const win = dom.defaultView || window
      const padding = 10
      const maxWidth = win.innerWidth - padding
      const maxHeight = win.innerHeight - padding

      // Force fixed positioning, then clamp to viewport so it doesn't get cut off.
      popup.style.position = 'fixed'
      popup.style.zIndex = '9999'
      popup.style.pointerEvents = 'auto'
      popup.style.opacity = '1'
      popup.style.visibility = 'visible'

      // Use getBoundingClientRect after it is in DOM; if it is 0x0, fall back to default offset.
      const rect = popup.getBoundingClientRect()
      const popupWidth = rect.width || 200
      const popupHeight = rect.height || 100

      const left = Math.min(Math.max(lastClick.x + padding, padding), maxWidth - popupWidth)
      const top = Math.min(Math.max(lastClick.y + padding, padding), maxHeight - popupHeight)

      popup.style.left = `${left}px`
      popup.style.top = `${top}px`
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue
          // Solid-UI popups are divs with inline position:absolute and grid display
          if (
            node.style.position === 'absolute' &&
            node.style.display === 'grid' &&
            node.style.top === '-1em'
          ) {
            repositionPopup(node)
            continue
          }
          // Also handle nested cases where the popup is not the direct added node
          const popup = node.querySelector<HTMLElement>('div[style*="position:absolute"][style*="display:grid"][style*="top:-1em"]')
          if (popup) repositionPopup(popup)
        }
      }
    })

    observer.observe(div, { childList: true, subtree: true })
  } // renderForm

function enableFocusOnAdd(root: HTMLElement) {
  const PLUS_ICON = 'noun_19460_green.svg'

  const isAddButton = (el: HTMLElement) => {
    const img = el.querySelector<HTMLImageElement>('img')
    const label = el.querySelector<HTMLElement>('span')
    return (
      img?.src.includes(PLUS_ICON) &&
      label?.textContent?.trim().toLowerCase().startsWith('add ')
    )
  }

  const buttons = Array.from(root.querySelectorAll<HTMLElement>('div')).filter(isAddButton)
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const scope = (function findScope(el: HTMLElement | null): HTMLElement {
        let cur: HTMLElement | null = el
        while (cur && cur !== root) {
          if (cur.querySelector('input[data-testid="autocomplete-input"]')) return cur
          cur = cur.parentElement
        }
        return root
      })(btn)

      const before = new Set(
        Array.from(scope.querySelectorAll<HTMLInputElement>('input[data-testid="autocomplete-input"]'))
      )

      const start = Date.now()
      const interval = setInterval(() => {
        const current = Array.from(
          scope.querySelectorAll<HTMLInputElement>('input[data-testid="autocomplete-input"]')
        )
        const newInput = current.find((el) => !before.has(el))

        if (newInput) {
          // New inputs are usually wrapped in a label/link; make sure focus jumps
          // straight to the input rather than the label link.
          skipLabelsFromTabbing(scope)
          newInput.focus()
          clearInterval(interval)
          return
        }

        if (Date.now() - start > 1000) {
          clearInterval(interval)
        }
      }, 50)
    })
  })
}




// we need to load into the store some additional information about Social Media accounts
export function loadDocument(
  store: Store,
  documentSource: string,
  documentName: string,
  documentURI?: string
  ) {
    const finalDocumentUri = documentURI || baseUri + documentName   // Full URI to the file
    const document = sym(finalDocumentUri)      // rdflib NamedNode for the document    
    
    if (!store.holds(undefined, undefined, undefined, document)) {
      // we are using the social media form because it contains the information we need
      // the form can be used for both use cases: create UI  for edit and render UI for display
      parse(documentSource, store, finalDocumentUri, 'text/turtle', () => null) // Load doc directly
    }
}

export function skipLabelsFromTabbing(root: HTMLElement): void {
  // Many Solid-UI forms render field labels as focusable links (hrefs).
  // Make sure keyboard tabbing skips these label links entirely.
  const selectors = [
    'label',
    '.formFieldName a',
    '.classifierBox-label a',
    '.choiceBox-label a',
    '.label a',
    // Skip focusable label-like links created by Solid-UI forms, including the vcard note link
    'a[href="http://www.w3.org/2006/vcard/ns#note"]',
    'a[href$="#note"]',
  ].join(', ')

  // querySelectorAll<HTMLElement> ensures the elements are typed correctly so we can access tabIndex.
  const nodes = root?.querySelectorAll<HTMLElement>(selectors)
  if (!nodes) return

  Array.from(nodes).forEach(el => {
    if (typeof el.tabIndex === 'number' && el.tabIndex !== -1) {
      el.tabIndex = -1
    }
    // Ensure those label links are not announced as focusable elements
    if (el.getAttribute('aria-hidden') !== 'true') {
      el.setAttribute('aria-hidden', 'true')
    }
  })
}