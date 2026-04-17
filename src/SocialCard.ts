import { html, TemplateResult } from 'lit-html'
import { SocialPresentation } from './SocialPresenter'
import { ViewerMode } from './types'
import './styles/SocialCard.css'

const MAX_VISIBLE_SOCIAL_ACCOUNTS_MOBILE = 10

function isRenderableAccount(account): boolean {
  return Boolean(account?.homepage && account?.name && account?.icon)
}

function expandSocialAccounts(event: Event): void {
  const button = event.currentTarget as HTMLButtonElement | null
  const socialCard = button?.closest('.socialCard') as HTMLElement | null
  if (!button || !socialCard) return

  socialCard.setAttribute('data-mobile-expanded', 'true')
  button.setAttribute('aria-expanded', 'true')
  button.hidden = true
}

// Note: This file was copied to src/sections/social/SocialSection.ts 
export const SocialCard = (
  SocialData: SocialPresentation,
  viewerMode: ViewerMode
): TemplateResult => {
  void viewerMode

  const accounts = (SocialData.accounts || []).filter(isRenderableAccount)
  const hiddenAccountsCount = Math.max(0, accounts.length - MAX_VISIBLE_SOCIAL_ACCOUNTS_MOBILE)

  if (accounts.length) {

    return html`
      <section
        class="socialCard"
        aria-labelledby="social-card-title"
        data-testid="social-media"
        data-mobile-expanded="${hiddenAccountsCount > 0 ? 'false' : 'true'}"
      >
        <nav aria-label="Social media profiles">
          <ul class="socialList list-reset" role="list">
            ${accounts.map(account => renderAccount(account))}
          </ul>
        </nav>
        ${hiddenAccountsCount > 0
          ? html`
              <button
                type="button"
                class="socialCard__more-button"
                aria-controls="social-media"
                aria-expanded="false"
                @click=${expandSocialAccounts}
              >
                ${hiddenAccountsCount} more
              </button>
            `
          : html``}
      </section>
    `
  }

  return html``

  function renderAccount(account) {
    return html`
      <li class="socialItem" role="listitem">
        <a 
          href="${account.homepage}" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Visit ${account.name} profile (opens in new tab)"
        >
          <img 
            class="socialIcon" 
            src="${account.icon}" 
            alt="${account.name} icon"
            width="40"
            height="40"
            loading="lazy"
          />
        </a>
      </li>
    `
  }

}
