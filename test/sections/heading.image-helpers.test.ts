import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sym } from 'rdflib'
import { uploadPhotoFile } from '../../src/sections/heading/imageHelpers'

const mockCurrentUser = vi.fn()
const mockSetACLUserPublic = vi.fn()
const mockDebugError = vi.fn()

vi.mock('solid-logic', () => {
  const store = require('rdflib').graph()
  return {
    store,
    authn: {
      currentUser: () => mockCurrentUser(),
        checkUser: vi.fn(() => Promise.resolve(undefined)),
      login: vi.fn(),
    },
    authSession: {
      webId: null,
      isActive: false,
      info: { isLoggedIn: false, webId: null },
      login: vi.fn(),
      logout: vi.fn(),
      events: { on: vi.fn(), off: vi.fn() },
    },
    solidLogicSingleton: {
      store,
      acl: {
        setACLUserPublic: (...args: unknown[]) => mockSetACLUserPublic(...args)
      },
      profile: { loadPreferences: vi.fn(), loadProfile: vi.fn() },
      typeIndex: {
        getScopedAppInstances: vi.fn(),
        getRegistrations: vi.fn(),
        loadAllTypeIndexes: vi.fn(),
        getScopedAppsFromIndex: vi.fn(),
      },
    },
    SolidLogic: class {},
    AppDetails: {},
  }
})

vi.mock('../../src/utils/debug', () => ({
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
      arrayBuffer: vi.fn(async () => new ArrayBuffer(8))
    } as unknown as File
  }

  it('attempts to make uploaded heading images public-read', async () => {
    const subject = sym('https://example.com/profile/card#me')
    const currentUser = sym('https://example.com/profile/card#me')
    const webOperation = vi.fn(async (..._args: unknown[]) => ({ ok: true }))
    const store = {
      fetcher: { webOperation },
      holds: vi.fn(() => false)
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
    const webOperation = vi.fn(async (..._args: unknown[]) => ({ ok: true }))
    const store = {
      fetcher: { webOperation },
      holds: vi.fn(() => false)
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