import { html } from 'lit-html'
import { strToUpperCase } from '../../textUtils'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import { createSkillsEditDialog } from './SkillsEditDialog'
import { SkillDetails, SkillRow } from './types'
import { addIcon, deleteIcon, lighteningIcon, plusIcon } from '../../icons-svg/profileIcons'
import { skillsHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'
import { processSkillsMutations } from './mutations'

function renderSkillItem(
  detail: SkillDetails,
  store: LiveStore,
  subject: NamedNode,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  if (!detail) return html``

  const handleRemove = async (event: Event) => {
    event.preventDefault()
    if (viewerMode !== 'owner') return

    const removeRow: SkillRow = {
      name: detail.name,
      publicId: detail.publicId,
      entryNode: detail.entryNode.value,
      status: 'deleted'
    }

    await processSkillsMutations(store, subject, {
      create: [],
      update: [],
      remove: [removeRow]
    })

    if (onSaved) {
      await onSaved()
    }
  }

  return html`
    <li class="skills__item inline-flex-row" role="listitem">
      <span class="skills__item-label">${strToUpperCase(detail.name)}</span>
      ${viewerMode === 'owner'
        ? html`
            <button
              type="button"
              class="skills__remove-button inline-flex-row"
              aria-label="Remove ${detail.name} skill"
              @click=${handleRemove}
            >
              ${deleteIcon}
            </button>
          `
        : ''}
    </li>
  `
}

function renderSkillsSectionDefault(store: LiveStore, subject: NamedNode, skills: SkillDetails[], viewerMode: ViewerMode, onSaved?: () => Promise<void> | void) {
  const hasSkills = Array.isArray(skills) && skills.length > 0

  return html`
    <section
      class="profile__section border-lighter profile-section-collapsible"
      aria-labelledby="skills-heading"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="skills-heading">${skillsHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column">
          <button
            type="button"
            class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
            aria-label="Add or edit skills"
            @click=${(event: Event) => createSkillsEditDialog(event, store, subject, skills, viewerMode, onSaved)}
          >
            <span class="profile-section-collapsible__edit-label profile__add-more-content inline-flex-row">
              <span class="profile__add-more-icon inline-flex-row" aria-hidden="true">${addIcon}</span>
              Add More
            </span>
            <span class="profile-section-collapsible__edit-icon profile-section-collapsible__edit-icon--add" aria-hidden="true">${plusIcon}</span>
          </button>
          <button
            type="button"
            class="inline-flex-row"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div
        id="skills-panel"
        class="profile-section-collapsible__content"
        aria-hidden="true"
      >
        ${hasSkills
          ? html`
              <ul class="skills__list flex-column" role="list" aria-label="Professional skills and competencies">
                ${skills.map((detail) => renderSkillItem(detail, store, subject, viewerMode, onSaved))}
              </ul>
            `
          : html`<p>No skills added yet.</p>`}
      </div>
    </section>
  `
}

function renderOwnerEmptySkillsContent(
  store: LiveStore,
  subject: NamedNode,
  skills: SkillDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="skills-heading" tabindex="-1">${skillsHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column">
          <button
            type="button"
            class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
            aria-label="Add skills"
            @click=${(event: Event) => {
              return createSkillsEditDialog(
                event,
                store,
                subject,
                skills,
                viewerMode,
                onSaved
              )
            }}>
            <span class="profile-section-collapsible__edit-label profile__add-more-content inline-flex-row">
              <span class="profile__add-more-icon inline-flex-row" aria-hidden="true">${addIcon}</span>
              Add Skills
            </span>
            <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${addIcon}</span>
          </button>
          <button
            type="button"
            class="inline-flex-row"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div class="profile__empty-state-content flex-column-center" role="group" aria-label="Empty skills section">    
        <div class="skills__empty-icon-wrapper">
          <span class="skills__empty-icon inline-flex-row">${lighteningIcon}</span>
        </div>
        <p class="profile__empty-state-message skills__empty-message">
            No skills added yet.
        </p>
      </div>
  `
}

function renderOwnerEmptySkillsSection(
  store: LiveStore,
  subject: NamedNode,
  skills: SkillDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="skills-heading" 
      data-profile-section="skills"
      class="profile__section--empty border-lighter flex-column-center rounded-md gap-lg" 
      role="region"
      tabindex="-1"
    >
      ${renderOwnerEmptySkillsContent(store, subject, skills, viewerMode, onSaved)}
    </section>
  `
}

export function renderSkillsSection(
  store: LiveStore,
  subject: NamedNode,
  skills: SkillDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const safeSkills: SkillDetails[] = skills || []
  const hasSkills = Array.isArray(safeSkills) && safeSkills.length > 0
  const showOwnerEmptySkills = !hasSkills && viewerMode === 'owner'
  const showSection = true
    
  return showSection ? html`
    ${showOwnerEmptySkills
      ? renderOwnerEmptySkillsSection(store, subject, safeSkills, viewerMode, onSaved)
      : renderSkillsSectionDefault(store, subject, safeSkills, viewerMode, onSaved)}
  ` : ''
}
