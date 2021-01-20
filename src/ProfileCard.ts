import { html, nothing } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import {
  fullWidth,
  heading,
  padding,
  textCenter,
  textGray,
} from "./baseStyles";
import { ProfilePresentation } from "./presenter";

const styles = {
  image: styleMap(fullWidth()),
  name: styleMap(heading()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  info: styleMap(padding()),
};

export const ProfileCard = ({
  name,
  imageSrc,
  introduction,
  location,
}: ProfilePresentation) => html`
  ${Image(imageSrc, name)}
  <div style=${styles.info}>
    <h3 style=${styles.name}>${name}</h3>
    <div style=${styles.intro}>
      ${Line(introduction)} ${Line(location, "🌐")}
    </div>
  </div>
`;

const Line = (value, prefix = nothing) =>
  value ? html`<p>${prefix} ${value}</p>` : nothing;

const Image = (src, alt) =>
  src ? html`<img style=${styles.image} src=${src} alt=${alt} />` : nothing;
