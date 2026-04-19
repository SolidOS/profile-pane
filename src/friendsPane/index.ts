/**
 * Friends Pane
 *
 * This pane allows the users to view their own or others friends.
 * When you are viewing your own friends you can also add and delete them.
 *
 * Usage: paneRegistry.register('/profile/friends.view')
 * or standalone script adding onto existing mashlib.
 */

import { DataBrowserContext, PaneDefinition } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { html, nothing, render, TemplateResult } from 'lit-html'
import { authn } from 'solid-logic'
import { icons, ns } from 'solid-ui'
import '../styles/FriendList.css'
import { selectProfileData, streamFriends } from './selectors'
import { FriendList } from './FriendList'
import { ViewerMode } from '../types'
import { renderHeadingSection } from './FriendHeader'
import { ProfileDetails } from './types'

function getViewerMode(subject: NamedNode): ViewerMode {
  let mode: ViewerMode = 'anonymous'
  if (authn.currentUser() && authn.currentUser().sameTerm(subject)) mode = 'owner'
  if (authn.currentUser() && !authn.currentUser().sameTerm(subject)) mode = 'authenticated'
  return mode
}

const friendsPane: PaneDefinition = {
  global: true,

  icon: icons.iconBase + 'noun_492246.svg',

  name: 'friends',

  label: function (
    subject: NamedNode,
    context: DataBrowserContext
  ): string | null {
    const t = context.session.store.findTypeURIs(subject)
    if (
      t[ns.vcard('Individual').uri] ||
      t[ns.foaf('Person').uri] ||
      t[ns.schema('Person').uri]
    ) {
      return 'Friends'
    }
    return null
  },               
  render: function (subject: NamedNode, context: DataBrowserContext) {
    const viewerMode: ViewerMode = getViewerMode(subject)
    const target = context.dom.createElement('div')
    target.classList.add('friends-pane', 'flex-column', 'gap-lg', 'p-lg')

    let profileData: ProfileDetails | null = null
    let friendsMarkup: TemplateResult | typeof nothing = nothing

    const renderPane = () => {
      render(
        html`
          ${profileData ? renderHeadingSection(profileData) : nothing}
          ${friendsMarkup}
        `,
        target
      )
    }

    renderPane()

    ;(async () => {
      profileData = await selectProfileData(context, subject)
      renderPane()

      for await (const friends of streamFriends(context, subject)) {
        const friendList = FriendList(context, friends, viewerMode)
        friendsMarkup = friendList || nothing
        renderPane()
      }
    })()

    return target
  }
}

export default friendsPane