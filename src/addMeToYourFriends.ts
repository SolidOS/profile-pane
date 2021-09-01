import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import { DataBrowserContext, LiveStore } from "pane-registry";
import { NamedNode } from "rdflib/src";
import * as UI from "solid-ui";
import { padding, textCenter } from "./baseStyles";

let buttonContainer = <HTMLDivElement>document.createElement("div");
const frontendMessageDiv = <HTMLDivElement>document.createElement("div");
frontendMessageDiv.setAttribute(
  "style",
  "margin: 0.1em; padding: 0.5em; border: 0.05em solid gray; background-color: #efe; color:black;"
);

const styles = {
  button: styleMap({ ...textCenter(), ...padding() }),
};

const userNotLoggedInErrorMessage = "Current user not found! Not logged in?";
const friendExistsMessage = "Friend already exists";
const internalErrorMessage = "An internal error occured!";
const friendWasAddedSuccesMessage = "Friend was added!";
const addMeToYourFriendsButtonText = "Add me to your friends";
const alreadyFriendsButtonText = "Already part of friends list";

const addMeToYourFriendsHtml = (
  subject: UI.rdf.NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  buttonContainer = context.dom.createElement("div");
  const button = createAddMeToYourFriendsButton(subject, context);
  UI.authn.checkUser().then((me: NamedNode) => {
    if (me) {
      friendExists(context.session.store, me, subject).then((result) => {
        if (result) {
          button.innerHTML = alreadyFriendsButtonText.toUpperCase();
          button.setAttribute("class", "textButton-0-1-3");
        } else button.setAttribute("class", "textButton-0-1-2");
      });
    } else button.setAttribute("class", "textButton-0-1-3");
  });
  buttonContainer.appendChild(button);
  return html` <div style="${styles.button}">${buttonContainer}</div> `;
};

const createAddMeToYourFriendsButton = (subject: UI.rdf.NamedNode, context: DataBrowserContext) => {
  const button = UI.widgets.button(
    context.dom,
    undefined,
    addMeToYourFriendsButtonText,
    undefined,
    {
      needsBorder: true,
    }
  );

  button.addEventListener(
    "click",
    () =>
      saveNewFriend(subject, context)
        .then(() => reportToFrontend(true, context, friendWasAddedSuccesMessage))
        .catch((error) => reportToFrontend(false, context, error)),
    false
  );

  return button;
};

async function saveNewFriend(
  subject: UI.rdf.NamedNode,
  context: DataBrowserContext
): Promise<void> {
  const loggedInUser = UI.authn.currentUser();
  if (loggedInUser !== null && loggedInUser !== undefined) {
    const store = context.session.store;
    await store.fetcher.load(loggedInUser);
    if (store.whether(loggedInUser, UI.ns.foaf("knows"), subject, loggedInUser.doc()) === 0) {
      const updater = store.updater;
      const toBeInserted = [
        UI.rdf.st(loggedInUser, UI.ns.foaf("knows"), subject, loggedInUser.doc()),
      ];
      try {
        await updater.update([], toBeInserted);
      } catch (error) {
        let errorMessage = error;
        if (errorMessage.toString().includes("Unauthenticated"))
          errorMessage = userNotLoggedInErrorMessage;
        throw new Error(errorMessage);
      }
    } else throw new Error(friendExistsMessage);
  } else throw new Error(userNotLoggedInErrorMessage);
}

async function friendExists(
  store: LiveStore,
  loggedInUser: UI.rdf.NamedNode,
  subject: UI.rdf.NamedNode
) {
  await store.fetcher.load(loggedInUser);
  if (store.whether(loggedInUser, UI.ns.foaf("knows"), subject, loggedInUser.doc()) === 0)
    return false;
  else return true;
}

function reportToFrontend(positive: boolean, context: DataBrowserContext, message: string) {
  clearPreviousMessage();
  if (positive) reportPositive(message);
  else complain(context, message);
}

function complain(context: DataBrowserContext, error: string) {
  buttonContainer.appendChild(UI.widgets.errorMessageBlock(context.dom, error));
}

function reportPositive(message: string) {
  frontendMessageDiv.innerHTML = message;
  buttonContainer.appendChild(frontendMessageDiv);
}

function clearPreviousMessage() {
  while (buttonContainer.childNodes.length > 1) {
    buttonContainer.removeChild(buttonContainer.lastChild);
  }
}

//Because the code has unhandled Promises we still want to signal the user a message.
//Console will contain actual error.
window.addEventListener("unhandledrejection", function () {
  clearPreviousMessage();
  buttonContainer.appendChild(UI.widgets.errorMessageBlock(window.document, internalErrorMessage));
});

export { addMeToYourFriendsHtml, saveNewFriend, createAddMeToYourFriendsButton };
