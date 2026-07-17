import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'lit-html'
import { authn } from 'solid-logic'
import { sym } from 'rdflib'
import { addMeToYourFriendsDiv } from '../src/specialButtons/addMeToYourFriends'
import { runAxe } from './helpers/runAxe'
import { context, subject } from './setup'

describe('Add me to your friends accessibility', () => {
  const baseStore = context.session.store as any
  const me = sym('https://example.com/profile/card#me')

  beforeEach(() => {
    vi.restoreAllMocks()
    baseStore.fetcher = {
      load: vi.fn(async () => undefined)
    }
    baseStore.updater = {
      update: vi.fn(async () => undefined)
    }
    baseStore.whether = vi.fn().mockReturnValue(0)
  })

  it('has no accessibility violations for anonymous users', async () => {
    vi.spyOn(authn, 'currentUser').mockReturnValue(null as any)

    const container = document.createElement('div')
    document.body.appendChild(container)
    render(addMeToYourFriendsDiv(subject, context, 'anonymous'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })

  it('has no accessibility violations for authenticated users', async () => {
    vi.spyOn(authn, 'currentUser').mockReturnValue(me as any)

    const container = document.createElement('div')
    document.body.appendChild(container)
    render(addMeToYourFriendsDiv(subject, context, 'authenticated'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
