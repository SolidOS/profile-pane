/* These functions may be needed later I don't want to remove them
when we are done with the refactor we can see if they can be removed.
or rename the file as needed. */
import { NamedNode } from 'rdflib'
import { presentStuff } from './StuffPresenter'
import { html } from 'lit-html'
import { contactHeadingText, friendsHeadingText, sharedItemsHeadingText } from '../texts'
import { ChatWithMe } from '../ChatWithMe'
import { FriendList } from '../friendsPane/FriendList'
import { StuffCard } from './StuffCard'
import { ViewerMode } from '../types'
import { DataBrowserContext } from 'pane-registry'
import { presentProfile } from './presenter'

type ProfileBasics = ReturnType<typeof presentProfile>
type StuffData = Awaited<ReturnType<typeof presentStuff>>

export function renderChatWithMeSection(subject: NamedNode, context: DataBrowserContext, viewerMode: ViewerMode) {
  return html`
    <section
      aria-labelledby="chat-heading"
      class="profileSection section-bg"
      role="region"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="chat-heading" tabindex="-1">${contactHeadingText}</h2>
      </header>
      <div>
        ${ChatWithMe(subject, context, viewerMode)}
      </div>
    </section>
  `
}

export function renderFriendsSection(subject: NamedNode, context: DataBrowserContext, viewerMode: ViewerMode) {
  void subject
  const friends = FriendList(context, null, viewerMode)
  return friends ? html`
    <aside
      aria-labelledby="friends-heading"
      class="profileSection section-bg"
      role="complementary"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="friends-heading" tabindex="-1">${friendsHeadingText}</h2>
      </header>
      <div role="list" aria-label="Friend connections">
        ${friends}
      </div>
    </aside>
  ` : ''
}

export async function renderStuffSection(profileBasics: ProfileBasics, context: DataBrowserContext, subject: NamedNode, viewerMode: ViewerMode) {
  // stuff data was done somewhere else moving it 
  // here for now so it doesn't get lost.
  const stuffData: StuffData = await presentStuff(subject, viewerMode)

  return stuffData.stuff && stuffData.stuff.length > 0 ? html`
    <section 
      aria-labelledby="stuff-heading" 
      class="profileSection section-bg" 
      role="region"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="stuff-heading" tabindex="-1">${sharedItemsHeadingText}</h2>
      </header>
      <div>
        ${StuffCard(profileBasics, context, subject, stuffData, viewerMode)}
      </div>
    </section>
  ` : ''
}

