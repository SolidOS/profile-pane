import { html } from 'lit-html'
import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import { ViewerMode } from '../../types'
import { createLanguageEditDialog } from './LanguageEditDialog'
import { LanguageDetails } from './types'
import { languagesHeadingText } from '../../texts'

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
    <section class="section-bg" aria-labelledby="languages-heading" role="region">
      <header class="sectionHeader mb-md">
        <h3 id="languages-heading">${languagesHeadingText}</h3>
        ${viewerMode === 'owner'
          ? html`
              <button
                type="button"
                class="actionButton"
                aria-label="Add or edit languages"
                @click=${(event: Event) => createLanguageEditDialog(event, store, subject, languagesArr, viewerMode, onSaved)}
              >
                + Add More
              </button>
            `
          : html``}
      </header>
      ${hasLanguages
        ? html`
            <ul role="list" aria-label="Known languages">
              ${renderLanguages(languagesArr, true)}
            </ul>
          `
        : hasLanguageLinks
          ? html`<p>Language details are missing for one or more entries.</p>`
          : html`<p>No languages added yet.</p>`}
    </section>
  `
}
