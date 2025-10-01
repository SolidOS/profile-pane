import { ns, widgets } from 'solid-ui'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { html } from 'lit-html'
import * as styles from './styles/FriendList.module.css'
import { ProfilePresentation } from './presenter'


export const FriendList = (
  profileBasics: ProfilePresentation,
  subject: NamedNode,
  context: DataBrowserContext
) => {
  const friends = extractFriends(subject, context)
  if (!friends || !friends.textContent?.trim()) return html``

  return html`
    <section
      class="${styles.friendListSection}"
      role="region"
      data-testid="friend-list"
    >
      <ul class="${styles.friendList}" role="list">
        ${friends}
      </ul>
    </section>
  `
}

const extractFriends = (subject: NamedNode, { dom }: DataBrowserContext) => {
  const target = dom.createElement('div')
  widgets.attachmentList(dom, subject, target, {
    doc: subject.doc(),
    modify: false,
    predicate: ns.foaf('knows'),
    noun: 'friend',
  })
  if (target.textContent === '')
    return null
  else return target
}
