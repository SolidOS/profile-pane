export const responsiveGrid = () => ({
  "--auto-grid-min-size": "25rem",
  display: "grid",
  "grid-template-columns":
    "repeat(auto-fill, minmax(var(--auto-grid-min-size), 1fr))",
  "grid-gap": "1rem",
});

export const card = () => ({
  fontFamily: "sans-serif",
  borderRadius: "4px",
  boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
  padding: "0",
});
