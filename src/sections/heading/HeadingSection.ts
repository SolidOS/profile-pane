import { html, nothing, TemplateResult } from 'lit-html'
import 'solid-ui/components/button'
import './HeadingSection.css'
import { ProfileDetails } from './types'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { createHeadingEditDialog } from './HeadingEditDialog'
import { toText } from '../../textUtils'
import { toDisplayDateDMY } from './dateHelpers'
import { birthdayIcon, editIcon, locationIcon, personInCircleIcon } from '../../icons-svg/profileIcons'
import { emailIcon, phoneIcon } from '../../icons-svg/contactIcons'
import { addMeToYourFriendsDiv } from '../../specialButtons/addMeToYourFriends'
import { addMeToYourContactsDiv } from '../../specialButtons/addContact/addMeToYourContacts'
import { resolvePhotoDisplaySrc } from './imageHelpers'

const showHeadingImageFallback = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement | null
  const frame = image?.parentElement
  if (!image || !frame) {
    return
  }

  image.hidden = true
  frame.classList.add('profile__image-frame--fallback')
}

export const renderHeadingSection = async (
  context: DataBrowserContext,
  subject: NamedNode,
  profileData: ProfileDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) => {
  const { name, pronouns, jobTitle, dateOfBirth, location, primaryPhone, primaryEmail, imageSrc } = profileData
  const resolvedImageSrc = await resolvePhotoDisplaySrc(context.session.store, imageSrc)
  const isOwner = viewerMode === 'owner'
  const isAuthenticatedViewer = viewerMode === 'authenticated'
  const contactsButton = isAuthenticatedViewer ? await addMeToYourContactsDiv(subject, context) : nothing
  const friendsButton = isAuthenticatedViewer ? addMeToYourFriendsDiv(subject, context, viewerMode) : nothing
  
  const phoneValue = toText(primaryPhone?.valueNode).replace(/^tel:/i, '')
  const emailValue = toText(primaryEmail?.valueNode).replace(/^mailto:/i, '')
  const dateOfBirthDisplay = toDisplayDateDMY(toText(dateOfBirth), '')
 
  return html`
      <section class="profile__section" data-profile-section="heading" aria-labelledby="profile-name">
        <div class="profile__heading-top">
          <div class="profile__avatar">
            ${Image(resolvedImageSrc, name)}
          </div>
          <div class="profile__info">
            <header class="profile__header-bar">
              <div class="profile__identity" role="group" aria-label="Name and pronouns">
                <h1 id="profile-name" class="profile__name">${name}</h1>
                <span class="profile__pronouns">${pronouns ? `(${pronouns})` : ''}</span>
              </div>
              ${jobTitle ? html`<div class="profile__role-org">${jobTitle}</div>` : nothing}
            </header>
          </div>
          ${isOwner || isAuthenticatedViewer ? html`
                ${isAuthenticatedViewer ? html`
                  <div class="profile__actions profile__heading-actions">
                    ${contactsButton}
                    ${friendsButton}
                  </div>
                ` : nothing}
                ${isOwner ? html`
                  <div class="profile__actions profile__heading-edit-action">
                    <solid-ui-button
                      variant="tertiary"
                      class="profile__heading-action-button profile-section-collapsible__edit-button"
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
                    <span class="profile-section-collapsible__edit-label">${editIcon} Edit</span>
                    <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
                  </solid-ui-button>
                </div>
                ` : nothing}
            ` : nothing}
          <div class="profile__details">
            <div class="profile__meta-row" role="group" aria-label="Additional profile information">
              ${Line(dateOfBirthDisplay, birthdayIcon, '')}
              ${Line(location, locationIcon, '')}
            </div>
            <div class="profile__contact-row" role="group" aria-label="Contact information">
              ${Line(phoneValue, phoneIcon, '')}
              ${Line(emailValue, emailIcon, '')}
            </div>
          </div>
        </div>
    </section>
  `
}

const Line = (value, prefix: TemplateResult | symbol | string = nothing, label: string = '') =>
  value ? html`
    <div class="profile__item ${label ? '' : 'profile__item--valueOnly'}">
      ${label ? html`<span class="profile__label">${label}</span>` : nothing}
      <span class="profile__value">
        ${prefix !== '' && prefix !== nothing ? html`<span class="profile__prefix-icon" aria-hidden="true">${prefix}</span>` : nothing}
        <span class="profile__value-text">${value}</span>
      </span>
    </div>
  ` : nothing

export const Image = (src, alt) => html`
  <div class=${src ? 'profile__image-frame' : 'profile__image-frame profile__image-frame--fallback'}>
    ${src
      ? html`
          <img
            class="profile__hero"
            src=${src}
            alt="${alt}"
            width="140"
            height="140"
            loading="eager"
            @error=${showHeadingImageFallback}
          />
        `
      : nothing}
    <div class="profile__hero-alt" role="img" aria-label="${alt}">
      <span class="profile__hero-icon">${personInCircleIcon}</span>
    </div>
  </div>
`
