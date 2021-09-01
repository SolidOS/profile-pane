import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import { DataBrowserContext, LiveStore } from "pane-registry";
import * as UI from "solid-ui";
import { padding, textCenter } from "./baseStyles";

let buttonContainer = <HTMLDivElement>document.createElement("div");
const positiveFrontendMessageDiv = <HTMLDivElement>document.createElement("div");
positiveFrontendMessageDiv.setAttribute(
  "style",
  "margin: 0.1em; padding: 0.5em; border: 0.05em solid gray; background-color: #efe; color:black;"
);

const styles = {
  button: styleMap({ ...textCenter(), ...padding() }),
};

//Same not logged in error message like on 'Chat with me' buton
export const userNotLoggedInErrorMessage = "Current user not found! Not logged in?";
const internalErrorMessage = "An internal error occured!";
const friendWasAddedSuccesMessage = "Friend was added!";
const friendExistsMessage = "Friend already exists";
export const addMeToYourFriendsButtonText = "Add me to your friend list";
const friendExistsAlreadyButtonText = "Already part of friend list";

const addMeToYourFriendsHtml = (
  subject: UI.rdf.NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  buttonContainer = context.dom.createElement("div");
  const button = createAddMeToYourFriendsButton(subject, context);
  buttonContainer.appendChild(button);
  return html` <div style="${styles.button}">${buttonContainer}</div> `;
};

const createAddMeToYourFriendsButton = (
  subject: UI.rdf.NamedNode,
  context: DataBrowserContext
): HTMLButtonElement => {
  const button = UI.widgets.button(
    context.dom,
    undefined,
    addMeToYourFriendsButtonText,
    undefined,
    {
      needsBorder: true,
    }
  );
  //this is to make clear which style we have, for code readability
  button.setAttribute("class", "textButton-0-1-3"); //style of 'Primary' UI button with needsBorder=true

  const me = UI.authn.currentUser();
  const store = context.session.store;

  if (checkIfAnyUserLoggedIn(me)) {
    checkIfFriendExists(store, me, subject).then((friendExists) => {
      if (friendExists) {
        button.innerHTML = friendExistsAlreadyButtonText.toUpperCase();
        button.setAttribute("class", "textButton-0-1-3");
      } else button.setAttribute("class", "textButton-0-1-2"); //style of 'Primary' UI button with needsBorder=false
    });
  }

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
  const me = UI.authn.currentUser();
  const store = context.session.store;

  if (checkIfAnyUserLoggedIn(me)) {
    if (!(await checkIfFriendExists(store, me, subject))) {
      //if friend does not exist, we add her/him
      await store.fetcher.load(me);
      const updater = store.updater;
      const toBeInserted = [UI.rdf.st(me, UI.ns.foaf("knows"), subject, me.doc())];
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

function checkIfAnyUserLoggedIn(me: UI.rdf.NamedNode) {
  if (me) return true;
  else return false;
}

async function checkIfFriendExists(
  store: LiveStore,
  me: UI.rdf.NamedNode,
  subject: UI.rdf.NamedNode
) {
  await store.fetcher.load(me);
  if (store.whether(me, UI.ns.foaf("knows"), subject, me.doc()) === 0) return false;
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

//TODO create positive frontend message component on UI
function reportPositive(message: string) {
  positiveFrontendMessageDiv.innerHTML = message;
  buttonContainer.appendChild(positiveFrontendMessageDiv);
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
