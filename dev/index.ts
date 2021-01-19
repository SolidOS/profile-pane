import { sym } from "rdflib";
import { default as pane } from "../src";
import { context, fetcher } from "./context";

const webId = "https://angelo.veltens.org/profile/card#me";

fetcher.load(webId).then(() => {
  const app = pane.render(sym(webId), context);
  document.getElementById("app").replaceWith(app);
});
