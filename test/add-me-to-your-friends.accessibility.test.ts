import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import axe from 'axe-core'
import { render } from 'lit-html'
import { authn } from 'solid-logic'
import { sym } from 'rdflib'
import { addMeToYourFriendsDiv } from '../src/specialButtons/addMeToYourFriends'
import { context, subject } from './setup'

describe('Add me to your friends accessibility', () => {
  const baseStore = context.session.store as any
  const me = sym('https://example.com/profile/card#me')

  beforeEach(() => {
    jest.restoreAllMocks()
    baseStore.fetcher = {
      load: jest.fn().mockResolvedValue(undefined)
    }
    baseStore.updater = {
      update: jest.fn().mockResolvedValue(undefined)
    }
    baseStore.whether = jest.fn().mockReturnValue(0)
  })

  it('has no accessibility violations for anonymous users', async () => {
    jest.spyOn(authn, 'currentUser').mockReturnValue(null as any)

    const container = document.createElement('div')
    document.body.appendChild(container)
    render(addMeToYourFriendsDiv(subject, context, 'anonymous'), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })

  it('has no accessibility violations for authenticated users', async () => {
    jest.spyOn(authn, 'currentUser').mockReturnValue(me as any)

    const container = document.createElement('div')
    document.body.appendChild(container)
    render(addMeToYourFriendsDiv(subject, context, 'authenticated'), container)

    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
