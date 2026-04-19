import { html, nothing, TemplateResult } from 'lit-html'
import '../../src/styles/FriendPane.css'
import { ProfileDetails } from './types'
import { toText } from '../../src/textUtils'
import { toDisplayDateDMY } from '../../src/sections/heading/dateHelpers'
import { birthdayIcon, locationIcon, personInCircleIcon } from '../../src/icons-svg/profileIcons'

export const renderHeadingSection = (
  profileData: ProfileDetails
) => {
  const { name, pronouns, jobTitle, birthdate, location, imageUrl } = profileData
  
  const dateOfBirthDisplay = toDisplayDateDMY(toText(birthdate), 'DD-MM-YYYY')
 
  return html`
      <section class="profile__section border-lighter" aria-labelledby="profile-name">
        <div class="profile__heading-top">
          <div class="profile__avatar">
            ${Image(imageUrl, name)}
          </div>
          <div class="profile__info">
            <header class="profile__header-bar mb-md">
              <div class="profile__identity" role="group" aria-label="Name and pronouns">
                <h1 id="profile-name" class="profile__name">${name}</h1>
                <span class="profile__pronouns">${pronouns ? `(${pronouns})` : ''}</span>
              </div>
              ${jobTitle ? html`<div class="profile__role-org">${jobTitle}</div>` : nothing}
            </header>
          </div>
          <div class="profile__details">
            <div class="profile__meta-row" role="group" aria-label="Additional profile information">
              ${Line(dateOfBirthDisplay, birthdayIcon, '')}
              ${Line(location, locationIcon, '')}
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
        <div class="profile__hero-alt flex-center" role="img" aria-label="${alt}" tabindex="0">
          <span class="profile__hero-icon">${personInCircleIcon}</span>
        </div>
      `
