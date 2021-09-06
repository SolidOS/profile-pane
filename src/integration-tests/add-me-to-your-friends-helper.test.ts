import { clearPreviousMessage, complain, mention } from "../addMeToYourFriendsHelper";
import { context } from "./setup";

describe("add me to your friends helper functions", () => {
  let buttonContainer: HTMLDivElement;
  let error: string;

  beforeAll(() => {
    buttonContainer = context.dom.createElement("div");
    const button = context.dom.createElement("button");
    buttonContainer.appendChild(button);
    error = "error";
  });
  describe("complain", () => {
    it("exists", () => {
      expect(complain).toBeInstanceOf(Function);
    });

    it("runs", () => {
      expect(complain(buttonContainer, context, error)).toEqual(undefined);
      expect(buttonContainer.childNodes.length).toBe(2);
    });
  });

  describe("mention", () => {
    it("exists", () => {
      expect(mention).toBeInstanceOf(Function);
    });

    it("runs", () => {
      expect(mention(buttonContainer, error)).toEqual(undefined);
      expect(buttonContainer.childNodes.length).toBe(3);
    });
  });

  describe("clearPreviousMessage", () => {
    it("exists", () => {
      expect(clearPreviousMessage).toBeInstanceOf(Function);
    });

    it("runs", () => {
      expect(clearPreviousMessage(buttonContainer)).toEqual(undefined);
      expect(buttonContainer.childNodes.length).toBe(1);
    });
  });
});
