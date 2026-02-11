import { NamedNode, Store, Namespace, sym, parse } from 'rdflib'
import { widgets } from 'solid-ui'

const baseUri = window.location.href.slice(0, window.location.href.lastIndexOf('/') + 1)

export default function renderForm(
  div: HTMLElement,
  subject: NamedNode, // Represents the RDF that fills the form
  formSource: string, // The imported form Turtle source
  formName: string,   // The name of the form file (e.g., 'profileForm.ttl')
  store: Store,
  dom: Document,
  editableProfile: NamedNode | null ) {
    // --- Form resource setup ---
    const formUri = baseUri + formName                // Full URI to the form file
    const formDoc = sym(formUri)                      // rdflib NamedNode for the document             
    const formThis = Namespace(formUri + '#')('this') // NamedNode for #this in the form

    // Load the form if not already in the store
    if (!store.holds(undefined, undefined, undefined, formDoc)) {
      parse(formSource, store, formUri, 'text/turtle', () => null)
    }

    div.setAttribute('data-testid', 'profile-editor')
    widgets.appendForm(
      dom,
      div,
      {},
      subject,
      formThis,
      editableProfile,
      complainIfBad
    )
  } // renderForm

function complainIfBad (div: HTMLElement, ok: boolean, mess: string, dom: Document) {
    if (ok) return
    div.appendChild(widgets.errorMessageBlock(dom, mess, '#fee'))
}