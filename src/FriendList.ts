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
      <header class="flex gap-xs mb-md">
        <h3 id="friends-section-title" class="section-title">Friend Connections</h3>
      </header>
      <nav aria-label="Friend profiles">
        <ul class="list-reset zebra-stripe" role="list">
          ${friends}
        </ul>
      </nav>
    </section>
  `
}

export const extractFriends = (subject: NamedNode, { dom }: DataBrowserContext) => {
  const target = dom.createElement('div')
  widgets.attachmentList(dom, subject, target, {
    doc: subject.doc(),
    modify: false,
    predicate: ns.foaf('knows'),
    noun: 'friend',
  })
  if (target.textContent === '')
    return null
  // Add 'friendItem' class and unique aria-label to each <li> for accessibility
  target.querySelectorAll('li').forEach((li, idx) => {
    li.classList.add('friendItem')
    // Try to find a link or text to use as a label
    const link = li.querySelector('a')
    if (link && link.textContent) {
      li.setAttribute('aria-label', `Friend: ${link.textContent.trim()}`)
    } else if (li.textContent) {
      li.setAttribute('aria-label', `Friend: ${li.textContent.trim()}`)
    } else {
      li.setAttribute('aria-label', `Friend ${idx + 1}`)
    }
  })
  return target
}
