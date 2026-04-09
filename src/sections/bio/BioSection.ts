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
  const hasBio = hasBioContent(bioData)

  return html`
    <header class="profile__section-header mb-md">
      <h2 id="bio-heading" tabindex="-1">${bioHeadingText}</h2>
      ${viewerMode === 'owner'
        ? html`
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
          `
        : html``}
    </header>
    <div>
      ${hasBio ? bio : html`<p>No bio details added yet.</p>`}
    </div>
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
  const showSection = hasBio || viewerMode === 'owner'

  return showSection ? html`
    <section 
      aria-labelledby="bio-heading" 
      data-profile-section="bio"
      class="section-bg" 
      role="region"
      tabindex="-1"
    >
      ${renderBioSectionContent(store, subject, bioData, viewerMode, onSaved)}
    </section>
  ` : ''
}
