import { DataBrowserContext } from 'pane-registry'
import { html, TemplateResult } from 'lit-html'
import { ViewerMode } from '../types'
import { FriendDetails } from './types'
import { locationIcon, personInCircleIcon } from '../icons-svg/profileIcons'
import '../styles/FriendList.css'

function getFriendLabel(friend: FriendDetails): string {
  if (friend.name) return friend.name
  if (friend.nickname) return friend.nickname

  try {
    const hostname = new URL(friend.url).hostname
    return hostname.split('.')[0] || friend.url
  } catch {
    return friend.url
  }
}

function renderFriendImage(src?: string, alt?: string): TemplateResult {
  return src
    ? html`
        <img
          class="profile__hero"
          src=${src}
          alt=${alt || ''}
          width="60"
          height="60"
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
  const label = getFriendLabel(friend)
  const secondary = [friend.jobTitle, friend.organization].filter(Boolean).join(' | ')

  return html`
    <li class="friends__item" role="listitem">
      <a href=${friend.url} class="friends__link" target="_blank" rel="noopener noreferrer" aria-label="Visit ${label} profile (opens in new tab)">
        ${renderFriendImage(friend.imageUrl, label)}
        <div class="friends__content">
          <div class="friends-pane__friend-identity" role="group" aria-label="Name and pronouns">
            <h2 class="friends__label">${label}</h2>
            <span class="friends-pane__friends-pronouns">${friend.pronouns ? `(${friend.pronouns})` : ''}</span>
          </div>
            ${secondary ? html`<h3 class="friends-pane__friend-role-org">${secondary}</h3>` : html``}
          ${friend.location ? html`<p class="friends__meta">${locationIcon} ${friend.location}</p>` : html``}
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
        <ul class="friends__list list-reset" role="list">
          ${friends.map(renderFriend)}
        </ul>
      </nav>
    </section>
  `
}
