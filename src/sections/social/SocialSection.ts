import { html, TemplateResult } from 'lit-html'
import 'solid-ui/components/actions/button'
import { Account, SocialPresentation } from './types'
import { ViewerMode } from '../../types'
import '../../styles/SocialSection.css'
import { socialAccountsHeadingText } from '../../texts'
import { createSocialEditDialog } from './SocialEditDialog'
import { LiveStore, NamedNode } from 'rdflib'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'
import { addIcon, editIcon, globeIcon } from '../../icons-svg/profileIcons'

const MAX_VISIBLE_SOCIAL_ACCOUNTS_MOBILE = 10

function isRenderableAccount(account: Account): boolean {
  return Boolean(account?.homepage && account?.name && account?.icon)
}

function expandSocialAccounts(event: Event): void {
  const button = event.currentTarget as HTMLButtonElement | null
  const socialCard = button?.closest('.social-card') as HTMLElement | null
  if (!button || !socialCard) return

  socialCard.setAttribute('data-mobile-expanded', 'true')
  button.setAttribute('aria-expanded', 'true')
  button.hidden = true
}

export const SocialCard = (
  SocialData: SocialPresentation,
  _viewerMode: ViewerMode
): TemplateResult => {
  const accounts = (SocialData.accounts || []).filter(isRenderableAccount)
  const hiddenAccountsCount = Math.max(0, accounts.length - MAX_VISIBLE_SOCIAL_ACCOUNTS_MOBILE)

  if (accounts.length) {

    return html`
      <section
        id="social-media"
        class="social-card"
        aria-label="Social media"
        SocialData: SocialPresentation
      >
        <nav aria-label="Social media profiles">
          <ul class="social-card__list list-reset flex-row flex-wrap justify-start" role="list">
            ${accounts.map(account => renderAccount(account))}
          </ul>
        </nav>
        ${hiddenAccountsCount > 0
          ? html`
              <solid-ui-button
                type="button"
                variant="secondary"
                size="sm"
                label=${`${hiddenAccountsCount} more`}
                class="social-card__more-button"
                aria-controls="social-media"
                aria-expanded="false"
                @click=${expandSocialAccounts}
              >
                ${hiddenAccountsCount} more
              </solid-ui-button>
            `
          : html``}
      </section>
    `
  }

  return html``

  function renderAccount(account: Account) {
    return html`
      <li class="social-card__item flex-row align-center" role="listitem">
        <a 
          class="social-card__link flex-row align-center"
          href="${account.homepage}" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Visit ${account.name} profile (opens in new tab)"
        >
          <img 
            class="social-card__icon" 
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

function renderSocialSectionContent(
  socialData: SocialPresentation,
  viewerMode: ViewerMode
) {
  const hasAccounts = socialData.accounts && socialData.accounts.length > 0

  return html`
    ${hasAccounts ? SocialCard(socialData, viewerMode) : html`<p>No social accounts added yet.</p>`}
  `
}

function renderSocialSectionDefault(
  store: LiveStore, 
  subject: NamedNode, 
  socialData: SocialPresentation, 
  viewerMode: ViewerMode, 
  onSaved?: () => Promise<void> | void) {
  // const hasAccounts = socialData.accounts && socialData.accounts.length > 0
  const showSection = true
  const isOwner = viewerMode === 'owner'

  const handleEdit = (event: Event) => {
    return createSocialEditDialog(
      event,
      store,
      subject,
      socialData.accounts,
      viewerMode,
      onSaved
    )
  }
  return showSection ? html`
        <section 
          aria-labelledby="social-heading" 
          class="profile__section border-lighter profile-section-collapsible profile-section-collapsible--inline-mobile-actions" 
          role="region"
          tabindex="-1"
          data-expanded="false"
        >
          <header class="profile__section-header profile-section-collapsible__header">
            <h2 id="social-heading" tabindex="-1">${socialAccountsHeadingText}</h2>
            <div class="profile-section-collapsible__actions flex-column align-end">
              ${isOwner ? html`
                <solid-ui-button
                  type="button"
                  variant="secondary"
                  size="sm"
                  class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
                  aria-label="Edit social accounts"
                  @click=${handleEdit}
                >
                  <span class="profile-section-collapsible__edit-label">${editIcon} Edit</span>
                  <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
                </solid-ui-button>
              ` : html``}
              <solid-ui-button
                type="button"
                variant="icon"
                size="sm"
                class="inline-flex-row justify-center"
                aria-label="Toggle social accounts section"
                aria-controls="social-panel"
                aria-expanded="false"
                @click=${toggleCollapsibleSection}
              >
                <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
              </solid-ui-button>
            </div>
          </header>
          <div id="social-panel" class="profile-section-collapsible__content" aria-hidden="true" hidden>
            ${renderSocialSectionContent(socialData, viewerMode)}
          </div>
        </section>
      ` : html``
}

function renderOwnerEmptySocialContent(
  _store: LiveStore,
  _subject: NamedNode,
  _socialData: SocialPresentation,
  _viewerMode: ViewerMode,
  _onSaved?: () => Promise<void> | void
) {
  return html`
      <div class="profile__empty-state-content flex-column-center" role="group" aria-label="Empty social accounts section">
        <div class="social__empty-icon-wrapper">
          <span class="social__empty-icon inline-flex-row">${globeIcon}</span>
        </div>
        <p class="profile__empty-state-message social__empty-message">
            No social media links added yet.
        </p>
      </div>
  `
}

function renderOwnerEmptySocialSection(
  store: LiveStore,
  subject: NamedNode,
  socialData: SocialPresentation,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="social-heading" 
      data-profile-section="social"
      class="profile__section--empty border-lighter flex-column-center rounded-md gap-lg profile-section-collapsible profile-section-collapsible--inline-mobile-actions" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="social-heading" tabindex="-1">${socialAccountsHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          <solid-ui-button
            type="button"
            variant="secondary"
            size="sm"
            class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
            aria-label="Add social accounts"
            @click=${(event: Event) => {
              return createSocialEditDialog(
                event,
                store,
                subject,
                socialData.accounts,
                viewerMode,
                onSaved
              )
            }}
          >
            <span class="profile-section-collapsible__edit-label profile__add-more-content">
              <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
              <span>Add Account</span>
            </span>
            <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
          </solid-ui-button>
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            class="inline-flex-row justify-center"
            aria-label="Toggle social accounts section"
            aria-controls="social-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="social-panel" class="profile-section-collapsible__content" aria-hidden="true" hidden>
        ${renderOwnerEmptySocialContent(store, subject, socialData, viewerMode, onSaved)}
      </div>
    </section>
  `
}

export function renderSocialSection(
  store: LiveStore,
  subject: NamedNode,
  socialData: SocialPresentation,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const safeSocialData: SocialPresentation = socialData || { accounts: [] }
  const hasAccounts = Array.isArray(safeSocialData.accounts) && safeSocialData.accounts.length > 0
  const showOwnerEmptyAccounts = !hasAccounts && viewerMode === 'owner'
  const showSection = true
    
  return showSection ? html`
    ${showOwnerEmptyAccounts
      ? renderOwnerEmptySocialSection(store, subject, safeSocialData, viewerMode, onSaved)
      : renderSocialSectionDefault(store, subject, safeSocialData, viewerMode, onSaved)}
  ` : ''
}
