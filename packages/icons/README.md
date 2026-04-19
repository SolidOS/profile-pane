# @solidos/icons

SVG assets package for frameworkless TypeScript + webpack apps.

- `src/icons`: single-color UI icons (`currentColor`)
- `src/logos`: multi-color brand assets
- `dist/icons`, `dist/logos`: optimized publishable outputs produced by `npm run build`

## Install

```sh
npm install @solidos/icons
```

## Build (package maintainers)

```sh
npm run build
```

This runs SVGO with separate configs for icons and logos, then writes files to:

- `dist/icons/*.svg`
- `dist/logos/*.svg`

## Usage (webpack)

Configure SVG as assets so imports become URLs:

```js
module.exports = {
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

Import only what you use (keeps bundles small):

```ts
import searchIconUrl from '@solidos/icons/icons/search.svg'
import logoUrl from '@solidos/icons/logos/solidos-logo.svg'
```

### UI icons: use CSS masks + `--icon-color`

```css
.icon {
  width: 1.25rem;
  height: 1.25rem;
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

```ts
const el = document.querySelector<HTMLElement>('.icon')!
el.style.setProperty('--icon-url', `url(${searchIconUrl})`)
```

### Logos: use `<img>`

```ts
const logo = document.querySelector<HTMLImageElement>('#logo')!
logo.src = logoUrl
```
