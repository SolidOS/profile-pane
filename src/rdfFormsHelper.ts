import { NamedNode, Store, Namespace, sym, parse } from 'rdflib'
import { widgets } from 'solid-ui'

const baseUri = 'https://solidos.github.io/profile-pane/src/ontology/'

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
    const formThis = Namespace(formUri + '#')('this') // NamedNode for #this in the form

    loadDocument(formName, formSource, store)

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

// we need to load into the store some additional information about Social Media accounts
export function loadDocument(
  documentName: string,
  documentSource: string,
  store: Store) {
    const documentUri = baseUri + documentName   // Full URI to the file
    const document = sym(documentUri)      // rdflib NamedNode for the document    
    
    if (!store.holds(undefined, undefined, undefined, document)) {
      // we are using the social media form because it contains the information we need
      // the form can be used for both use cases: create UI  for edit and render UI for display
      parse(documentSource, store, documentUri, 'text/turtle', () => null) // Load doc directly
    }
}