export const responsiveGrid = () => ({
  "--auto-grid-min-size": "30rem", // was 20rem but allowed 2 cols on phone
  display: "grid",
  "grid-template-columns":
    "repeat(auto-fill, minmax(var(--auto-grid-min-size), 1fr))",
  "grid-gap": "1rem",
});

export const card = () => ({
  backgroundColor: "white",
  borderRadius: "4px",
  boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
  padding: "0",
});

export const fullWidth = () => ({
  width: "100%",
  "max-width": "100vw",
});

export const padding = () => ({
  padding: "1rem",
});

export const paddingSmall = () => ({
  padding: "0.25rem",
});

export const marginVerticalSmall = () => ({
  marginTop: "0.25rem",
  marginBottom: "0.25rem",
});

export const textCenter = () => ({
  textAlign: "center",
});

export const textLeft = () => ({
  textAlign: "left",
});

export const textRight = () => ({
  textAlign: "right",
});

export const textXl = () => ({
  fontSize: "1.25rem",
  lineHeight: "1.75rem",
});

export const fontThin = () => ({
  fontWeight: "100",
});

export const fontSemibold = () => ({
  fontWeight: "600",
});

export const textDarkGray = () => ({
  color: "rgb(55, 65, 81,)",
});

export const textGray = () => ({
  color: "rgb(107, 114, 128)",
});

export const heading = () => ({
  ...textCenter(),
  ...textXl(),
  ...fontSemibold(),
  ...textDarkGray(),
  margin: "0",
});

export const headingLight = () => ({
  ...textGray(),
  ...fontThin(),
  ...textXl(),
  margin: "0",
});

export const label = () => ({
  ...textGray(),
  ...fontSemibold(),
});
