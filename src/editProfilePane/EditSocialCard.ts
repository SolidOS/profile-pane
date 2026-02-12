import { DataBrowserContext } from 'pane-registry'
import { NamedNode, Store} from 'rdflib'
import socialMediaForm from '../ontology/socialMedia.ttl'
import renderForm from './rdfFormsHelper'
import { socialAccountsHeadingText } from '../texts'

const socialMediaFormName = 'socialMedia.ttl' // The name of the form file

export function EditSocialSection(context: DataBrowserContext, me: NamedNode, editableProfile: NamedNode | null, store: Store) {
  const section = context.dom.createElement('section')
  section.setAttribute('aria-labelledby', 'edit-profile-social-heading')
  section.classList.add('profileSection', 'section-bg')

  const header = context.dom.createElement('header')
  header.classList.add('text-center', 'mb-md')

  const heading = context.dom.createElement('h2')
  heading.id = 'edit-profile-social-heading'
  heading.classList.add('section-title')
  heading.textContent = socialAccountsHeadingText

  header.appendChild(heading)
  section.appendChild(header)

  if (editableProfile) {
    const comment2 = context.dom.createElement('p')
    comment2.classList.add('p-md')
    comment2.textContent = 'Add links to your social media accounts here. These will be publicly visible on your profile.'
    section.appendChild(comment2)
  } else {
    const comment1 = context.dom.createElement('p')
    comment1.classList.add('p-md')
    comment1.textContent = 'Login to add social media accounts to your profile.'
    section.appendChild(comment1)
  }

  renderForm(section, me, socialMediaForm, socialMediaFormName, store, context.dom, editableProfile)

  return section
}
