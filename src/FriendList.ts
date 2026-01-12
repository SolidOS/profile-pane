import { ns, widgets } from 'solid-ui'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { html, TemplateResult } from 'lit-html'
import './styles/FriendList.css'


export const FriendList = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult | null => {
  const friends = extractFriends(subject, context)
  if (!friends || !friends.textContent?.trim()) return null

  return html`
    <section
      class="friendListSection"
      role="region"
      aria-labelledby="friends-section-title"
      data-testid="friend-list"
    >
      <header>
        <h3 id="friends-section-title" class="sr-only">Friend Connections</h3>
      </header>
      <nav aria-label="Friend profiles">
        <ul class="friendList" role="list">
          ${friends}
        </ul>
      </nav>
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
  // Add 'friendItem' class to each <li> for zebra striping
  target.querySelectorAll('li').forEach(li => li.classList.add('friendItem'))
  return target
}
