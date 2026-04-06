import { html, nothing } from 'lit-html'
import '../../styles/HeadingSection.css'
import { ProfileDetails } from './types'
import { addMeToYourFriendsDiv } from '../../addMeToYourFriends'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { createHeadingEditDialog } from './HeadingEditDialog'
import { toText } from '../../textUtils'


export const renderHeadingSection = (context: DataBrowserContext, subject: NamedNode, profileData: ProfileDetails, viewerMode: ViewerMode) => {

  const phoneValue = toText(profileData.primaryPhone?.valueNode || profileData.primaryPhone?.entryNode).replace(/^tel:/i, '')
  const emailValue = toText(profileData.primaryEmail?.valueNode || profileData.primaryEmail?.entryNode).replace(/^mailto:/i, '')
  const roleAndOrg = [profileData.jobTitle, profileData.orgName].filter(Boolean).join(' at ')
  return html`
      <section class="introSection section-bg border-slate" aria-labelledby="intro-heading">
        <header class="introSectionHeader mb-md">
          ${Image(profileData.imageSrc, profileData.name)}
        </header>
        <div class="introDetails">
          <div class="introDetailsHeader">
            <h2 id="profile-name">${profileData.name}</h2>
            <p>${profileData.pronouns ? `(${profileData.pronouns})` : ''}</p>
          </div>
          ${roleAndOrg ? html`<p>${roleAndOrg}</p>` : nothing}
          <div class="introDetailsRow">
            ${Line(profileData.dateOfBirth, '', 'Date of Birth')}
            ${Line(profileData.location, '🌐', 'Location')}
          </div>
          <div class="introDetailsRow" role="group" aria-label="Contact information">
            ${Line(phoneValue, '', 'Phone')}
            ${Line(emailValue, '', 'Email')}
          </div>
        </div>
        ${viewerMode === 'owner'  
        ? html`
            <button
              type="button"
              class="actionButton"
              aria-label="Add or edit intro information"
              @click=${(event: Event) => {
                return createHeadingEditDialog(
                  event,
                  context.session.store,
                  subject,
                  profileData,
                  viewerMode
                )
              }}
            >
              <span class="actionIcon" aria-hidden="true">✎ Edit</span>
            </button>
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
    <div class="details" role="text" aria-label=${label ? `${label}: ${value}` : nothing}>
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
