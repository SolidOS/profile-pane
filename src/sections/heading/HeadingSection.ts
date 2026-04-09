import { html, nothing } from 'lit-html'
import '../../styles/HeadingSection.css'
import { ProfileDetails } from './types'
import { addMeToYourFriendsDiv } from '../../addMeToYourFriends'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { createHeadingEditDialog } from './HeadingEditDialog'
import { toText } from '../../textUtils'
import { toDisplayDateDMY } from './dateHelpers'

export const renderHeadingSection = (
  context: DataBrowserContext,
  subject: NamedNode,
  profileData: ProfileDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) => {
  const { name, pronouns, jobTitle, dateOfBirth, location, primaryPhone, primaryEmail, imageSrc } = profileData
  
  const phoneValue = toText(primaryPhone?.valueNode).replace(/^tel:/i, '')
  const emailValue = toText(primaryEmail?.valueNode).replace(/^mailto:/i, '')
  const dateOfBirthDisplay = toDisplayDateDMY(toText(dateOfBirth), 'DD-MM-YYYY')
 
  return html`
      <section class="profile__section flex-row section-bg border-slate" aria-labelledby="profile-name">
        <div class="inline-flex-row">
          <div class="profile__avatar">  
            ${Image(imageSrc, name)}
          </div>
          <div class="profile__info flex-column gap-lg">
            <header class="profile__header-bar mb-md">
              <div class="profile__identity" role="group" aria-label="Name and pronouns">
                <h1 id="profile-name" class="profile__name">${name}</h1>
                <span class="profile__pronouns">${pronouns ? `(${pronouns})` : ''}</span>
              </div>
              ${jobTitle ? html`<div class="profile__role-org">${jobTitle}</div>` : nothing}
            </header>
            <div class="profile__details">
              <div class="profile__meta-row flex-row" role="group" aria-label="Additional profile information">
                ${Line(dateOfBirthDisplay, '', '')}
                ${Line(location, '🌐', '')}
              </div>
              <div class="profile__contact-row flex-row" role="group" aria-label="Contact information">
                ${Line(phoneValue, '', '')}
                ${Line(emailValue, '', '')}
              </div>
            </div>
          </div>
        </div>
        ${viewerMode === 'owner'
        ? html`
            <div class="profile__actions profile__heading-actions" aria-label="Profile actions">
              <button
                type="button"
                class="profile__action-button profile__heading-action-button u-profile-action-text"
                aria-label="Add or edit heading information"
                @click=${(event: Event) => {
                  return createHeadingEditDialog(
                    event,
                    context.session.store,
                    subject,
                    profileData,
                    viewerMode,
                    onSaved
                  )
                }}
              >
                <span class="profile__action-icon" aria-hidden="true">✎ Edit</span>
              </button>
            </div>
          `
        : viewerMode ===  'authenticated'   ? html`
          <div class="profile__actions profile__heading-actions" aria-label="Profile actions">
            ${addMeToYourFriendsDiv(subject, context, viewerMode)}
          </div>` : html``}
    </section>
  `
}

const Line = (value, prefix: symbol | string = nothing, label: string = '') =>
  value ? html`
    <div class="profile__item flex-row ${label ? '' : 'profile__item--valueOnly'}">
      ${label ? html`<span class="profile__label">${label}</span>` : nothing}
      <span class="profile__value">
        ${prefix ? html`<span aria-hidden="true">${prefix}</span>` : nothing}
        ${value}
      </span>
    </div>
  ` : nothing

export const Image = (src, alt) =>
  src
    ? html`
        <img
          class="profile__hero"
          src=${src}
          alt="${alt}"
          width="140"
          height="140"
          loading="eager"
        />
      `
    : html`
        <div class="profile__hero-alt" role="img" aria-label="${alt}" tabindex="0">
          ${alt}
        </div>
      `
