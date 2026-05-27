import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render } from 'lit-html'
import { sym } from 'rdflib'
import {
  copyPhotoToProfileContainer,
  moveProfileImagesToPhotoContainer,
  shouldStorePhotoInProfileContainer,
  uploadPhotoFile
} from '../src/sections/heading/imageHelpers'
import { Image } from '../src/sections/heading/Image'
import { authn, solidLogicSingleton } from 'solid-logic'

jest.mock('solid-logic', () => ({
  __esModule: true,
  authn: {
    currentUser: jest.fn(() => null)
  },
  solidLogicSingleton: {
    acl: {
      setACLUserPublic: jest.fn(async () => undefined)
    }
  }
}))

jest.mock('../src/specialButtons/addContact/addMeToYourContacts', () => ({
  __esModule: true,
  addMeToYourContactsDiv: jest.fn(async () => null)
}))

jest.mock('../src/specialButtons/addMeToYourFriends', () => ({
  __esModule: true,
  addMeToYourFriendsDiv: jest.fn(() => null)
}))

describe('heading image helpers', () => {
  const subject = sym('https://pod.example/profile/card#me')
  const setACLUserPublicMock = solidLogicSingleton.acl.setACLUserPublic as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets public read ACLs on a newly created profile photo container and uploaded image', async () => {
    const currentUser = sym('https://pod.example/profile/card#me')
    ;(authn.currentUser as jest.Mock).mockReturnValue(currentUser)

    const webOperation = (jest.fn() as any)
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: true, status: 201, statusText: 'Created' })

    const store = {
      fetcher: {
        webOperation
      }
    } as any

    const file = new File(['image-bytes'], 'avatar.png', { type: 'image/png' })
    const uploadedUri = await uploadPhotoFile(store, subject, file)

    expect(uploadedUri).toBe('https://pod.example/profile/profileFotos/avatar.png')
    expect(solidLogicSingleton.acl.setACLUserPublic).toHaveBeenNthCalledWith(
      1,
      'https://pod.example/profile/profileFotos/',
      currentUser,
      expect.objectContaining({ defaultForNew: true, public: expect.arrayContaining(['Read']) })
    )
    expect(solidLogicSingleton.acl.setACLUserPublic).toHaveBeenNthCalledWith(
      2,
      'https://pod.example/profile/profileFotos/avatar.png',
      currentUser,
      expect.objectContaining({ public: expect.arrayContaining(['Read']) })
    )
  })

  it('keeps uploaded heading images when setting public ACLs fails', async () => {
    const currentUser = sym('https://pod.example/profile/card#me')
    ;(authn.currentUser as jest.Mock).mockReturnValue(currentUser)
    setACLUserPublicMock
      .mockImplementationOnce(async () => { throw new Error('ACL write failed') })
      .mockImplementationOnce(async () => { throw new Error('ACL write failed') })

    const webOperation = (jest.fn() as any)
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: true, status: 201, statusText: 'Created' })

    const store = {
      fetcher: {
        webOperation
      }
    } as any

    const file = new File(['image-bytes'], 'avatar.png', { type: 'image/png' })
    const uploadedUri = await uploadPhotoFile(store, subject, file)

    expect(uploadedUri).toBe('https://pod.example/profile/profileFotos/avatar.png')
    expect(solidLogicSingleton.acl.setACLUserPublic).toHaveBeenCalledTimes(2)
  })

  it('stores uploaded photos inside profileFotos and creates the folder when needed', async () => {
    const webOperation = (jest.fn() as any)
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: true, status: 201, statusText: 'Created' })

    const store = {
      fetcher: {
        webOperation
      }
    } as any

    const file = new File(['image-bytes'], 'avatar.png', { type: 'image/png' })
    const uploadedUri = await uploadPhotoFile(store, subject, file)

    expect(uploadedUri).toBe('https://pod.example/profile/profileFotos/avatar.png')
    expect(webOperation).toHaveBeenNthCalledWith(1, 'HEAD', 'https://pod.example/profile/profileFotos/')
    expect(webOperation).toHaveBeenNthCalledWith(2, 'HEAD', 'https://pod.example/profile/profileFotos/avatar.png')
    expect(webOperation).toHaveBeenCalledTimes(3)
    expect(webOperation).toHaveBeenNthCalledWith(
      3,
      'PUT',
      'https://pod.example/profile/profileFotos/avatar.png',
      expect.objectContaining({ contentType: 'image/png' })
    )
  })

  it('moves an existing root-level profile photo into profileFotos and removes the original file', async () => {
    const webOperation = (jest.fn() as any)
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: true, status: 201, statusText: 'Created' })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'Deleted' })

    const fetcher = {
      _fetch: jest.fn(async (uri: string) => {
        if (uri.endsWith('.acl')) {
          return new Response('', { status: 404, statusText: 'Not Found' })
        }

        return new Response(new Blob(['image-bytes'], { type: 'image/png' }), {
          status: 200,
          headers: { 'Content-Type': 'image/png' }
        })
      }) as any,
      webOperation
    }

    const store = { fetcher } as any
    const copiedUri = await copyPhotoToProfileContainer(store, subject, 'https://pod.example/profile/avatar.png')

    expect(copiedUri).toBe('https://pod.example/profile/profileFotos/avatar.png')
    expect(fetcher._fetch).toHaveBeenCalledWith('https://pod.example/profile/avatar.png')
    expect(webOperation).toHaveBeenNthCalledWith(1, 'HEAD', 'https://pod.example/profile/profileFotos/')
    expect(webOperation).toHaveBeenNthCalledWith(
      2,
      'HEAD',
      'https://pod.example/profile/profileFotos/avatar.png'
    )
    expect(webOperation).toHaveBeenNthCalledWith(
      3,
      'PUT',
      'https://pod.example/profile/profileFotos/avatar.png',
      expect.objectContaining({ contentType: 'image/png' })
    )
    expect(webOperation).toHaveBeenNthCalledWith(4, 'DELETE', 'https://pod.example/profile/avatar.png')
  })

  it('moves root-level profile images and their sidecar acls into profileFotos', async () => {
    const webOperation = (jest.fn() as any)
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: true, status: 201, statusText: 'Created' })
      .mockResolvedValueOnce({ ok: true, status: 201, statusText: 'Created' })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'Deleted' })

    const store = {
      each: jest.fn(() => [sym('https://pod.example/profile/avatar.png'), sym('https://pod.example/profile/card')]),
      fetcher: {
        load: jest.fn(async () => ({ ok: true })),
        _fetch: jest.fn(async (uri: string) => {
          if (uri.endsWith('.acl')) {
            return new Response(
              `@prefix acl: <http://www.w3.org/ns/auth/acl#>.\n<#owner> acl:accessTo <https://pod.example/profile/avatar.png>.`,
              { status: 200, headers: { 'Content-Type': 'text/turtle' } }
            )
          }

          return new Response(new Blob(['image-bytes'], { type: 'image/png' }), {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
          })
        }) as any,
        webOperation
      }
    } as any

    const migratedUris = await moveProfileImagesToPhotoContainer(store, subject)

    expect(migratedUris.get('https://pod.example/profile/avatar.png')).toBe('https://pod.example/profile/profileFotos/avatar.png')
    expect(store.fetcher.load).toHaveBeenCalledWith(sym('https://pod.example/profile/'))
    expect(webOperation).toHaveBeenNthCalledWith(1, 'HEAD', 'https://pod.example/profile/profileFotos/')
    expect(webOperation).toHaveBeenNthCalledWith(
      2,
      'HEAD',
      'https://pod.example/profile/profileFotos/avatar.png'
    )
    expect(webOperation).toHaveBeenNthCalledWith(
      3,
      'PUT',
      'https://pod.example/profile/profileFotos/avatar.png',
      expect.objectContaining({ contentType: 'image/png' })
    )
    expect(webOperation).toHaveBeenNthCalledWith(
      4,
      'PUT',
      'https://pod.example/profile/profileFotos/avatar.png.acl',
      expect.objectContaining({
        contentType: 'text/turtle',
        data: expect.stringContaining('https://pod.example/profile/profileFotos/avatar.png')
      })
    )
    expect(webOperation).toHaveBeenNthCalledWith(5, 'DELETE', 'https://pod.example/profile/avatar.png')
  })

  it('only marks root-level profile photos for migration into profileFotos', () => {
    expect(shouldStorePhotoInProfileContainer(subject, 'https://pod.example/profile/avatar.png')).toBe(true)
    expect(shouldStorePhotoInProfileContainer(subject, 'https://pod.example/profile/profileFotos/avatar.png')).toBe(false)
    expect(shouldStorePhotoInProfileContainer(subject, 'https://cdn.example/avatar.png')).toBe(false)
  })

  it('shows a replacement image after a previous image hit fallback state', () => {
    const host = document.createElement('div')

    render(Image('https://pod.example/profile/broken.png', 'Alice Example'), host)
    const frame = host.querySelector('.profile__image-frame') as HTMLDivElement | null
    const image = host.querySelector('.profile__hero') as HTMLImageElement | null
    expect(frame).not.toBeNull()
    expect(image).not.toBeNull()
    image?.dispatchEvent(new Event('error'))
    expect(image?.hidden).toBe(true)
    expect(frame?.classList.contains('profile__image-frame--fallback')).toBe(true)

    render(Image('blob:https://pod.example/new-preview', 'Alice Example'), host)
    const rerenderedFrame = host.querySelector('.profile__image-frame') as HTMLDivElement | null
    const rerenderedImage = host.querySelector('.profile__hero') as HTMLImageElement | null
    expect(rerenderedFrame).not.toBeNull()
    expect(rerenderedImage).not.toBeNull()
    expect(rerenderedImage?.hidden).toBe(false)
    expect(rerenderedFrame?.classList.contains('profile__image-frame--fallback')).toBe(false)
  })
})