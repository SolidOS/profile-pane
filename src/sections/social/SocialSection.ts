import { html, TemplateResult } from 'lit-html'
import { SocialPresentation } from './types'
import { ViewerMode } from '../../types'
import '../../styles/SocialCard.css'
import { socialAccountsHeadingText } from '../../texts'
import { createSocialEditDialog } from './SocialEditDialog'
import { LiveStore, NamedNode } from 'rdflib'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

export const SocialCard = (
  SocialData: SocialPresentation,
  viewerMode: ViewerMode
): TemplateResult => {
 
  const { accounts } = SocialData

  if (accounts.length) {

    return html`
      <section
        class="socialCard"
        aria-label="Social media"
        data-testid="social-media"
      >
        <nav aria-label="Social media profiles">
          <ul class="socialList list-reset" role="list">
            ${accounts.map(account => renderAccount(account))}
          </ul>
        </nav>
      </section>
    `
  }

  return html``

  function renderAccount(account) {
    return account.homepage && account.name && account.icon
      ? html`
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
      : html``
  }

}

function renderSocialSectionContent(
  accounts: SocialPresentation,
  viewerMode: ViewerMode
) {
  const hasAccounts = accounts.accounts && accounts.accounts.length > 0

  return html`
    ${hasAccounts ? SocialCard(accounts, viewerMode) : html`<p>No social accounts added yet.</p>`}
  `
}

export function renderSocialAccounts(
  store: LiveStore,
  subject: NamedNode,
  accounts: SocialPresentation,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const hasAccounts = accounts.accounts && accounts.accounts.length > 0
  const showSection = true

  const handleEdit = (event: Event) => {
    return createSocialEditDialog(
      event,
      store,
      subject,
      accounts.accounts,
      viewerMode,
      onSaved
    )
  }

  return showSection ? html`
        <section 
          aria-labelledby="social-heading" 
          class="profileSectionCollapsible section-bg" 
          role="region"
          tabindex="-1"
          data-expanded="false"
        >
          <header class="profile__section-header profileSectionCollapsible__header">
            <h2 id="social-heading" tabindex="-1">${socialAccountsHeadingText}</h2>
            <div class="profileSectionCollapsible__actions">
              <button
                type="button"
                class="profile__action-button u-profile-action-text profileSectionCollapsible__editButton"
                aria-label="Edit social accounts"
                @click=${handleEdit}
              >
                <span class="profileSectionCollapsible__editLabel">✎ Edit</span>
                <span class="profileSectionCollapsible__editIcon" aria-hidden="true">✎</span>
              </button>
              <button
                type="button"
                class="profileSectionCollapsible__toggle"
                aria-label="Toggle social accounts section"
                aria-controls="social-panel"
                aria-expanded="false"
                @click=${toggleCollapsibleSection}
              >
                <span class="profileSectionCollapsible__chevron" aria-hidden="true">⌄</span>
              </button>
            </div>
          </header>
          <div id="social-panel" class="profileSectionCollapsible__content" aria-hidden="true">
            ${renderSocialSectionContent(accounts, viewerMode)}
          </div>
        </section>
      ` : html``
}
