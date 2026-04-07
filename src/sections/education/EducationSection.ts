import { html } from 'lit-html'
import { EducationDetails } from './types'
import { ViewerMode } from '../../types'
import '../../styles/EducationCard.css'
import { educationHeadingText } from '../../texts'
import { LiveStore, NamedNode } from 'rdflib'
import { createEducationEditDialog } from './EducationEditDialog'
import {
  scheduleDescriptionOverflowCheck,
  toMonthDateTime,
  toggleDescription,
} from '../shared/sectionCardHelpers'

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
    <li class="education" role="listitem" aria-labelledby=${schoolId} aria-describedby=${ariaDescribedBy}>
      <div class="educationHeader">
        <h4 id=${schoolId}>${educationEntry.school}</h4>
        <p id=${educationPeriodId} class="educationPeriod">
          ${educationEntry.endDate
            ? html`<time datetime=${toMonthDateTime(educationEntry.endDate)}>${formatEducationMonthYearFull(educationEntry.endDate)}</time>`
            : html`<span>End date unknown</span>`}
        </p>
      </div>
      <p class="educationOrg" id=${educationOrgId}>
        <strong>${educationEntry.degree}</strong>${educationEntry.location ? html` | ${educationEntry.location}` : ''}
      </p>
      ${educationEntry.description ? html`
        <div class="cvDescriptionWrap">
          <p class="cvDescriptionText" id=${educationDescriptionId}>${educationEntry.description}</p>
          <button
            type="button"
            class="cvDescriptionToggle"
            aria-controls=${educationDescriptionId}
            aria-expanded="false"
            hidden
            @click=${toggleDescription}
          >
            ...more
          </button>
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
  educationData: EducationDetails[],
  viewerMode: ViewerMode
) => {
  void viewerMode
  const hasEducation = Array.isArray(educationData) && educationData.length > 0
  if (!hasEducation) return html``

  return html`
    <article class="educationCard" aria-label="Education" data-testid="education">
      <section class="educationSection">
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

  const educationCard = EducationCard(educationData, viewerMode)
  const educationDetails: EducationDetails[] = educationData || []
  const hasEducation = educationDetails && educationDetails.length > 0
  const showSection = hasEducation || viewerMode === 'owner'

  return showSection ? html`
    <section 
      aria-labelledby="education-heading" 
      class="section-bg" 
      role="region"
      tabindex="-1"
    >
      <header class="sectionHeader mb-md">
        <h3 id="education-heading" tabindex="-1">${educationHeadingText}</h3>
        ${viewerMode === 'owner'
          ? html`
              <button
                type="button"
                class="actionButton"
                aria-label="Edit education details"
                @click=${(event: Event) => createEducationEditDialog(event, store, subject, educationDetails, viewerMode, onSaved)}
              >
                <span class="actionIcon" aria-hidden="true">✎ Edit</span>
              </button>
            `
          : html``}
      </header>
      <div>
        ${hasEducation ? educationCard : html`<p>No education details added yet.</p>`}
      </div>
    </section>
  ` : ''
}
