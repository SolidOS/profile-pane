import { context, subject } from "./setup";
import pane from "../";
import { findByText, fireEvent } from "@testing-library/dom";

describe("add-me-to-your-friends", () => {
  describe("saveNewFriend with NO logged in user", () => {
    let result;
    beforeAll(() => {
      result = pane.render(subject, context);
    });

    it("renders the Add me to friends button", async () => {
      const button = await findByText(result, "ADD ME TO YOUR FRIENDS");
      expect(button).not.toBeNull();
    });

    it("saveNewFriend with user NOT logged in", async () => {
      const button = await findByText(result, "ADD ME TO YOUR FRIENDS");
      fireEvent.click(button);
      const errorMessage = await findByText(result, "Current user not found! Not logged in?");
      expect(errorMessage).not.toBeNull();
      expect(button).toThrowError;
    });
  });
});
