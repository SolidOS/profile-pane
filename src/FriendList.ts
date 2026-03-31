import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { html, TemplateResult } from 'lit-html'
import { extractFriends } from './addMeToYourFriends'
import { ViewerMode } from './types'
import './styles/FriendList.css'


export const FriendList = (
  subject: NamedNode,
  context: DataBrowserContext,
  viewerMode: ViewerMode
): TemplateResult | null => {
  const friends = extractFriends(false, subject, context)
  if (!friends || !friends.textContent?.trim()) return null

  return html`
    <section
      class="friendListSection"
      data-testid="friend-list"
    >
      <h2 id="friends-section-title" class="sr-only">Friends</h2>
      <nav aria-label="Friend profiles">
        <ul class="list-reset zebra-stripe" role="list">
          ${friends}
        </ul>
      </nav>
    </section>
  `
}
