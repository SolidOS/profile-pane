import { html, render } from "lit-html"
import { LiveStore, NamedNode } from "rdflib"
import { ViewerMode } from "../../types"
import { createLanguageEditDialog } from "./LanguageEditDialog"
import { LanguageDetails } from "./types"
import { languagesHeadingText } from "../../texts"
import { presentLanguages } from "./selectors"

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
  viewerMode: ViewerMode
) {
  const refreshLanguageSection = async (hostSection: HTMLElement | null) => {
    if (!hostSection) return

    try {
      await store.fetcher.load(subject.doc(), { force: true } as any)
    } catch {
      // Best-effort refresh; render from current store if fetch reload fails.
    }

    const nextLanguages = presentLanguages(subject, store)
    render(renderLanguageSection(store, subject, nextLanguages, viewerMode), hostSection)
  }

  const languagesArr = languages || []
  const hasLanguages = Array.isArray(languagesArr) && languagesArr.length > 0

  return html`
    <section class="section-bg" aria-labelledby="languages-heading">
      <header class="sectionHeader mb-md">
        <h3 id="languages-heading">${languagesHeadingText}</h3>
        ${viewerMode === 'owner'
          ? html`
              <button
                type="button"
                class="actionButton"
                aria-label="Add or edit languages"
                @click=${(event: Event) => {
                  const hostSection = (event.currentTarget as HTMLElement | null)?.closest('section') as HTMLElement | null
                  return createLanguageEditDialog(
                    event,
                    store,
                    subject,
                    languagesArr,
                    viewerMode,
                    async () => refreshLanguageSection(hostSection)
                  )
                }}
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
        : html`<p>No languages added yet.</p>`}
    </section>
  `
}
