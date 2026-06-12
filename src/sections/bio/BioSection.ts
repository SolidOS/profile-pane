import { html } from 'lit-html'
import 'solid-ui/components/button'
import { BioDetails } from './types'
import { ViewerMode } from '../../types'
import './BioSection.css'
import { bioHeadingText } from '../../texts'
import { LiveStore, NamedNode } from 'rdflib'
import {
  scheduleDescriptionOverflowCheck,
  toggleDescription
} from '../shared/sectionCardHelpers'
import { createBioEditDialog } from './BioEditDialog'
import { editIcon, plusDarkIcon } from '../../icons-svg/profileIcons'

function renderBio(bioData: BioDetails) {
  if (!bioData) return html``

  const bioDescriptionId = 'bio-description'

  return html`
      ${bioData.description ? html`
        <div class="bio-card__description-wrap">
          <p class="bio-card__description-text" id=${bioDescriptionId}>${bioData.description}</p>
          <solid-ui-button
            variant="tertiary"
            class="bio-card__description-toggle"
            aria-controls=${bioDescriptionId}
            aria-expanded="false"
            hidden
            @click=${toggleDescription}
          >
            ...more
          </solid-ui-button>
        </div>
      ` : ''}
  `
}

function hasBioContent(bioData: BioDetails): boolean {
  return Boolean((bioData?.description || '').trim())
}


export const BioCard = (
  bioData: BioDetails
) => {
  return html`
    <article class="bio-card" aria-label="Bio" data-testid="bio-card">
      <section class="bio-card__section">
        ${renderBio(bioData)}
      </section>
    </article>
  `
}

function renderBioSectionContent(
  store: LiveStore,
  subject: NamedNode,
  bioData: BioDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const bio = BioCard(bioData)
  const bioDetails: BioDetails = bioData
  const isOwner = viewerMode === 'owner'
  
  return html`
    <header class="profile__section-header profile-section-collapsible__header">
      <h2 id="bio-heading" tabindex="-1">${bioHeadingText}</h2>
      ${isOwner
        ? html`
            <solid-ui-button
              variant="tertiary"
              class="profile-section-collapsible__edit-button"
              @click=${(event: Event) => {
                return createBioEditDialog(
                  event,
                  store,
                  subject,
                  bioDetails,
                  viewerMode,
                  onSaved
                )
              }}
            >
              <span slot="icon" class="profile-section-collapsible__edit-icon profile__action-icon" aria-hidden="true">${editIcon}</span>
              <span slot="left-icon" class="profile-section-collapsible__edit-label profile__action-icon">${editIcon}</span>
              <span class="profile-section-collapsible__edit-label  profile__action-icon">Edit</span>
            </solid-ui-button>
          `
        : html``}
    </header>
    <div class="profile-section-collapsible__content">
      ${bio}
    </div>
  `
}

function renderBioSectionDefault(
  store: LiveStore,
  subject: NamedNode,
  bioData: BioDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="bio-heading" 
      data-profile-section="bio"
      class="profile__section" 
      role="region"
      tabindex="-1"
    >
      ${renderBioSectionContent(store, subject, bioData, viewerMode, onSaved)}
    </section>
  `
}

function renderOwnerEmptyBioContent(
  store: LiveStore,
  subject: NamedNode,
  bioData: BioDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const bioDetails: BioDetails = bioData

  return html`
    <div class="profile__empty-state-content" role="group" aria-label="Empty bio section">
      <h2 id="bio-heading" tabindex="-1">${bioHeadingText}</h2>
      <p class="profile__empty-state-message">
        You haven't added any professional experience yet. Adding work history can boost your Bio.
      </p>
    </div>
    <solid-ui-button
      variant="secondary"
      @click=${(event: Event) => {
        return createBioEditDialog(
          event,
          store,
          subject,
          bioDetails,
          viewerMode,
          onSaved
        )
      }}
    >
      <span slot="icon" class="profile__action-icon" aria-hidden="true">${plusDarkIcon}</span>
      <span class="profile__action-icon">Add Bio</span>
    </solid-ui-button>
  `
}

function renderOwnerEmptyBioSection(
  store: LiveStore,
  subject: NamedNode,
  bioData: BioDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="bio-heading" 
      data-profile-section="bio"
      class="profile__section--empty profile__section--empty-main bio-section--empty" 
      role="region"
      tabindex="-1"
    >
      ${renderOwnerEmptyBioContent(store, subject, bioData, viewerMode, onSaved)}
    </section>
  `
}

export function renderBioSection(
  store: LiveStore,
  subject: NamedNode,
  bioData: BioDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  scheduleDescriptionOverflowCheck()

  const hasBio = hasBioContent(bioData)
  const showOwnerEmptyBio = !hasBio && viewerMode === 'owner'
  const showSection = true
  
  return showSection ? html`
    ${showOwnerEmptyBio
      ? renderOwnerEmptyBioSection(store, subject, bioData, viewerMode, onSaved)
      : renderBioSectionDefault(store, subject, bioData, viewerMode, onSaved)}
  ` : ''
}
