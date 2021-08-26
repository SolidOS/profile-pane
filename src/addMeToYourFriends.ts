import { html, TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import { DataBrowserContext } from "pane-registry";
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
const internalErrorMessage = "An internal error occured!";
const friendWasAddedSuccesMessage = "Friend was added!";
const addMeToYourFriendsButtonText = "Add me to your friends"

const addMeToYourFriendsHtml = (
  subject: UI.rdf.NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  buttonContainer = context.dom.createElement("div");
  buttonContainer.appendChild(createAddMeToYourFriendsButton(subject, context));
  return html` <div style="${styles.button}">${buttonContainer}</div> `;
};

const createAddMeToYourFriendsButton = (
  subject: UI.rdf.NamedNode,
  context: DataBrowserContext
): HTMLButtonElement => {
  const button = UI.widgets.button(context.dom, undefined, addMeToYourFriendsButtonText, undefined, {
    needsBorder: true,
  });
  button.addEventListener(
    "click",
    async () =>
      await saveNewFriend(subject, context)
        .then(() => reportToFrontend(true, context, friendWasAddedSuccesMessage))
        .catch((error) => reportToFrontend(false, context, error)),
    false
  );
  return button;
};

async function saveNewFriend(subject: UI.rdf.NamedNode, context: DataBrowserContext): Promise<void> {
  const loggedInContext = await UI.authn.logInLoadProfile(context).catch(() => {
    //For error text consistency reasons, we need to chatch this here.
    //Now it shows the same message like in the error upon clicking the chat button.
    throw new Error(userNotLoggedInErrorMessage);
  });
  const me = loggedInContext.me;
  const profileDoc = me.doc();
  const store = context.session.store;
  const updater = store.updater;
  const toBeInserted = [UI.rdf.st(me, UI.ns.foaf("knows"), subject, profileDoc)];
  try {
    await updater.update([], toBeInserted);
  } catch (error) {
    let errorMessage = error;
    if (errorMessage.toString().includes("Unauthenticated"))
      errorMessage = userNotLoggedInErrorMessage;
    throw new Error(errorMessage);
  }
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
  buttonContainer.appendChild(
    UI.widgets.errorMessageBlock(window.document, internalErrorMessage)
  );
});

export { addMeToYourFriendsHtml, saveNewFriend, createAddMeToYourFriendsButton };
