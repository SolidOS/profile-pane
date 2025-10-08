import { context, subject } from './setup'
import { addMeToYourFriendsDiv, checkIfFriendExists, createAddMeToYourFriendsButton, saveNewFriend } from '../src/addMeToYourFriends'

describe('add-me-to-your-friends functions', () => {
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
    })
  
    describe('saveNewFriend', () => {
      it('exists', () => {
        expect(saveNewFriend).toBeInstanceOf(Function)
      })
  
    })
  
    describe('checkIfFriendExists', () => {
      it('exists', () => {
        expect(checkIfFriendExists).toBeInstanceOf(Function)
      })
  
      it('runs', () => {
        expect(checkIfFriendExists(context.session.store, subject, subject)).toBeTruthy()
        expect(checkIfFriendExists(context.session.store, subject, subject)).toBeInstanceOf(Promise)
      })
    })
  
  })


