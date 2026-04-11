import { html } from 'lit-html'
import { BioDetails } from './types'
import { ViewerMode } from '../../types'
import '../../styles/BioSection.css'
import { bioHeadingText } from '../../texts'
import { LiveStore, NamedNode } from 'rdflib'
import {
  scheduleDescriptionOverflowCheck,
  toggleDescription
} from '../shared/sectionCardHelpers'
import { createBioEditDialog } from './BioEditDialog'
import { plusDarkIcon } from '../../icons-svg/profileIcons'

function renderBio(bioData: BioDetails) {
  if (!bioData) return html``

  const bioDescriptionId = 'bio-description'

  return html`
      ${bioData.description ? html`
        <div class="bioDescriptionWrap">
          <p class="bioDescriptionText" id=${bioDescriptionId}>${bioData.description}</p>
          <button
            type="button"
            class="bioDescriptionToggle"
            aria-controls=${bioDescriptionId}
            aria-expanded="false"
            hidden
            @click=${toggleDescription}
          >
            ...more
          </button>
        </div>
      ` : ''}
  `
}

function hasBioContent(bioData: BioDetails): boolean {
  return Boolean((bioData?.description || '').trim())
}


export const BioCard = (
  bioData: BioDetails,
  viewerMode: ViewerMode
) => {
  void viewerMode

  return html`
    <article class="bioCard" aria-label="Bio" data-testid="bio-card">
      <section class="bioSection">
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
  const bio = BioCard(bioData, viewerMode)
  const bioDetails: BioDetails = bioData
  
  return html`
    <header class="profile__section-header mb-md">
      <h2 id="bio-heading" tabindex="-1">${bioHeadingText}</h2>
      <button
        type="button"
        class="profile__action-button u-profile-action-text"
        aria-label="Edit bio details"
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
        <span class="profile__action-icon" aria-hidden="true">✎ Edit</span>
      </button>
    </header>
    ${bio}
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
      class="section-bg" 
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
    <header class="profile__section-header--empty mb-md">
      <h2 id="bio-heading" tabindex="-1">${bioHeadingText}</h2>
    </header>
    <p>You haven't added any professional experience yet. Adding work history can boost your Bio.</p>
    <button
      type="button"
      class="profile__action-button--empty"
      aria-label="Add bio details"
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
      <span class="profile__action-icon" aria-hidden="true">${plusDarkIcon} Add Bio</span>
    </button>

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
      class="profile__section--empty flex-column-center section-bg" 
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
  // testing const showOwnerEmptyBio = true 
  const showSection = true
  

  return showSection ? html`
    ${showOwnerEmptyBio
      ? renderOwnerEmptyBioSection(store, subject, bioData, viewerMode, onSaved)
      : renderBioSectionDefault(store, subject, bioData, viewerMode, onSaved)}
  ` : ''
}
