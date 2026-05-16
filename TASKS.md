# Profile Pane Task List

## Working Notes
- Mobile changes must be implemented in `layout='mobile'`, container queries, and only the necessary media-query fallbacks. `layout='mobile'` and container behavior are the source of truth.
- Prefer `rem` units and mashlib variables from `light.css` where possible.
- For color styling, use general variables for grays and whites where available. `lavender` and primary color variables are fine as-is.
- Remove utility classes other than `sr-only` and `hidden`. Move styles into specific semantic classes; create specific classes when needed.
- Where possible, make like things share the same class and styling so the same UI is styled once instead of through one-off selectors.

## Current Tasks
- [x] Project empty padding should be `15px` on mobile.
- [x] In the heading edit dialog on mobile, phone number + phone type should be on one row, and email + email type should be on one row.
- [x] Reorganize the language section CSS, remove utility classes, and minimize duplication where possible.
- [x] On mobile, the social section edit button should sit to the left of the chevron like the other sections instead of above it.
- [x] Fix edit dialog positioning so it stays top-aligned on mobile and centered on desktop.
- [x] Clean up the language section CSS file and language section TS utility classes; this is for the section, not the edit dialog.
- [ ] On mobile only, remove the icon from the social edit dialog while keeping it on desktop.
- [ ] Make the empty-state add icons for Resume, Bio, and Projects turn white on hover.
- [ ] Clean up the resume section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [ ] Clean up the project section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [ ] Clean up the skills section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [ ] Clean up the bio section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [ ] Clean up the heading section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [ ] Do a final utility-class audit so only `sr-only` and `hidden` remain.

## Notes
- Add new items here as they come up.
- Work through tasks one by one.
- After each task, stop and let the user review it before running `npm run prepush` or making a commit.
- Once the user approves a task, run `npm run prepush`, fix any resulting errors, then commit only the files for that task.
