# profile-pane
SolidOS pane that displays a personal profile page, now with a monorepo layout for reusable theme tokens and icon assets.

![CI](https://github.com/solid/profile-pane/workflows/CI/badge.svg)

## Monorepo packages

- `@solidos/tokens`: CSS custom properties for base, light, and dark themes.
- `@solidos/icons`: SVG assets split into single-color UI icons and multi-color logos.

## Workspace setup

This repository uses **npm workspaces**.

```sh
npm install
npm run build
```

Root build runs:
- existing `profile-pane` build
- workspace package builds (`packages/*`)

## Package consumption in webpack 5 apps

```js
// webpack.config.js
export default {
  module: {
    rules: [
      {
        test: /\.svg$/i,
        type: 'asset/resource'
      }
    ]
  }
}
```

```ts
import '@solidos/tokens/src/themes.css'
import searchIconUrl from '@solidos/icons/icons/search.svg'

// theme toggle
const root = document.documentElement
root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'

const iconElement = document.querySelector<HTMLElement>('.icon-search')!
iconElement.style.setProperty('--icon-url', `url(${searchIconUrl})`)
```

```css
.icon-search {
  width: 20px;
  height: 20px;
  background-color: var(--icon-color);
  -webkit-mask-image: var(--icon-url);
  mask-image: var(--icon-url);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
```

For multi-color brand assets, use logos as `<img src="...">`:

```ts
import logoUrl from '@solidos/icons/logos/solidos-logo.svg'
document.querySelector<HTMLImageElement>('#brand-logo')!.src = logoUrl
```

## Existing profile-pane development

### Tech stack

- Typescript
- lit-html
- Jest
- Eslint
- SolidOS

### Tests

To run all tests:
```sh
npm test
```

### Dev Server

Start a webpack dev server:

```sh
npm start
```

Visit `http://localhost:8080/` to render the pane. Adjust `const webIdToShow` in `./dev/index.ts` to show a different profile.
