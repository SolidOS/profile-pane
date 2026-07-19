import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authn } from 'solid-logic'
import { sym } from 'rdflib'
import { context, subject } from './setup'
import { flushAsync } from './helpers/dom'
import { addMeToYourFriendsDiv, checkIfThingExists, createAddMeToYourFriendsButton, saveNewThing } from '../src/specialButtons/addMeToYourFriends'
import {
  addMeToYourFriendsButtonText,
  friendExistsAlreadyButtonText,
  logInAddMeToYourFriendsButtonText
} from '../src/texts'

describe('add-me-to-your-friends functions', () => {
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

    afterEach(() => {
      vi.restoreAllMocks()
    })

    describe('addMeToYourFriendsDiv', () => {
      it('exists', () => {
        expect(addMeToYourFriendsDiv).toBeInstanceOf(Function)
      })
  
      it('runs', () => {
        expect(addMeToYourFriendsDiv(subject, context, 'authenticated')).toBeTruthy()
      })
    })
  
    describe('createAddMeToYourFriendsButton', () => {
      it('exists', () => {
        expect(createAddMeToYourFriendsButton).toBeInstanceOf(Function)
      })
  
      it('runs', () => {
        expect(createAddMeToYourFriendsButton(subject, context)).toBeTruthy()
      })

      it('disables the action and shows the logged-out label for anonymous users', () => {
        vi.spyOn(authn, 'currentUser').mockReturnValue(null as any)

        const button = createAddMeToYourFriendsButton(subject, context)

        expect(button.disabled).toBe(true)
        expect(button.textContent).toBe(logInAddMeToYourFriendsButtonText)
      })

      it('refreshes after a successful add and updates the label to already friends', async () => {
        vi.spyOn(authn, 'currentUser').mockReturnValue(me as any)
        const whetherMock = vi.fn()
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(1)
        baseStore.whether = whetherMock

        const button = createAddMeToYourFriendsButton(subject, context)

        await flushAsync()

        expect(button.textContent).toBe(addMeToYourFriendsButtonText)

        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

        await flushAsync()
        await flushAsync()

        expect(button.textContent).toBe(friendExistsAlreadyButtonText)

        expect(baseStore.updater.update).toHaveBeenCalledTimes(1)
      })
    })
  
    describe('saveNewThing', () => {
      it('exists', () => {
        expect(saveNewThing).toBeInstanceOf(Function)
      })
  
    })
  
    describe('checkIfThingExists', () => {
      it('exists', () => {
        expect(checkIfThingExists).toBeInstanceOf(Function)
      })
  
      it('runs', () => {
        expect(checkIfThingExists(context.session.store, subject, subject, subject)).toBeTruthy()
        expect(checkIfThingExists(context.session.store, subject, subject, subject)).toBeInstanceOf(Promise)
      })
    })
  
  })


