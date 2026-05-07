import { describe, expect, it, jest } from "@jest/globals"
import { html, render } from 'lit-html'
import { sym } from 'rdflib'
import { renderHeadingSection } from '../../src/sections/heading/HeadingSection'
import { addMeToYourContactsButtonText, addMeToYourFriendsButtonText } from '../../src/texts/buttonTexts'
import { runAxe } from '../helpers/runAxe'
import { context, fakeLogInAs, subject } from '../setup'

jest.mock('../../src/specialButtons/addContact/addMeToYourContacts', () => ({
  addMeToYourContactsDiv: jest.fn(async () => {
    const { html } = require('lit-html')
    return html`
      <section class="profile-contacts-button__section">
        <solid-ui-button type="button">Add as Contact</solid-ui-button>
      </section>
    `
  })
}))

jest.mock('../../src/specialButtons/addMeToYourFriends', () => ({
  addMeToYourFriendsDiv: jest.fn(() => {
    const { html } = require('lit-html')
    return html`
      <section class="profile-friends-button__section">
        <solid-ui-button type="button">Add as friend</solid-ui-button>
      </section>
    `
  })
}))

describe('Intro section', () => {
  it('renders basic profile info and owner action', async () => {
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

    render(await renderHeadingSection(context, subject, profile as any, 'owner'), container)

    expect(container.querySelector('.profile__section')).toBeTruthy()
    expect(container.textContent).toContain('Jane Doe')
    expect(container.querySelector('solid-ui-button[aria-label="Add or edit heading information"], button[aria-label="Add or edit heading information"]')).toBeTruthy()
    expect(container.querySelector('.profile__heading-actions')).toBeNull()
    expect(container.textContent).not.toContain(addMeToYourContactsButtonText)
    expect(container.textContent).not.toContain(addMeToYourFriendsButtonText)
    expect(container.querySelector('.profile__hero-alt')?.getAttribute('tabindex')).toBeNull()

    container.remove()
  })

  it('renders add to contacts and add as friend actions for authenticated viewers only', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    fakeLogInAs(subject)

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

    render(await renderHeadingSection(context, subject, profile as any, 'authenticated'), container)

    expect(container.querySelector('.profile__heading-actions')).toBeTruthy()
    expect(container.textContent).toContain(addMeToYourContactsButtonText)
    expect(container.textContent).toContain(addMeToYourFriendsButtonText)
    expect(container.querySelector('solid-ui-button[aria-label="Add or edit heading information"], button[aria-label="Add or edit heading information"]')).toBeNull()
    expect(container.querySelector('.profile__heading-edit-action')).toBeNull()

    container.remove()
  })

  it('has no accessibility violations', async () => {
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

    render(await renderHeadingSection(context, subject, profile as any, 'owner'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })

  it('has no accessibility violations for anonymous viewers', async () => {
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

    render(await renderHeadingSection(context, subject, profile as any, 'anonymous'), container)

    expect(container.querySelector('solid-ui-button[aria-label="Add or edit heading information"], button[aria-label="Add or edit heading information"]')).toBeNull()
    expect(container.querySelector('.profile__heading-actions')).toBeNull()
    expect(container.textContent).not.toContain(addMeToYourContactsButtonText)
    expect(container.textContent).not.toContain(addMeToYourFriendsButtonText)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
