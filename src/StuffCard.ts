import { html, TemplateResult } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import { NamedNode } from 'rdflib'
import { DataBrowserContext } from 'pane-registry'
import { widgets } from 'solid-ui'
import * as styles from './styles/StuffCard.module.css'
import { ProfilePresentation } from './presenter'

const dom = document

export const StuffCard = (profileBasics: ProfilePresentation,
  context: DataBrowserContext,
  subject: NamedNode, stuffData): TemplateResult => {
  const { stuff }  = stuffData
  if (!stuff.length) return html``
  return html`
    <section
      class="${styles.stuffCard}"
      aria-labelledby="stuff-card-title"
      role="region"
      data-testid="stuff"
    >
      <header class="${styles.stuffHeader}" aria-label="Stuff Header">
        <h3 id="stuff-card-title">Stuff</h3>
      </header>
      <table class="${styles.stuffTable}" data-testid="stuffTable" role="table">
        ${renderThings(stuff)}
      </table>
    </section>
  `
}

function renderThingAsDOM (thing, dom) {
  const options = {}
  // widgets.personTR returns a DOM node, so we need to convert it to HTML string
  const row = widgets.personTR(dom, null, thing.instance, options)
  return unsafeHTML(row.outerHTML)
}

function renderThing (thing, dom) {
  return renderThingAsDOM(thing, dom)
}

function renderThings(things) {
    // console.log('Renderthings: ', things)
    if (things.length === 0) return html``
    return html`${renderThing(things[0], dom)}${things.length > 1 ? renderThings(things.slice(1)) : html``}`
}
