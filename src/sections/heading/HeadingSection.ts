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
  const { name, pronouns, jobTitle, orgName, dateOfBirth, location, primaryPhone, primaryEmail, imageSrc } = profileData
  
  const phoneValue = toText(primaryPhone?.valueNode).replace(/^tel:/i, '')
  const emailValue = toText(primaryEmail?.valueNode).replace(/^mailto:/i, '')
  const dateOfBirthDisplay = toDisplayDateDMY(toText(dateOfBirth), 'DD-MM-YYYY')
  const roleAndOrg = [jobTitle, orgName].filter(Boolean).join(' at ')

  return html`
      <section class="profile__section flex-row section-bg border-slate" aria-labelledby="profile-name">
      <div>  
        ${Image(imageSrc, name)}
      </div>
      <div class="profile__header-details">
        <header class="profile__header-bar mb-md">
          <div class="profile__header-details-header">
            <h2 id="profile-name">${name}</h2>
            <p>${pronouns ? `(${pronouns})` : ''}</p>
          </div>
          ${roleAndOrg ? html`<p>${roleAndOrg}</p>` : nothing}
        </header>
        <div class="flex-row">
          ${Line(dateOfBirthDisplay, '', 'Date of Birth')}
          ${Line(location, '🌐', 'Location')}
        </div>
        <div class="flex-row" role="group" aria-label="Contact information">
          ${Line(phoneValue, '', 'Phone')}
          ${Line(emailValue, '', 'Email')}
        </div>
      </div>
      ${viewerMode === 'owner'  
      ? html`
          <section class="buttonSection" aria-label="Profile heading actions">
            <button
              type="button"
              class="actionButton"
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
              <span class="actionIcon" aria-hidden="true">✎ Edit</span>
            </button>
          </section>
        `
      : viewerMode ===  'authenticated'   ? html`
        <section class="buttonSection" aria-label="Actions">
          ${addMeToYourFriendsDiv(subject, context, viewerMode)}
        </section>` : html``}
    </section>
  `
}

const Line = (value, prefix: symbol | string = nothing, label: string = '') =>
  value ? html`
    <div class="profile__section-details" role="text" aria-label=${label ? `${label}: ${value}` : nothing}>
      ${prefix} ${value}
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
