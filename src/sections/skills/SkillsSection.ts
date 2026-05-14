import { html } from 'lit-html'
import 'solid-ui/components/actions/button'
import { strToUpperCase } from '../../textUtils'
import { LiveStore, NamedNode } from 'rdflib'
import { ViewerMode } from '../../types'
import '../../styles/SkillsSection.css'
import { createSkillsEditDialog } from './SkillsEditDialog'
import { SkillDetails, SkillRow } from './types'
import { addIcon, chevronDownIcon, deleteIcon, editIcon, lighteningIcon } from '../../icons-svg/profileIcons'
import { skillsHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'
import { processSkillsMutations } from './mutations'
import { formatDisplayError } from '../../utils/errorDisplay'

const removeSkillFailedMessageText = 'Unable to remove your skill.'

function setSkillsSectionError(section: HTMLElement, message: string | null): void {
  const errorBox = section.querySelector('.profile-section-inline-error') as HTMLElement | null
  if (!errorBox) return

  if (!message) {
    errorBox.textContent = ''
    errorBox.hidden = true
    errorBox.setAttribute('aria-hidden', 'true')
    return
  }

  errorBox.textContent = message
  errorBox.hidden = false
  errorBox.setAttribute('aria-hidden', 'false')
  errorBox.focus()
}

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
    const removeButton = event.currentTarget as HTMLElement | null
    const skillRow = removeButton?.closest('.skills__item') as HTMLElement | null
    const section = (event.currentTarget as HTMLElement | null)?.closest('[data-profile-section="skills"]') as HTMLElement | null

    const removeRow: SkillRow = {
      name: detail.name,
      publicId: detail.publicId,
      entryNode: detail.entryNode.value,
      status: 'deleted'
    }

    try {
      removeButton?.setAttribute('disabled', '')
      removeButton?.setAttribute('aria-busy', 'true')
      removeButton?.setAttribute('data-loading', 'true')
      skillRow?.setAttribute('data-pending', 'true')
      await processSkillsMutations(store, subject, {
        create: [],
        update: [],
        remove: [removeRow]
      })

      if (section) {
        setSkillsSectionError(section, null)
      }
      if (onSaved) {
        await onSaved()
      }
    } catch (error) {
      if (section) {
        setSkillsSectionError(section, formatDisplayError(error, removeSkillFailedMessageText))
      }
    } finally {
      removeButton?.removeAttribute('disabled')
      removeButton?.setAttribute('aria-busy', 'false')
      removeButton?.removeAttribute('data-loading')
      skillRow?.removeAttribute('data-pending')
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
                class="skills__remove-button"
                aria-label=${`Remove ${detail.name} skill`}
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
      class="profile__section profile-section-collapsible profile-section-collapsible--inline-mobile-actions"
      data-profile-section="skills"
      aria-labelledby="skills-heading"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h3 id="skills-heading">${skillsHeadingText}</h3>
        <div class="profile-section-collapsible__actions">
          ${isOwner ? html`
            <solid-ui-button
              type="button"
              variant="secondary"
              size="sm"
              class="profile__action-button profile-action-text profile-section-collapsible__edit-button"
              aria-label="Add or edit skills"
              @click=${(event: Event) => createSkillsEditDialog(event, store, subject, skills, viewerMode, onSaved)}
            >
              <span class="profile-section-collapsible__edit-label profile__add-more-content">
                <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
                <span>Add More</span>
              </span>
              <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
            </solid-ui-button>
          ` : html``}
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            class="profile-section-collapsible__toggle-button"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">${chevronDownIcon}</span>
          </solid-ui-button>
        </div>
      </header>
      <div
        id="skills-panel"
        class="profile-section-collapsible__content"
      >
        ${hasSkills
          ? html`
              <ul class="skills__list" role="list" aria-label="Professional skills and competencies">
                ${skills.map((detail) => renderSkillItem(detail, store, subject, viewerMode, onSaved))}
              </ul>
              <div
                class="profile-section-inline-error"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                aria-hidden="true"
                tabindex="-1"
                hidden
              ></div>
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
      <div class="profile__empty-state-content" role="group" aria-label="Empty skills section">    
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
      class="profile__section--empty profile-section-collapsible profile-section-collapsible--inline-mobile-actions" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h3 id="skills-heading" tabindex="-1">${skillsHeadingText}</h3>
        <div class="profile-section-collapsible__actions">
          <solid-ui-button
            type="button"
            variant="secondary"
            size="sm"
            class="profile__action-button profile-action-text profile-section-collapsible__edit-button"
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
              <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
              <span>Add More</span>
            </span>
            <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
          </solid-ui-button>
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            class="profile-section-collapsible__toggle-button"
            aria-label="Toggle skills section"
            aria-controls="skills-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">${chevronDownIcon}</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="skills-panel" class="profile-section-collapsible__content">
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
