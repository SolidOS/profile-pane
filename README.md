# profile-pane
SolidOS pane that displays a personal profile page

This is a re-write that is going to replace the current profile pane

![CI](https://github.com/solid/profile-pane/workflows/CI/badge.svg)

## Contribute

### Tech stack

- Typescript
- lit-html
- Jest
- Eslint
- SolidOS

### Tests

To run all tests:
```shell script
npm test
```

#### Unit tests

Unit tests use `jest` and are placed next to the tested file as `*.spec.ts` files.

#### Integration tests

Integration tests verify the rendering of the whole pane (with mocked HTTP requests) and are placed under `./src/integration-tests`.

### Dev Server

Start a webpack dev server:

```shell script
npm start
```

Visit `http://localhost:8080/` to render the pane. Adjust `const webIdToShow` in `./dev/index.ts` to show a
 different profile.

Once you have given the proper write/read permissions between your localhost and the pod provider of your choice, you don't have to click "Log In" under "pane under development" everytime you test new features. It should write to your pod in real time anytime you make changes to your solid provider profile. This will save you a lot of time and energy.
 
### Build

```
npm run build
```

The build is done by `tsc`, webpack is only used as dev server and not for production build.
