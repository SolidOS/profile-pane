# profile-pane
SolidOS pane that displays a personal profile page

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

Focused accessibility check:
```shell script
npm test -- test/profile-view.accessibility.test.ts
```

Accessibility markup baseline checklist:
[docs/accessibility-baseline-checklist.md](docs/accessibility-baseline-checklist.md)

Refactor test plan (temporary skips and revisit checklist):
[docs/refactor-test-plan.md](docs/refactor-test-plan.md)

### Legacy Files

Legacy refactor artifacts are kept in [src/legacy](src/legacy).
These files are intentionally retained for historical/reference purposes and are not part of the active sections-based flow.

If you are a first time developer/user on Windows 10, the repository may give package issues regarding webpack or jest.
If this is the case, simply run "npm audit fix" and upgrade the repository. It should work fine.

#### Unit tests

Unit tests use `jest` and are placed next to the tested file as `*.spec.ts` files.

### Dev Server

Start a webpack dev server:

```shell script
npm start
```

Visit `http://localhost:8080/` to render the pane. Adjust `const webIdToShow` in `./dev/index.ts` to show a different profile.
 
### Build

```
npm run build
```

The build is done by `tsc`, webpack is only used as dev server and not for production build.

## Generative AI usage
The SolidOS team is using GitHub Copilot integrated in Visual Studio Code. 
We have added comments in the code to make it explicit which parts are 100% written by AI. 

### Prompt usage hitory:
* Model GPT-5.3-Codex:  write me a reusable function to open a dialog with a form and return the form values on submit. The function should also support validation and display error messages in the dialog. It should reuse the OpenModal function for consistency. 

* Model GPT-5.3-Codex: the description needs to only show 2 lines and then more button please generate code for this. 

* Model GPT-5.3-Codex: write me a function to convert a date to Month, Year 

* Model GPT-5.3-Codex: The QRCode has a label "link to profile" but it should be a VCARD with name, and link to profile. So when you scan it it goes into your contacts. That's the current way works, IIRC.

* GPT-5.3-Codex Model: 1. are you able to create a little trash can icon at the end of each entry so for each phone, email and address line. 2. are you able to add all the country flags and prefix next to the phone numbers? 3. can you write functions to sanitize the input values for emails, phones, and addresses? 

* GPT-5.3-Codex Model:  can you have applyAddressFieldChange update the row status based on whether any fields have content 

* GPT-5.3-Codex Model: do you see anything I can do differently in the mutation code so that it's not so verbose and possible reusable accross sections

* GPT-5.3-Codex Model: can you implement on SocialEditDialog add the bentoIcon as the first item 
on the row, you should be able to drag this button around and it should allow you to change the order of the rows and that should change the order in the mutations that happen for this data. 

* GPT-5.3-Codex Model: Write a function handleCameraClick that uses the cameraCaptureControl to
capture an image and update the profile photo in the heading section.

* GPT-5.3-Codex Model: In header selectors select phone and email work type if it exists otherwise pick any. 

* GPT-5.3-Codex Model: can you make this a month drop down for the start year 

* GPT-5.3-Codex Model: write me a function to determine PastRole, CurrentRole, or FutureRole based on resume role date data. The function should return a NamedNode with the correct solid namespace and role type local name. The function should use the roleType field if it is set to one of those three values, otherwise it should infer the role type based on the start and end dates and isCurrentRole field. 

