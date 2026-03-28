import { context, subject } from './setup'
import { addMeToYourFriendsDiv, checkIfThingExists, createAddMeToYourFriendsButton, saveNewThing } from '../src/addMeToYourFriends'

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


