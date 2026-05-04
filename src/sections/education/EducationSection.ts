import { html } from 'lit-html'
import 'solid-ui/components/actions/button'
import { EducationDetails } from './types'
import { ViewerMode } from '../../types'
import '../../styles/EducationSection.css'
import { educationHeadingText } from '../../texts'
import { LiveStore, NamedNode } from 'rdflib'
import { createEducationEditDialog } from './EducationEditDialog'
import {
  scheduleDescriptionOverflowCheck,
  toMonthDateTime,
  toggleDescription,
} from '../shared/sectionCardHelpers'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'
import { editIcon } from '../../icons-svg/profileIcons'

function formatEducationMonthYearFull(date?: string): string {
  if (!date) return ''
  const value = date
  const year = value.slice(0, 4)
  const month = value.slice(5, 7)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthIndex = Number(month) - 1

  if (!year || monthIndex < 0 || monthIndex > 11) return value
  return `${monthNames[monthIndex]} ${year}`
}

function renderEducationEntry(educationEntry: EducationDetails, index: number) {
  if (!educationEntry) return html``
  const schoolId = `school-title-${index}`
  const educationPeriodId = `education-period-${index}`
  const educationOrgId = `education-org-${index}`
  const educationDescriptionId = `education-description-${index}`

  const ariaDescribedBy = educationEntry.description
    ? `${educationPeriodId} ${educationOrgId} ${educationDescriptionId}`
    : `${educationPeriodId} ${educationOrgId}`

  return html`
    <li class="education-card__item" role="listitem" aria-labelledby=${schoolId} aria-describedby=${ariaDescribedBy}>
      <div class="education-card__header">
        <h4 id=${schoolId}>${educationEntry.school}</h4>
        <p id=${educationPeriodId} class="education-card__period">
          ${educationEntry.endDate
            ? html`<time datetime=${toMonthDateTime(educationEntry.endDate)}>${formatEducationMonthYearFull(educationEntry.endDate)}</time>`
            : html`<span>End date unknown</span>`}
        </p>
      </div>
      <p class="education-card__organization" id=${educationOrgId}>
        <strong>${educationEntry.degree}</strong>${educationEntry.location ? html` | ${educationEntry.location}` : ''}
      </p>
      ${educationEntry.description ? html`
        <div class="education-card__description-wrap">
          <p class="education-card__description-text" id=${educationDescriptionId}>${educationEntry.description}</p>
          <solid-ui-button
            type="button"
            variant="secondary"
            size="sm"
            label="...more"
            class="education-card__description-toggle"
            aria-controls=${educationDescriptionId}
            aria-expanded="false"
            hidden
            @click=${toggleDescription}
          >
            ...more
          </solid-ui-button>
        </div>
      ` : ''}
    </li>
  `
}

function renderEducation(educationData: EducationDetails[]) {
  if (!educationData || !educationData.length) return html``
  return html`${educationData.map((educationEntry, index) => renderEducationEntry(educationEntry, index))}`
}

export const EducationCard = (
  educationData: EducationDetails[]
) => {
  const hasEducation = Array.isArray(educationData) && educationData.length > 0
  if (!hasEducation) return html``

  return html`
    <article class="education-card" aria-label="Education" data-testid="education">
      <section class="education-card__section">
        <ul role="list" aria-label="Education in chronological order">
          ${renderEducation(educationData)}
        </ul>
      </section>
    </article>
  `
}

export function renderEducationSection(
  store: LiveStore,
  subject: NamedNode,
  educationData: EducationDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  scheduleDescriptionOverflowCheck()

  const educationCard = EducationCard(educationData)
  const educationDetails: EducationDetails[] = educationData || []
  const hasEducation = educationDetails && educationDetails.length > 0
  const showSection = true
  const isOwner = viewerMode === 'owner'

  return showSection ? html`
    <section 
      aria-labelledby="education-heading" 
      class="profile__section border-lighter profile-section-collapsible profile-section-collapsible--inline-mobile-actions"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="education-heading" tabindex="-1">${educationHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          ${isOwner ? html`
            <solid-ui-button
              type="button"
              variant="secondary"
              size="sm"
              class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
              aria-label="Edit education details"
              @click=${(event: Event) => createEducationEditDialog(event, store, subject, educationDetails, viewerMode, onSaved)}
            >
              <span class="profile-section-collapsible__edit-label">${editIcon} Edit</span>
              <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
            </solid-ui-button>
          ` : html``}
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            class="inline-flex-row justify-center"
            aria-label="Toggle education section"
            aria-controls="education-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="education-panel" class="profile-section-collapsible__content" aria-hidden="true" hidden>
        ${hasEducation ? educationCard : html`<p>No education details added yet.</p>`}
      </div>
    </section>
  ` : ''
}
