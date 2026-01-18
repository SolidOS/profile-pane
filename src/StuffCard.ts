import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdflib'
import { DataBrowserContext } from 'pane-registry'
import { widgets } from 'solid-ui'
import * as localStyles from './styles/StuffCard.module.css'
import { ProfilePresentation } from './presenter'

const dom = document

export const StuffCard = (profileBasics: ProfilePresentation,
  context: DataBrowserContext,
  subject: NamedNode, stuffData): TemplateResult => {
  const { stuff }  = stuffData
  return html`
    <section
      class="${localStyles.stuffCard}"
      aria-labelledby="stuff-card-title"
      role="region"
      data-testid="stuff"
    >
      <header>
        <h3 id="stuff-card-title" class="sr-only">Shared Resources</h3>
      </header>
      <div role="table" aria-label="List of shared files and resources">
        <table class="${localStyles.stuffTable}" data-testid="stuffTable">
          <caption class="sr-only">Files and resources shared by ${profileBasics.name}</caption>
          <tbody>
            ${renderThings(stuff)}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function renderThingAsDOM (thing, dom) {
  const options = {}
  // widgets.personTR returns a DOM node, so we need to convert it to HTML string
  const row = widgets.personTR(dom, null, thing.instance, options)
  return row
}

function renderThing (thing, dom) {
  return renderThingAsDOM(thing, dom)
}

function renderThings(things) {
    // console.log('Renderthings: ', things)
    if (things.length === 0) return html``
    return html`${renderThing(things[0], dom)}${things.length > 1 ? renderThings(things.slice(1)) : html``}`
}