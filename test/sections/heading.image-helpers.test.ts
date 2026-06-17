import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { graph, sym } from 'rdflib'
import { uploadPhotoFile } from '../../src/sections/heading/imageHelpers'

const mockCurrentUser = jest.fn()
const mockSetACLUserPublic = jest.fn()
const mockDebugError = jest.fn()

jest.mock('solid-logic', () => {
  const store = require('rdflib').graph()
  return {
    store,
    authn: {
      currentUser: () => mockCurrentUser(),
      checkUser: jest.fn().mockResolvedValue(null),
      login: jest.fn(),
    },
    authSession: {
      webId: null,
      isActive: false,
      info: { isLoggedIn: false, webId: null },
      login: jest.fn(),
      logout: jest.fn(),
      events: { on: jest.fn(), off: jest.fn() },
    },
    solidLogicSingleton: {
      store,
      acl: {
        setACLUserPublic: (...args: unknown[]) => mockSetACLUserPublic(...args)
      },
      profile: { loadPreferences: jest.fn(), loadProfile: jest.fn() },
      typeIndex: {
        getScopedAppInstances: jest.fn(),
        getRegistrations: jest.fn(),
        loadAllTypeIndexes: jest.fn(),
        getScopedAppsFromIndex: jest.fn(),
      },
    },
    SolidLogic: class {},
    AppDetails: {},
  }
})

jest.mock('../../src/utils/debug', () => ({
  error: (...args: unknown[]) => mockDebugError(...args)
}))

describe('heading image helper uploads', () => {
  beforeEach(() => {
    mockCurrentUser.mockReset()
    mockSetACLUserPublic.mockReset()
    mockDebugError.mockReset()
  })

  function createImageFile() {
    return {
      name: 'avatar.png',
      type: 'image/png',
      arrayBuffer: jest.fn(async () => new ArrayBuffer(8))
    } as unknown as File
  }

  it('attempts to make uploaded heading images public-read', async () => {
    const subject = sym('https://example.com/profile/card#me')
    const currentUser = sym('https://example.com/profile/card#me')
    const webOperation = jest.fn(async (..._args: unknown[]) => ({ ok: true }))
    const store = {
      fetcher: { webOperation },
      holds: jest.fn(() => false)
    } as any
    const file = createImageFile()

    mockCurrentUser.mockReturnValue(currentUser)
    mockSetACLUserPublic.mockImplementation(async () => sym('https://example.com/profile/avatar.png.acl'))

    const uploadedUri = await uploadPhotoFile(store, subject, file)

    expect(uploadedUri).toBe('https://example.com/profile/avatar.png')
    expect(webOperation).toHaveBeenCalledWith('PUT', 'https://example.com/profile/avatar.png', expect.objectContaining({
      contentType: 'image/png'
    }))
    expect(mockSetACLUserPublic).toHaveBeenCalledWith('https://example.com/profile/avatar.png', currentUser, {
      public: ['Read']
    })
    expect(mockDebugError).not.toHaveBeenCalled()
  })

  it('keeps uploaded heading images when the public ACL write fails', async () => {
    const subject = sym('https://example.com/profile/card#me')
    const currentUser = sym('https://example.com/profile/card#me')
    const webOperation = jest.fn(async (..._args: unknown[]) => ({ ok: true }))
    const store = {
      fetcher: { webOperation },
      holds: jest.fn(() => false)
    } as any
    const file = createImageFile()

    mockCurrentUser.mockReturnValue(currentUser)
    mockSetACLUserPublic.mockImplementation(async () => {
      throw new Error('ACL write failed')
    })

    const uploadedUri = await uploadPhotoFile(store, subject, file)

    expect(uploadedUri).toBe('https://example.com/profile/avatar.png')
    expect(mockSetACLUserPublic).toHaveBeenCalledWith('https://example.com/profile/avatar.png', currentUser, {
      public: ['Read']
    })
    expect(mockDebugError).toHaveBeenCalledWith(expect.stringContaining('Error setting uploaded picture permissions:'))
  })
})