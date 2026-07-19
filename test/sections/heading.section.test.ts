import { describe, expect, it, vi } from 'vitest'
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderHeadingSection } from '../../src/sections/heading/HeadingSection'
import { addMeToYourFriendsButtonText } from '../../src/texts/buttonTexts'
import { runAxe } from '../helpers/runAxe'
import { context, fakeLogInAs, subject } from '../setup'

vi.mock('../../src/specialButtons/addMeToYourFriends', () => ({
  addMeToYourFriendsDiv: vi.fn(() => {
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

    render(await renderHeadingSection(context, subject, profile as any, 'owner', 'desktop'), container)

    expect(container.querySelector('.profile__section')).toBeTruthy()
    expect(container.textContent).toContain('Jane Doe')
    expect(container.querySelector('solid-ui-button[aria-label="Add or edit heading information"], button[aria-label="Add or edit heading information"]')).toBeTruthy()
    expect(container.querySelector('.profile__heading-actions')).toBeNull()
    expect(container.textContent).not.toContain(addMeToYourFriendsButtonText)
    expect(container.querySelector('.profile__hero-alt')?.getAttribute('tabindex')).toBeNull()

    container.remove()
  })

  it('renders saved heading photos through an authenticated blob url', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const fetchSpy = vi.spyOn((context.session.store.fetcher as any), '_fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['image-bytes'], { type: 'image/png' })
    } as Response)
    const originalCreateObjectURL = URL.createObjectURL
    const createObjectUrlMock = vi.fn(() => 'blob:heading-section-photo')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock
    })

    const profile = {
      entryNode: sym('https://example.com/profile#entry'),
      name: 'Jane Doe',
      nickname: 'Jane',
      imageSrc: 'https://example.com/private/avatar.png',
      location: 'Amsterdam',
      pronouns: 'She/Her',
      jobTitle: 'Engineer',
      orgName: 'SolidOS'
    }

    render(await renderHeadingSection(context, subject, profile as any, 'owner', 'desktop'), container)

    const image = container.querySelector('img.profile__hero') as HTMLImageElement | null
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/private/avatar.png')
    expect(createObjectUrlMock).toHaveBeenCalled()
    expect(image?.getAttribute('src')).toBe('blob:heading-section-photo')

    fetchSpy.mockRestore()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL
    })
    container.remove()
  })

  it('falls back to the default placeholder when a heading image fails to load', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const profile = {
      entryNode: sym('https://example.com/profile#entry'),
      name: 'Jane Doe',
      nickname: 'Jane',
      imageSrc: 'https://example.com/profile/broken.png',
      location: 'Amsterdam',
      pronouns: 'She/Her',
      jobTitle: 'Engineer',
      orgName: 'SolidOS'
    }

    render(await renderHeadingSection(context, subject, profile as any, 'owner', 'desktop'), container)

    const image = container.querySelector('img.profile__hero') as HTMLImageElement | null
    const fallback = container.querySelector('.profile__hero-alt') as HTMLElement | null
    const frame = container.querySelector('.profile__image-frame') as HTMLElement | null

    expect(image?.hidden).toBe(false)
    expect(frame?.classList.contains('profile__image-frame--fallback')).toBe(false)

    image?.dispatchEvent(new Event('error'))

    expect(image?.hidden).toBe(true)
    expect(frame?.classList.contains('profile__image-frame--fallback')).toBe(true)
    expect(fallback?.getAttribute('aria-label')).toBe('Jane Doe')

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

    render(await renderHeadingSection(context, subject, profile as any, 'authenticated', 'desktop'), container)

    expect(container.querySelector('.profile__heading-actions')).toBeTruthy()
    expect(container.textContent).toContain(addMeToYourFriendsButtonText)
    expect(container.querySelector('.profile-contacts-button__section')).toBeNull()
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

    render(await renderHeadingSection(context, subject, profile as any, 'owner', 'desktop'), container)

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

    render(await renderHeadingSection(context, subject, profile as any, 'anonymous', 'desktop'), container)

    expect(container.querySelector('solid-ui-button[aria-label="Add or edit heading information"], button[aria-label="Add or edit heading information"]')).toBeNull()
    expect(container.querySelector('.profile__heading-actions')).toBeNull()
    expect(container.textContent).not.toContain(addMeToYourFriendsButtonText)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
