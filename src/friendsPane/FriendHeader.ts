import { html, nothing, TemplateResult } from 'lit-html'
import '../../src/styles/FriendPane.css'
import { ProfileDetails } from './types'
import { toText } from '../../src/textUtils'
import { toDisplayDateDMY } from '../../src/sections/heading/dateHelpers'
import { birthdayIcon, locationIcon, personInCircleIcon } from '../../src/icons-svg/profileIcons'

export const renderHeadingSection = (
  profileData: ProfileDetails
) => {
  const { name, pronouns, jobTitle, location, imageUrl } = profileData
  
  return html`
      <section class="friends-pane__header-section flex-column-center border-lighter" aria-labelledby="profile-name">
        <div class="friends-pane__header-heading-top">
          <div class="friends-pane__header-avatar">
            ${Image(imageUrl, name)}
          </div>
          <div class="friends-pane__header-info">
            <header class="friends-pane__header-bar mb-md">
              <div class="friends-pane__header-identity" role="group" aria-label="Name and pronouns">
                <h1 id="profile-name" class="friends-pane__header-name">${name}</h1>
                <span class="friends-pane__header-pronouns">${pronouns ? `(${pronouns})` : ''}</span>
              </div>
              ${jobTitle ? html`<div class="friends-pane__header-role-org">${jobTitle}</div>` : nothing}
              ${Line(location, locationIcon, '')}
            </header>
          </div>
        </div>
    </section>
  `
}

const Line = (value, prefix: TemplateResult | symbol | string = nothing, label: string = '') =>
  value ? html`
    <div class="friends-pane__header-item ${label ? '' : 'friends-pane__header-item--valueOnly'}">
      ${label ? html`<span class="friends-pane__header-label">${label}</span>` : nothing}
      <span class="friends-pane__header-value">
        ${prefix !== '' && prefix !== nothing ? html`<span class="friends-pane__header-prefix-icon" aria-hidden="true">${prefix}</span>` : nothing}
        <span class="friends-pane__header-value-text">${value}</span>
      </span>
    </div>
  ` : nothing

export const Image = (src, alt) =>
  src
    ? html`
        <img
          class="friends-pane__header-hero"
          src=${src}
          alt="${alt}"
          width="180"
          height="180"
          loading="eager"
        />
      `
    : html`
        <div class="friends-pane__header-hero-alt flex-center" role="img" aria-label="${alt}" tabindex="0">
          <span class="friends-pane__header-hero-icon">${personInCircleIcon}</span>
        </div>
      `
