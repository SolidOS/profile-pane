import { html } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import {
  fullWidth,
  heading,
  padding,
  textCenter,
  textGray,
} from "./baseStyles";

interface Props {
  webId: string;
  name: string;
  role: string;
  country: string;
  organization: string;
  imageSrc: string;
  location: string;
}

const styles = {
  image: styleMap(fullWidth()),
  name: styleMap(heading()),
  role: styleMap({ ...textGray(), ...textCenter() }),
  info: styleMap(padding()),
};

export const ProfileCard = ({
  name,
  imageSrc,
  role,
  organization,
  location,
}: Props) => html`
  <div>
    <img style=${styles.image} src=${imageSrc} alt=${name} />
  </div>
  <div style=${styles.info}>
    <h3 style=${styles.name}>${name}</h3>
    <div style=${styles.role}>
      <p>${role} at ${organization}</p>
      <p>🌐 ${location}</p>
    </div>
  </div>
`;
