# CSS Custom Properties Reference

This document lists all CSS custom properties (variables) available in the Profile Pane web components library, along with usage and extension examples.

## Available Custom Properties

| Variable Name              | Default Value         | Description                                 |
|---------------------------|----------------------|---------------------------------------------|
| --primary-color           | #7C4DFF              | Main accent color                           |
| --secondary-color         | #0077B6              | Secondary accent color                      |
| --background-color        | #FFFFFF              | Main background color                       |
| --card-bg                 | #FFFFFF              | Card background color                       |
| --section-bg              | #F5F5F5              | Section background color                    |
| --card-internal-bg        | transparent          | Internal card background                    |
| --card-frame-bg           | #f8f9fa              | Card frame background                       |
| --card-frame-border       | #e0e0e0              | Card frame border color                     |
| --text-color              | #1A1A1A              | Main text color                             |
| --text-secondary          | #666                 | Secondary text color                        |
| --text-muted              | #444                 | Muted text color                            |
| --border-light            | #eee                 | Light border color                          |
| --accent-color            | #FFD600              | Accent color (yellow)                       |
| --error-color             | #B00020              | Error color                                 |
| --success-color           | #00C853              | Success color                               |
| --border-radius           | 1rem                 | Default border radius                       |
| --border-radius-sm        | 0.5rem               | Small border radius                         |
| --box-shadow              | 0 2px 8px rgba(...)  | Default box shadow                          |
| --box-shadow-sm           | 0 1px 4px rgba(...)  | Small box shadow                            |
| --spacing-xs              | 0.5rem               | Extra small spacing                         |
| --spacing-sm              | 0.75rem              | Small spacing                               |
| --spacing-md              | 1rem                 | Medium spacing                              |
| --spacing-lg              | 1.5rem               | Large spacing                               |
| --spacing-xl              | 2rem                 | Extra large spacing                         |
| --font-family             | 'Inter', ...         | Font family                                 |
| --font-size-base          | 1rem                 | Base font size                              |
| --font-size-sm            | 0.875rem             | Small font size                             |
| --font-size-lg            | 1.125rem             | Large font size                             |
| --font-size-xl            | 1.25rem              | Extra large font size                       |
| --line-height-base        | 1.5                  | Base line height                            |
| --line-height-tight       | 1.4                  | Tight line height                           |
| --line-height-loose       | 1.6                  | Loose line height                           |
| --letter-spacing-wide     | 0.025em              | Wide letter spacing                         |
| --min-font-size           | 14px                 | Minimum font size for accessibility         |
| --min-line-height         | 1.4                  | Minimum line height for accessibility       |
| --min-touch-target        | 44px                 | Minimum touch target size                   |
| --focus-ring-width        | 2px                  | Focus ring width                            |
| --focus-indicator-width   | 3px                  | Focus indicator width                       |
| --animation-duration      | 0.2s                 | Animation duration                          |
| --animation-duration-slow | 0.3s                 | Slow animation duration                     |
| --high-contrast-ratio     | 7:1                  | High contrast ratio (WCAG AAA)              |

> **Note:** This is a partial list. For a full list, see `src/styles/global.css`.

## How to Override a Variable

You can override any custom property on a specific component or globally. For example, to change the card frame background and primary color for all `stuff-card` components:

```css
stuff-card {
  --card-frame-bg: #ffeedd;
  --primary-color: #ff6600;
}
```

Or, to set a global theme for all components:

```css
:root {
  --primary-color: #0055aa;
  --card-frame-bg: #f0f0f0;
}
```

## Example: Extending a Variable

Suppose you want to make the card border color more prominent:

```css
stuff-card {
  --card-frame-border: #ff0000;
}
```

This will update the border color for all `stuff-card` elements.

## Where to Find and Add Variables

- All variables are defined in `src/styles/global.css` under `:host, :root`.
- You can add new variables to this file and use them in your component styles.

---

For more details, see the main README or the source code in `src/styles/global.css`.
