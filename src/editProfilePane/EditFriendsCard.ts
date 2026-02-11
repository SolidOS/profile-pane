import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ns, widgets } from 'solid-ui'

export function EditFriendsSection(context: DataBrowserContext, me: NamedNode, editableProfile: NamedNode | null, profile: NamedNode) {
  const section = context.dom.createElement('section')
  section.setAttribute('aria-labelledby', 'edit-profile-friends-heading')
  section.classList.add('profileSection', 'section-bg')

  const header = context.dom.createElement('header')
  header.classList.add('text-center', 'mb-md')

  const heading = context.dom.createElement('h2')
  heading.id = 'edit-profile-friends-heading'
  heading.classList.add('section-title')
  heading.textContent = 'Friends'

  header.appendChild(heading)
  section.appendChild(header)

  const comment1 = context.dom.createElement('p')
  comment1.classList.add('p-md')
  comment1.textContent = `This is your public social network. Only put people here to whom you are happy to be publicly connected. (You can always keep private track of friends and family in your contacts.)`
  section.appendChild(comment1)

  if (editableProfile) {
    const comment2 = context.dom.createElement('p')
    comment2.classList.add('p-md')
    comment2.textContent = 'Drag people onto the target below to add people.'
    section.appendChild(comment2)
  }

  section.appendChild(
    widgets.attachmentList(context.dom, me, section, {
      doc: profile,
      modify: !!editableProfile,
      predicate: ns.foaf('knows'),
      noun: 'friend'
    })
  )

  return section
}
