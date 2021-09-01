import { context, subject } from "./setup";
import pane from "../";
import { findByText, fireEvent } from "@testing-library/dom";
import { addMeToYourFriendsButtonText, userNotLoggedInErrorMessage } from "../addMeToYourFriends";

describe("add-me-to-your-friends", () => {
  describe("saveNewFriend with NO logged in user", () => {
    let result;
    beforeAll(() => {
      result = pane.render(subject, context);
    });

    it("renders the Add me to friends button", async () => {
      const button = await findByText(result, addMeToYourFriendsButtonText.toUpperCase());
      expect(button).not.toBeNull();
    });

    it("saveNewFriend with user NOT logged in", async () => {
      const button = await findByText(result, addMeToYourFriendsButtonText.toUpperCase());
      fireEvent.click(button);
      const errorMessage = await findByText(result, userNotLoggedInErrorMessage);
      expect(errorMessage).not.toBeNull();
      expect(button).toThrowError;
    });
  });
});
