import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ns, widgets } from 'solid-ui'
import { communitiesHeadingText } from '../texts'

export function EditProfileCommunitiesSection(context: DataBrowserContext, me: NamedNode, editableProfile: NamedNode | null, profile: NamedNode) {
  const section = context.dom.createElement('section')
  section.setAttribute('aria-labelledby', 'edit-profile-communities-heading')
  section.classList.add('profileSection', 'section-bg')

  const header = context.dom.createElement('header')
  header.classList.add('text-center', 'mb-md')

  const heading = context.dom.createElement('h2')
  heading.id = 'edit-profile-communities-heading'
  heading.classList.add('section-title')
  heading.textContent = communitiesHeadingText
  header.appendChild(heading)
  section.appendChild(header)


  let comment2: HTMLParagraphElement | null = null
  if (editableProfile) {
    comment2 = context.dom.createElement('p')
    comment2.id = 'edit-profile-communities-help'
    comment2.classList.add('p-md')
    comment2.textContent = 'Drag organizations or projects onto the target below to add organizations.'
    section.appendChild(comment2)
  }

  const attachmentList = widgets.attachmentList(context.dom, me, section, {
    doc: profile,
    modify: !!editableProfile,
    predicate: ns.solid('community'),
    noun: 'community'
  })

  const descriptions = []
  if (comment2?.id) {
    descriptions.push(comment2.id)
  }
  attachmentList.setAttribute('aria-describedby', descriptions.join(' '))
  section.appendChild(attachmentList)

  return section
}
