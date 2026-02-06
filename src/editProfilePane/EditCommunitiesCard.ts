import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ns, widgets } from 'solid-ui'

export function EditProfileCommunitiesSection(context: DataBrowserContext, me: NamedNode, editableProfile: NamedNode | null, profile: NamedNode) {
  const section = context.dom.createElement('section')
  section.setAttribute('aria-labelledby', 'edit-profile-communities-heading')
  section.classList.add('profileSection', 'section-bg')

  const header = context.dom.createElement('header')
  header.classList.add('text-center', 'mb-md')

  const heading = context.dom.createElement('h2')
  heading.id = 'edit-profile-communities-heading'
  heading.classList.add('section-title')
  heading.textContent = 'Communities you participate in'
  header.appendChild(heading)
  section.appendChild(header)

  const comment1 = context.dom.createElement('p')
  comment1.classList.add('p-md')
  comment1.textContent = 'These are organizations and projects whose stuff you share'
  section.appendChild(comment1)

  if (editableProfile) {
    const comment2 = context.dom.createElement('p')
    comment2.classList.add('p-md')
    comment2.textContent = 'Drag organizations onto the target below to add organizations.'
    section.appendChild(comment2)
  }

  section.appendChild(
    widgets.attachmentList(context.dom, me, section, {
      doc: profile,
      modify: !!editableProfile,
      predicate: ns.solid('community'),
      noun: 'community'
    })
  )

  return section
}
