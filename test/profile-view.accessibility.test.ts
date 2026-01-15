import { ProfileView } from '../src/ProfileView'
import { render } from 'lit-html'
import axe from 'axe-core'
import { NamedNode, sym } from 'rdflib'

describe('ProfileView accessibility', () => {
  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    // Use a real NamedNode for subject
    const subject: NamedNode = sym('https://janedoe.example/profile/card#me')
    const context = {
      dom: document,
      session: {
        store: {
          anyValue: () => undefined,
          any: () => undefined,
          each: () => [],
          anyJS: () => [],
          sym: () => ({ doc: () => ({}) }),
          holds: () => false,
        },
        paneRegistry: {
          byName: () => ({ render: () => document.createElement('div') })
        },
        logic: {},
      }
    }
    // Render ProfileView (returns a Promise<TemplateResult>)
    const result = await ProfileView(subject, context)
    render(result, container)
    const results = await axe.run(container)
    if (results.violations.length > 0) {
      // Print details for debugging
      console.log('Axe violations:', JSON.stringify(results.violations, null, 2))
    }
    expect(results.violations.length).toBe(0)
  })
})
