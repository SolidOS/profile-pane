import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderContactInfoSection } from '../../src/sections/contactInfo/ContactInfoSection'
import { context, subject } from '../setup'

describe('Contact info section', () => {
  it('renders phone, email, and address lists', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const contactInfo = {
      phones: [
        {
          entryNode: sym('https://example.com/profile#phone'),
          type: sym('http://www.w3.org/2006/vcard/ns#Home'),
          valueNode: sym('tel:+1555123456')
        }
      ],
      emails: [
        {
          entryNode: sym('https://example.com/profile#email'),
          type: sym('http://www.w3.org/2006/vcard/ns#Work'),
          valueNode: sym('mailto:jane@example.com')
        }
      ],
      addresses: [
        {
          entryNode: sym('https://example.com/profile#address'),
          streetAddress: 'Main Street 1',
          locality: 'Boston',
          countryName: 'USA'
        }
      ]
    }

    render(
      renderContactInfoSection(context.session.store, subject, contactInfo as any, 'owner'),
      container
    )

    expect(container.querySelector('#contact-details-heading')).toBeTruthy()
    expect(container.querySelector('ul[aria-label="Phone numbers"]')).toBeTruthy()
    expect(container.querySelector('ul[aria-label="Email addresses"]')).toBeTruthy()
    expect(container.querySelector('ul[aria-label="Postal addresses"]')).toBeTruthy()

    container.remove()
  })
})
