import { html, TemplateResult } from 'lit-html'
import { SocialPresentation } from './types'
import { ViewerMode } from '../../types'
import '../../styles/SocialCard.css'
import { socialAccountsHeadingText } from '../../texts'
import { createSocialEditDialog } from './SocialEditDialog'
import { LiveStore, NamedNode } from 'rdflib'

export const SocialCard = (
  SocialData: SocialPresentation,
  viewerMode: ViewerMode
): TemplateResult => {
 
  const { accounts } = SocialData

  if (accounts.length) {

    return html`
      <section
        class="socialCard"
        aria-labelledby="social-card-title"
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
  viewerMode: ViewerMode,
  onEdit?: (event: Event) => void
) {
  const hasAccounts = accounts.accounts && accounts.accounts.length > 0

  return html`
    <header class="mb-md">
      <h3 id="social-heading" tabindex="-1">${socialAccountsHeadingText}</h3>
      ${viewerMode === 'owner' && onEdit
        ? html`
            <button
              type="button"
              class="actionButton"
              aria-label="Edit social accounts"
              @click=${onEdit}
            >
              <span class="actionIcon" aria-hidden="true">✎ Edit</span>
            </button>
          `
        : html``}
    </header>
    <nav aria-label="Social media links">
      ${hasAccounts ? SocialCard(accounts, viewerMode) : html`<p>No social accounts added yet.</p>`}
    </nav>
  `
}

export function renderSocialAccounts(
  store: LiveStore,
  subject: NamedNode,
  accounts: SocialPresentation,
  viewerMode: ViewerMode
) {
  const hasAccounts = accounts.accounts && accounts.accounts.length > 0
  const showSection = hasAccounts || viewerMode === 'owner'

  const handleEdit = (event: Event) => {
    return createSocialEditDialog(
      event,
      store,
      subject,
      accounts.accounts,
      viewerMode
    )
  }

  return showSection ? html`
        <section 
          aria-labelledby="social-heading" 
          class="section-bg" 
          role="complementary"
          tabindex="-1"
        >
          ${renderSocialSectionContent(accounts, viewerMode, handleEdit)}
        </section>
      ` : html``
}
