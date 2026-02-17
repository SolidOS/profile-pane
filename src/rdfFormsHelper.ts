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
  } // renderForm

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