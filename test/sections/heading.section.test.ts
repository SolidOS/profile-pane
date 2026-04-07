import { describe, expect, it } from "@jest/globals"
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderHeadingSection } from '../../src/sections/heading/HeadingSection'
import { context, subject } from '../setup'

describe('Intro section', () => {
  it('renders basic profile info and owner action', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const profile = {
      entryNode: sym('https://example.com/profile#entry'),
      name: 'Jane Doe',
      nickname: 'Jane',
      imageSrc: '',
      location: 'Amsterdam',
      pronouns: 'She/Her',
      jobTitle: 'Engineer',
      orgName: 'SolidOS',
      primaryPhone: {
        entryNode: sym('https://example.com/profile#phone'),
        type: sym('http://www.w3.org/2006/vcard/ns#Home'),
        valueNode: sym('tel:+123456789')
      },
      primaryEmail: {
        entryNode: sym('https://example.com/profile#email'),
        type: sym('http://www.w3.org/2006/vcard/ns#Home'),
        valueNode: sym('mailto:jane@example.com')
      },
      primaryAddress: {
        entryNode: sym('https://example.com/profile#address')
      }
    }

    render(renderHeadingSection(context, subject, profile as any, 'owner'), container)

    expect(container.querySelector('.profile__section')).toBeTruthy()
    expect(container.textContent).toContain('Jane Doe')
    expect(container.querySelector('button[aria-label="Add or edit heading information"]')).toBeTruthy()

    container.remove()
  })
})
