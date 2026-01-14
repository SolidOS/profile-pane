import { render } from 'lit-html'
import { QRCodeCard } from '../src/QRCodeCard'
import { NamedNode } from 'rdflib'
import axe from 'axe-core'

describe('QRCodeCard accessibility', () => {
  it('has no accessibility violations', async () => {
    const subject = { uri: 'https://example.com', value: 'https://example.com' } as NamedNode
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(QRCodeCard('#000', '#fff', subject), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })

  it('has tabindex for keyboard accessibility', () => {
    const subject = { uri: 'https://example.com', value: 'https://example.com' } as NamedNode
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(QRCodeCard('#000', '#fff', subject), container)

    // Find the inner div with role="img" and tabindex="0"
    const qr = container.querySelector('.QRCode [role="img"][tabindex="0"]')
    expect(qr).not.toBeNull()
    expect(qr.getAttribute('tabindex')).toBe('0')
  })
})