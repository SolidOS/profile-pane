import { html } from 'lit-html'
import 'solid-ui/components/actions/button'
import { strToUpperCase } from '../../textUtils'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import '../../styles/SkillsSection.css'
import { createSkillsEditDialog } from './SkillsEditDialog'
import { SkillDetails, SkillRow } from './types'
import { addIcon, deleteIcon, editIcon, lighteningIcon } from '../../icons-svg/profileIcons'
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
    <li class="skills__item" role="listitem">
      <span class="skills__item-label">${strToUpperCase(detail.name)}</span>
      ${viewerMode === 'owner'
        ? html`
            <span class="skills__item-tail inline-flex-row">
              <solid-ui-button
                type="button"
                variant="icon"
                size="sm"
                label=${`Remove ${detail.name} skill`}
                class="skills__remove-button"
                aria-label="Remove ${detail.name} skill"
                @click=${handleRemove}
              >
                <span slot="icon" aria-hidden="true">${deleteIcon}</span>
              </solid-ui-button>
            </span>
          `
        : ''}
    </li>
  `
}

function renderSkillsSectionDefault(store: LiveStore, subject: NamedNode, skills: SkillDetails[], viewerMode: ViewerMode, onSaved?: () => Promise<void> | void) {
  const hasSkills = Array.isArray(skills) && skills.length > 0
  const isOwner = viewerMode === 'owner'

  return html`
    <section
      class="profile__section border-lighter profile-section-collapsible profile-section-collapsible--inline-mobile-actions"
      aria-labelledby="skills-heading"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="skills-heading">${skillsHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          ${isOwner ? html`
            <solid-ui-button
              type="button"
              variant="secondary"
              size="sm"
              class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
              aria-label="Add or edit skills"
              @click=${(event: Event) => createSkillsEditDialog(event, store, subject, skills, viewerMode, onSaved)}
            >
              <span class="profile-section-collapsible__edit-label profile__add-more-content">
                <span class="profile__add-more-inline">
                  <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
                  <span>Add More</span>
                </span>
              </span>
              <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
            </solid-ui-button>
          ` : html``}
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            label="Toggle skills section"
            class="inline-flex-row justify-center"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div
        id="skills-panel"
        class="profile-section-collapsible__content"
        aria-hidden="true"
        hidden
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
  _store: LiveStore,
  _subject: NamedNode,
  _skills: SkillDetails[],
  _viewerMode: ViewerMode,
  _onSaved?: () => Promise<void> | void
) {
  return html`
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
      class="profile__section--empty border-lighter rounded-md gap-lg profile-section-collapsible profile-section-collapsible--inline-mobile-actions" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="skills-heading" tabindex="-1">${skillsHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          <solid-ui-button
            type="button"
            variant="secondary"
            size="sm"
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
            }}
          >
            <span class="profile-section-collapsible__edit-label profile__add-more-content">
              <span class="profile__add-more-inline">
                <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
                <span>Add Skills</span>
              </span>
            </span>
            <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
          </solid-ui-button>
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            label="Toggle skills section"
            class="inline-flex-row justify-center"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="skills-panel" class="profile-section-collapsible__content" aria-hidden="true" hidden>
        ${renderOwnerEmptySkillsContent(store, subject, skills, viewerMode, onSaved)}
      </div>
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
