import { DataBrowserContext } from 'pane-registry'
import { NamedNode, Store} from 'rdflib'
import otherPreferencesForm from '../ontology/otherPreferencesForm.ttl'
import renderForm from '../rdfFormsHelper'
import { otherPreferencesHeadingText } from '../texts'

const otherPreferencesFormName = 'otherPreferencesForm.ttl' // The name of the form file

export function EditOtherPreferencesSection(context: DataBrowserContext, me: NamedNode, editableProfile: NamedNode | null, store: Store) {
  const section = context.dom.createElement('section')
  section.setAttribute('data-testid', 'edit-other-preferences-section')
  section.setAttribute('aria-labelledby', 'edit-profile-other-preferences-heading')
  section.classList.add('profileSection', 'section-bg', 'profile-form')

  const header = context.dom.createElement('header')
  header.classList.add('text-center', 'mb-md')

  const heading = context.dom.createElement('h2')
  heading.id = 'edit-profile-other-preferences-heading'
  heading.classList.add('section-title')
  heading.textContent = otherPreferencesHeadingText

  header.appendChild(heading)
  section.appendChild(header)

  renderForm(section, me, otherPreferencesForm, otherPreferencesFormName, store, context.dom, editableProfile)

  return section
}
