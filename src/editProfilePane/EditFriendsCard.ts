import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ns, widgets } from 'solid-ui'
import { friendsHeadingText } from '../texts'

export function EditFriendsSection(context: DataBrowserContext, me: NamedNode, editableProfile: NamedNode | null, profile: NamedNode) {
  const section = context.dom.createElement('section')
  section.setAttribute('aria-labelledby', 'edit-profile-friends-heading')
  section.classList.add('profileSection', 'section-bg')

  const header = context.dom.createElement('header')
  header.classList.add('text-center', 'mb-md')

  const heading = context.dom.createElement('h2')
  heading.id = 'edit-profile-friends-heading'
  heading.classList.add('section-title')
  heading.textContent = friendsHeadingText

  header.appendChild(heading)
  section.appendChild(header)

  let comment2: HTMLParagraphElement | null = null
  if (editableProfile) {
    comment2 = context.dom.createElement('p')
    comment2.id = 'edit-profile-friends-help'
    comment2.classList.add('p-md')
    comment2.textContent = 'Drag people onto the target below to add people.'
    section.appendChild(comment2)
  }

  const attachmentList = widgets.attachmentList(context.dom, me, section, {
    doc: profile,
    modify: !!editableProfile,
    predicate: ns.foaf('knows'),
    noun: 'friend'
  })

  const descriptions = []
  if (comment2?.id) {
    descriptions.push(comment2.id)
  }
  attachmentList.setAttribute('aria-describedby', descriptions.join(' '))
  section.appendChild(attachmentList)

  return section
}
