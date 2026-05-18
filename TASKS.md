# Profile Pane Task List

## Working Notes
- Mobile changes must be implemented in `layout='mobile'`, container queries, and only the necessary media-query fallbacks. `layout='mobile'` and container behavior are the source of truth.
- Prefer `rem` units and mashlib variables from `light.css` where possible.
- For color styling, use general variables for grays and whites where available. `lavender` and primary color variables are fine as-is.
- Remove utility classes other than `sr-only` and `hidden`. Move styles into specific semantic classes; create specific classes when needed.
- Where possible, make like things share the same class and styling so the same UI is styled once instead of through one-off selectors.

## Current Tasks
- [x] In resume, when tabbing to the company name, highlight the chevron icon v differently. it's like a blue border can you do the purple that happens on the other v for select maybe check all combox maybe they are all not correct only select is... it should be like organization drop down tab for v
- [ ] fix drag and drop in solid-ui.  look at socialPane in solid-panes at the bullseye icon for adding friends you can see there what function is called in solid-ui that needs fixing.  The other place we need to look is the folder-pane plus icon at the bottom of the page you should be able to drag a file onto that and it will upload the file not open a new tab. Double check this but i think it uses the same solid-ui function as the socialPane bullseye in solid-panes. both of these need to work + on folder pane needs to upload a file and the bullseye needs to add a friend.
- [x] What do you think about teh edit dialog css file is it too big, should we split this up into different css files per section that it is styling. Investigate let me know your thoughts and we will proceed from there.
- [ ] I need to test how the ordered list are working in social section and the languages with the new changes in rdflib please let me know i need to do this when you get to it.
- [ ] on skills the combobox drop down goes over the dialog footer so that all the values can be seen, can you do htat for all the comboboxes the other seem to go underneath the footer. you'll need to look through all the edit dialog and find the ones that have combobox.  i can think of resume, social, languages, please double check the others just to be sure. maybe do them one by one and i can check each time adn 
we can then commit them separately.

## Notes
- Add new items here as they come up.
- Work through tasks one by one.
- After each task, stop and let the user review it before running `npm run prepush` or making a commit.
- Once the user approves a task, run `npm run prepush`, fix any resulting errors, then commit only the files for that task.
