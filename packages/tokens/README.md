# @solidos/tokens

Theme tokens package for frameworkless TypeScript applications.

## Install

```sh
npm install @solidos/tokens
```

## Usage

Import the shared theme CSS once in your application entrypoint:

```ts
import '@solidos/tokens/src/themes.css'
```

Use the tokens in your CSS:

```css
body {
  background: var(--surface-background);
  color: var(--text-primary);
}
```

Toggle light/dark by setting `data-theme` on the root element:

```ts
document.documentElement.dataset.theme = 'dark'
// later
// document.documentElement.dataset.theme = 'light'
```
