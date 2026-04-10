import { html } from 'lit-html'
import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import { ViewerMode } from '../../types'
import { createLanguageEditDialog } from './LanguageEditDialog'
import { LanguageDetails } from './types'
import { addIcon } from '../../icons-svg/profileIcons'
import { languagesHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

function renderLan(language: LanguageDetails, asList = false) {
  if (!language) return html``
  return asList
    ? html`<li class="language" role="listitem">${language.name}</li>`
    : html``
}

function renderLanguages(languages: LanguageDetails[], asList = false) {
  if (!languages || !languages.length || !languages[0]) return html``
  return html`${renderLan(languages[0], asList)}${languages.length > 1 ? renderLanguages(languages.slice(1), asList) : html``}`
}

export function renderLanguageSection(
  store: LiveStore,
  subject: NamedNode,
  languages: LanguageDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const languagesArr = languages || []
  const hasLanguages = Array.isArray(languagesArr) && languagesArr.length > 0
  const hasLanguageLinks = store.each(subject, ns.schema('knowsLanguage')).length > 0

  return html`
    <section
      class="profileSectionCollapsible section-bg"
      aria-labelledby="languages-heading"
      role="region"
      data-expanded="false"
    >
      <header class="profile__section-header profileSectionCollapsible__header">
        <h2 id="languages-heading">${languagesHeadingText}</h2>
        <div class="profileSectionCollapsible__actions">
          <button
            type="button"
            class="profile__action-button u-profile-action-text profileSectionCollapsible__editButton"
            aria-label="Add or edit languages"
            @click=${(event: Event) => createLanguageEditDialog(event, store, subject, languagesArr, viewerMode, onSaved)}
          >
            <span class="profileSectionCollapsible__editLabel profile__add-more-content">
              <span class="profile__add-more-icon" aria-hidden="true">${addIcon}</span>
              Add More
            </span>
            <span class="profileSectionCollapsible__editIcon" aria-hidden="true">✎</span>
          </button>
          <button
            type="button"
            class="profileSectionCollapsible__toggle"
            aria-label="Toggle languages section"
            aria-controls="languages-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profileSectionCollapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div id="languages-panel" class="profileSectionCollapsible__content" aria-hidden="true">
        ${hasLanguages
          ? html`
              <ul role="list" aria-label="Known languages">
                ${renderLanguages(languagesArr, true)}
              </ul>
            `
          : hasLanguageLinks
            ? html`<p>Language details are missing for one or more entries.</p>`
            : html`<p>No languages added yet.</p>`}
      </div>
    </section>
  `
}
