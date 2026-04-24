import { render } from 'lit-html'
import { QRCodeCard } from '../src/sections/qrcode/QRCodeCard'
import { NamedNode, graph, parse, sym } from 'rdflib'
import axe from 'axe-core'

describe('QRCodeCard accessibility', () => {
  it('has no accessibility violations', async () => {
    const subject = { uri: 'https://example.com', value: 'https://example.com' } as NamedNode
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(QRCodeCard(subject), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })

  it('does not create a redundant focus target inside the QR image', () => {
    const subject = { uri: 'https://example.com', value: 'https://example.com' } as NamedNode
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(QRCodeCard(subject), container)

    const redundantFocusTarget = container.querySelector('[data-testid="qrcode-card"] [tabindex="0"]')
    expect(redundantFocusTarget).toBeNull()
  })

  it('uses linked contact values instead of contact entry node ids in the vCard payload', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const profile = `
      @prefix : <#>.
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#>.

      :me
        vcard:fn "Example Person";
        vcard:hasEmail :emailEntry;
        vcard:hasTelephone :phoneEntry.

      :emailEntry vcard:value <mailto:person@example.com>.
      :phoneEntry vcard:value <tel:+1-555-0100>.
    `

    parse(profile, store, subject.doc().uri, 'text/turtle')

    const container = document.createElement('div')
    document.body.appendChild(container)
    render(QRCodeCard(subject, store), container)

    const qrCard = container.querySelector('[data-testid="qrcode-card"]')
    const payload = qrCard?.getAttribute('data-value') || ''

    expect(payload).toContain('EMAIL;TYPE=internet:person@example.com')
    expect(payload).toContain('TEL:+1-555-0100')
    expect(payload).not.toContain('#emailEntry')
    expect(payload).not.toContain('#phoneEntry')
  })
})