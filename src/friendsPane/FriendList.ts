import { DataBrowserContext } from 'pane-registry'
import { html, TemplateResult } from 'lit-html'
import { ViewerMode } from '../types'
import { FriendDetails } from './types'
import { personInCircleIcon } from '../icons-svg/profileIcons'
import '../styles/FriendList.css'

function renderFriendImage(src?: string, alt?: string): TemplateResult {
  return src
    ? html`
        <img
          class="profile__hero"
          src=${src}
          alt=${alt || ''}
          width="80"
          height="80"
          loading="eager"
        />
      `
    : html`
        <div class="profile__hero-alt flex-center" role="img" aria-label=${alt || ''} tabindex="0">
          <span class="profile__hero-icon">${personInCircleIcon}</span>
        </div>
      `
}

function renderFriend(friend: FriendDetails): TemplateResult {
  const label = friend.name || friend.nickname || friend.url
  const secondary = [friend.jobTitle, friend.organization].filter(Boolean).join(' | ')

  return html`
    <li class="friends__item" role="listitem">
      <a href=${friend.url} class="friends__link p-md" target="_blank" rel="noopener noreferrer" aria-label="Visit ${label} profile (opens in new tab)">
        ${renderFriendImage(friend.imageUrl, label)}
        <div class="friends__content">
          <div class="friends__label">${label}</div>
          ${secondary ? html`<div class="friends__meta">${secondary}</div>` : html``}
          ${friend.birthdate ? html`<div class="friends__meta">${friend.birthdate}</div>` : html``}
        </div>
      </a>
    </li>
  `
}

export const FriendList = (
  _context: DataBrowserContext,
  friends: FriendDetails[] | null,
  _viewerMode: ViewerMode
): TemplateResult | null => {
  if (!friends?.length) return null

  return html`
    <section
      class="friendListSection"
      data-testid="friend-list"
    >
      <h2 id="friends-section-title" class="sr-only">Friends</h2>
      <nav aria-label="Friend profiles">
        <ul class="friends__list list-reset zebra-stripe" role="list">
          ${friends.map(renderFriend)}
        </ul>
      </nav>
    </section>
  `
}
