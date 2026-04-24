import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, waitFor } from '@testing-library/dom'
import { authn } from 'solid-logic'
import { sym } from 'rdflib'
import { context, subject } from './setup'
import { addMeToYourFriendsDiv, checkIfThingExists, createAddMeToYourFriendsButton, saveNewThing } from '../src/addMeToYourFriends'
import {
  addMeToYourFriendsButtonText,
  friendExistsAlreadyButtonText,
  logInAddMeToYourFriendsButtonText
} from '../src/texts'

describe('add-me-to-your-friends functions', () => {
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

    afterEach(() => {
      jest.restoreAllMocks()
    })

    describe('addMeToYourFriendsDiv', () => {
      it('exists', () => {
        expect(addMeToYourFriendsDiv).toBeInstanceOf(Function)
      })
  
      it('runs', () => {
        expect(addMeToYourFriendsDiv(subject, context)).toBeTruthy()
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
        jest.spyOn(authn, 'currentUser').mockReturnValue(null as any)

        const button = createAddMeToYourFriendsButton(subject, context)

        expect(button.disabled).toBe(true)
        expect(button.textContent).toBe(logInAddMeToYourFriendsButtonText)
      })

      it('refreshes after a successful add and updates the label to already friends', async () => {
        jest.spyOn(authn, 'currentUser').mockReturnValue(me as any)
        const whetherMock = jest.fn()
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(1)
        baseStore.whether = whetherMock

        const button = createAddMeToYourFriendsButton(subject, context)

        await waitFor(() => {
          expect(button.textContent).toBe(addMeToYourFriendsButtonText)
        })

        fireEvent.click(button)

        await waitFor(() => {
          expect(button.textContent).toBe(friendExistsAlreadyButtonText)
        })

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


