import { context, subject } from "./setup";
import { addMeToYourFriendsDiv, checkIfAnyUserLoggedIn, checkIfFriendExists, createAddMeToYourFriendsButton, saveNewFriend } from "../addMeToYourFriends";

describe("add-me-to-your-friends functions", () => {
    describe("addMeToYourFriendsDiv", () => {
      it("exists", () => {
        expect(addMeToYourFriendsDiv).toBeInstanceOf(Function);
      });
  
      it("runs", () => {
        expect(addMeToYourFriendsDiv(subject, context)).toBeTruthy();
      });
    });
  
    describe("createAddMeToYourFriendsButton", () => {
      it("exists", () => {
        expect(createAddMeToYourFriendsButton).toBeInstanceOf(Function);
      });
  
      it("runs", () => {
        expect(createAddMeToYourFriendsButton(subject, context)).toBeTruthy();
      });
    });
  
    describe("saveNewFriend", () => {
      it("exists", () => {
        expect(saveNewFriend).toBeInstanceOf(Function);
      });
  
    });
  
    describe("checkIfAnyUserLoggedIn", () => {
      it("exists", () => {
        expect(checkIfAnyUserLoggedIn).toBeInstanceOf(Function);
      });
  
      it("runs", () => {
        expect(checkIfAnyUserLoggedIn(subject)).toBe(true);
        expect(checkIfAnyUserLoggedIn(null)).toBe(false);
        expect(checkIfAnyUserLoggedIn(undefined)).toBe(false);
      });
    });
  
    describe("checkIfFriendExists", () => {
      it("exists", () => {
        expect(checkIfFriendExists).toBeInstanceOf(Function);
      });
  
      it("runs", () => {
        expect(checkIfFriendExists(context.session.store, subject, subject)).toBeTruthy();
        expect(checkIfFriendExists(context.session.store, subject, subject)).toBeInstanceOf(Promise);
      });
    });
  
  });


