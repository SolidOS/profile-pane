import { html } from 'lit-html'
import 'solid-ui/components/actions/button'
import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import { ViewerMode } from '../../types'
import '../../styles/LanguageSection.css'
import { createLanguageEditDialog } from './LanguageEditDialog'
import { LanguageDetails } from './types'
import { addIcon, commentIcon, editIcon, plusIcon } from '../../icons-svg/profileIcons'
import { languagesHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

function renderLan(language: LanguageDetails, asList = false) {
  if (!language) return html``
  return asList
    ? html`<li class="languages__item-label" role="listitem">${language.name}</li>`
    : html``
}

function renderLanguages(languages: LanguageDetails[], asList = false) {
  if (!languages || !languages.length || !languages[0]) return html``
  return html`${renderLan(languages[0], asList)}${languages.length > 1 ? renderLanguages(languages.slice(1), asList) : html``}`
}

function renderLanguagesSectionDefault(store: LiveStore, subject: NamedNode, languages: LanguageDetails[], viewerMode: ViewerMode, onSaved?: () => Promise<void> | void) {
  
  const hasLanguages = Array.isArray(languages) && languages.length > 0
  const hasLanguageLinks = store.each(subject, ns.schema('knowsLanguage')).length > 0
  const isOwner = viewerMode === 'owner'
  return html`
    <section
      class="profile__section border-lighter profile-section-collapsible profile-section-collapsible--inline-mobile-actions"
      aria-labelledby="languages-heading"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="languages-heading">${languagesHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          ${isOwner ? html`
            <solid-ui-button
              role="button"
              type="button"
              variant="secondary"
              size="sm"
              class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
              aria-label="Add or edit languages"
              @click=${(event: Event) => createLanguageEditDialog(event, store, subject, languages, viewerMode, onSaved)}
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
            role="button"
            type="button"
            variant="icon"
            size="sm"
            label="Toggle languages section"
            class="inline-flex-row justify-center"
            aria-label="Toggle languages section"
            aria-controls="languages-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="languages-panel" class="profile-section-collapsible__content" aria-hidden="true">
        ${hasLanguages
          ? html`
              <ul class="languages__list flex-column" role="list" aria-label="Known languages">
                ${renderLanguages(languages, true)}
              </ul>
            `
          : hasLanguageLinks
            ? html`<p>Language details are missing for one or more entries.</p>`
            : html`<p>No languages added yet.</p>`}
      </div>
    </section>
  `
}

function renderOwnerEmptyLanguagesContent(
  _store: LiveStore,
  _subject: NamedNode,
  _languages: LanguageDetails[],
  _viewerMode: ViewerMode,
  _onSaved?: () => Promise<void> | void
) {
  return html`
      <div class="profile__empty-state-content flex-column-center" role="group" aria-label="Empty languages section">    
        <div class="languages__empty-icon-wrapper">
          <span class="languages__empty-icon inline-flex-row">${commentIcon}</span>
        </div>
        <p class="profile__empty-state-message languages__empty-message">
            No languages added yet.
        </p>
      </div>
  `
}

function renderOwnerEmptyLanguagesSection(
  store: LiveStore,
  subject: NamedNode,
  languages: LanguageDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="languages-heading" 
      data-profile-section="languages"
      class="profile__section--empty border-lighter rounded-md gap-lg profile-section-collapsible profile-section-collapsible--inline-mobile-actions" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="languages-heading" tabindex="-1">${languagesHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          <solid-ui-button
            role="button"
            type="button"
            variant="secondary"
            size="sm"
            class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
            aria-label="Add languages"
            @click=${(event: Event) => {
              return createLanguageEditDialog(
                event,
                store,
                subject,
                languages,
                viewerMode,
                onSaved
              )
            }}
          >
            <span class="profile-section-collapsible__edit-label profile__add-more-content">
              <span class="profile__add-more-inline">
                <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
                <span>Add Languages</span>
              </span>
            </span>
            <span class="profile-section-collapsible__edit-icon profile-section-collapsible__edit-icon--add" aria-hidden="true">${plusIcon}</span>
          </solid-ui-button>
          <solid-ui-button
            role="button"
            type="button"
            variant="icon"
            size="sm"
            label="Toggle languages section"
            class="inline-flex-row justify-center"
            aria-label="Toggle languages section"
            aria-controls="languages-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="languages-panel" class="profile-section-collapsible__content" aria-hidden="true">
        ${renderOwnerEmptyLanguagesContent(store, subject, languages, viewerMode, onSaved)}
      </div>
    </section>
  `
}

export function renderLanguageSection(
  store: LiveStore,
  subject: NamedNode,
  languages: LanguageDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const safeLanguages = languages || []
  const hasLanguages = Array.isArray(safeLanguages) && safeLanguages.length > 0

  const showOwnerEmptyLanguages = !hasLanguages && viewerMode === 'owner'
  const showSection = true
    
  return showSection ? html`
    ${showOwnerEmptyLanguages
      ? renderOwnerEmptyLanguagesSection(store, subject, safeLanguages, viewerMode, onSaved)
      : renderLanguagesSectionDefault(store, subject, safeLanguages, viewerMode, onSaved)}
  ` : ''
  
}
