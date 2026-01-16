import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdflib'
import { DataBrowserContext } from 'pane-registry'
import { widgets } from 'solid-ui'
import './styles/StuffCard.css'
import { ProfilePresentation } from './presenter'


export const StuffCard = (profileBasics: ProfilePresentation,
  context: DataBrowserContext,
  subject: NamedNode, stuffData): TemplateResult => {
  const { stuff }  = stuffData
  const dom = context.dom || document
  return html`
    <section
      class="stuffCard"
      aria-labelledby="stuff-card-title"
      role="region"
      data-testid="stuff"
    >
      <header>
        <h3 id="stuff-card-title" class="sr-only">Shared Resources</h3>
      </header>
      <div>
        <table class="stuffTable" data-testid="stuffTable">
          <caption class="sr-only">Files and resources shared by ${profileBasics.name}</caption>
          <tbody class="zebra-stripe">
            ${renderThings(stuff, dom)}
          </tbody>
        </table>
      </div>
    </section>
  `
}

export function renderThingAsDOM (thing, dom) {
  const options = {}
  // widgets.personTR returns a DOM node, so we need to convert it to HTML string
  const row = widgets.personTR(dom, null, thing.instance, options)
  return row
}

export function renderThing (thing, dom) {
  return renderThingAsDOM(thing, dom)
}

export function renderThings(things, dom) {
  if (things.length === 0) return html``
  return html`${renderThing(things[0], dom)}${things.length > 1 ? renderThings(things.slice(1), dom) : html``}`
}