import { sym } from "rdflib";
import { default as pane } from "../src";
import { context, fetcher } from "./context";
import { authn, widgets } from "solid-ui";

const {
  currentSession,
  popupLogin,
  logout,
  trackSession,
} = authn.solidAuthClient;

const loginButton = widgets.button(
  document,
  undefined,
  "Login",
  async function () {
    const session = await currentSession();
    const popupUri = "https://solidcommunity.net/common/popup.html";
    if (!session) {
      await popupLogin({ popupUri });
    }
  }
);

const logoutButton = widgets.button(document, undefined, "Logout", () =>
  logout()
);

const loginBanner = document.getElementById("loginBanner");

trackSession((session) => {
  if (!session) {
    loginBanner.innerHTML = "";
    loginBanner.appendChild(loginButton);
  } else {
    loginBanner.innerHTML = `Logged in as ${session.webId}`;
    loginBanner.appendChild(logoutButton);
  }
});

const webIdToShow = "https://timbl.inrupt.net/profile/card#me";

fetcher.load(webIdToShow).then(() => {
  const app = pane.render(sym(webIdToShow), context);
  document.getElementById("app").replaceWith(app);
});
