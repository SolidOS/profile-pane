import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sym } from 'rdflib'
import { getViewerMode } from '../src/viewerMode'

const { currentUser, checkAndRefreshEditable } = vi.hoisted(() => ({
  currentUser: vi.fn(),
  checkAndRefreshEditable: vi.fn()
}))

vi.mock('solid-logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-logic')>()

  return {
    ...actual,
    authn: {
      ...actual.authn,
      currentUser
    },
    solidLogicSingleton: {
      ...actual.solidLogicSingleton,
      resource: {
        ...actual.solidLogicSingleton.resource,
        checkAndRefreshEditable
      }
    }
  }
})

describe('Profile view viewer mode', () => {
  beforeEach(() => {
    currentUser.mockReset()
    checkAndRefreshEditable.mockReset()
  })

  it('returns authenticated for a signed-in non-owner', async () => {
    currentUser.mockReturnValue(sym('https://example.com/profile/card#other'))

    await expect(getViewerMode(sym('https://example.com/profile/card#me'))).resolves.toBe('authenticated')
    expect(checkAndRefreshEditable).not.toHaveBeenCalled()
  })

  it('refreshes an owner before returning owner', async () => {
    const subject = sym('https://example.com/profile/card#me')
    currentUser.mockReturnValue(subject)
    checkAndRefreshEditable.mockResolvedValue(true)

    await expect(getViewerMode(subject)).resolves.toBe('owner')
    expect(checkAndRefreshEditable).toHaveBeenCalledWith(subject)
  })
})
