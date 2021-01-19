import { html } from "lit-html";
import { styleMap } from "lit-html/directives/style-map";
import {
  card,
  fullWidth,
  responsiveGrid,
  padding,
  heading,
  textCenter,
  marginVerticalSmall,
  label,
  paddingSmall,
  textGray,
} from "./baseStyles";

interface Props {
  webId: string;
  name: string;
  role: string;
  country: string;
  organization: string;
  imageSrc: string;
}

const styles = {
  image: styleMap(fullWidth()),
  name: styleMap(heading()),
  role: styleMap({ ...textGray(), ...textCenter() }),
  info: styleMap(padding()),
};

export const ProfileCard = ({
  webId,
  name,
  imageSrc,
  role,
  organization,
}: Props) => html`
  <div>
    <img style=${styles.image} src=${imageSrc} alt=${name} />
  </div>
  <div style=${styles.info}>
    <h3 style=${styles.name}>${name}</h3>
    <div style=${styles.role}>${role} at ${organization}</div>
  </div>
`;
