import { html, nothing, TemplateResult } from "lit-html";
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
  intro: styleMap({ ...textGray(), ...textCenter() }),
  info: styleMap(padding()),
};

export const ProfileCard = ({
  name,
  imageSrc,
  introduction,
  location,
  pronouns,
  highlightColor,
}: ProfilePresentation): TemplateResult => {
  const nameStyle = styleMap({
    ...heading(),
    "text-decoration": "underline",
    "text-decoration-color": highlightColor,
  });
  return html`
    ${Image(imageSrc, name)}
    <div style=${styles.info}>
      <h3 style=${nameStyle}>${name}</h3>
      <div style=${styles.intro}>
        ${Line(introduction)}
        ${Line(location, "🌐")}
        ${Line(pronouns)}
      </div>
    </div>
  `;
};

const Line = (value, prefix: symbol | string = nothing ) =>
  value ? html`<p>${prefix} ${value}</p>` : nothing;

const Image = (src, alt) =>
  src ? html`<img style=${styles.image} src=${src} alt=${alt} />` : nothing;
