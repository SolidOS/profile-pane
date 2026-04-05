import { html, nothing, render } from 'lit-html'
import '../../styles/ProfileCard.css'
import { ProfileDetails } from './types'
import { addMeToYourFriendsDiv } from '../../addMeToYourFriends'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { createIntroEditDialog } from './IntroEditDialog'
import { toText } from '../../textUtils'
import { presentProfile } from './selectors'


export const renderIntroSection = (context: DataBrowserContext, subject: NamedNode, profileData: ProfileDetails, viewerMode: ViewerMode) => {

  const refreshIntroSection = async (hostSection: HTMLElement | null) => {
    if (!hostSection) return

    try {
      await context.session.store.fetcher.load(subject.doc(), { force: true } as any)
    } catch {
      // Best-effort refresh; render from current store if fetch reload fails.
    }

    const nextProfile = presentProfile(subject, context.session.store)
    render(renderIntroSection(context, subject, nextProfile, viewerMode), hostSection)
  }

  const phoneValue = toText(profileData.primaryPhone.valueNode).replace(/^tel:/i, '')
  const emailValue = toText(profileData.primaryEmail.valueNode).replace(/^mailto:/i, '')
  return html`
      <section class="introSection section-bg" aria-labelledby="intro-heading">
        <header class="introSectionHeader mb-md">
          ${Image(profileData.imageSrc, profileData.name)}
        </header>
        <div class="introDetails">
          <div class="introDetailsHeader">
            <h2 id="profile-name">${profileData.name}</h2>
            <p>${profileData.pronouns ? `(${profileData.pronouns})` : ''}</p>
          </div>
          <h4>${profileData.jobTitle}</h4>
          <div class="introDetailsRow">
            ${Line(profileData.dateOfBirth, '', 'Date of Birth')}
            ${Line(profileData.location, '🌐', 'Location')}
          </div>
          <div class="introDetailsRow" aria-label="Contact information">
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
                const hostSection = (event.currentTarget as HTMLElement | null)?.closest('section') as HTMLElement | null
                return createIntroEditDialog(
                  event,
                  context.session.store,
                  subject,
                  profileData,
                  viewerMode,
                  async () => refreshIntroSection(hostSection)
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
    <div class="details" role="text" ${label ? `aria-label="${label}: ${value}"` : ''}>
      ${prefix} ${value}
    </div>
  ` : nothing

export const Image = (src, alt) =>
  src
    ? html`
        <img
          class="image"
          src=${src}
          alt="Profile photo of ${alt}"
          width="160"
          height="160"
          loading="eager"
        />
      `
    : html`
        <div class="image-alt" role="img" aria-label="${alt}" tabindex="0">
          ${alt}
        </div>
      `
