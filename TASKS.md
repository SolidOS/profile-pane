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
- [x] On mobile only, remove the icon from the social edit dialog while keeping it on desktop.
- [x] Make the empty-state add icons for Resume, Bio, and Projects turn white on hover.
- [x] Clean up the resume section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [x] On desktop the email type and input are not next to each other. they should be side by side like the phone and phone type.
- [x] Clean up the skills section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [x] Clean up the bio section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [x] Clean up the heading section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [x] Clean up the contact info section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [x] Clean up the project section CSS: reorganize it, remove duplication where possible, and replace utility classes with specific classes.
- [x] can you check if we have done a pass at cleaning up each sections css files. let me know if there are any more to do and i'll add them to the list.
- [x] Do a final utility-class audit so only `sr-only` and `hidden` remain.
- [x] when an input is not correct like the phone number for instance put a more descriptive message in the error box instead of just unable to save contacts for instance.  check all dialogs and make sure the input checks make specific error message based on teh error that has happened.  only for mutations should the error just be Unable to save "X" X being the section type. if there are no checks for input at least add one for the phone number to allow numbers only and let the user know without a generic message, maybe it's just an error on the input itself like the ones you had done previously checking if it's a url.
- [x] check project card and make sure styling matches design. I need to do this and give you the details.
- [x] check the heading section phone number and email types to see if the defaulted type gets saved similar tot he contacts info problem you fixed earlier.
- [x] the social section on layout = mobile does not have the correct background. can you check the background var used for the other sections and make sure it matches on both desktop and mobile it should match the other sections and again check container, media and layout= mobile so that they are all in line.
- [ ] use wiki data for the business names in resume.
- [ ] hide edit button on socialPane in solid-panes don't remove yet because we may want to add it later make a comment in the code about this doesn't match design will revist.
- [ ] hide displaying websites in socialPane solid-panes again make a comment that they are not on the new design will revist later.
- [ ] fix drag and drop in solid-ui.  look at socialPane in solid-panes at the bullseye icon for adding friends you can see there what function is called in solid-ui that needs fixing.  The other place we need to look is the folder-pane plus icon at the bottom of the page you should be able to drag a file onto that and it will upload the file not open a new tab. Double check this but i think it uses the same solid-ui function as the socialPane bullseye in solid-panes. both of these need to work + on folder pane needs to upload a file and the bullseye needs to add a friend.
- [ ] I need to review the heading edit dialog again the design the date of birth does not look correct. when you get to this ask me to do the review first and give you the details you need to fix.
- [ ] What do you think about teh edit dialog css file is it too big, should we split this up into different css files per section that it is styling. Investigate let me know your thoughts and we will proceed from there.
- [ ] I need to test how the ordered list are working in social section and the languages with the new changes in rdflib please let me know i need to do this when you get to it.
- [ ] again a task for me is to look at solid-logic. I need to bring down the new solid logic  so let me know i need to check this and do this. then i'll need you to set the space up to allow me to make changes there and see them in mashlib.
- [ ] Revisit the mobile heading pronouns layout and edit-button placement later.
- [ ] In resume, when tabbing to the company name, highlight the chevron icon differently.
- [ ] on skills the combobox drop down goes over the dialog footer so that all the values can be seen, can you do htat for all the comboboxes the other seem to go underneath the footer. you'll need to look through all the edit dialog and find the ones that have combobox.  i can think of resume, social, languages, please double check the others just to be sure. maybe do them one by one and i can check each time adn 
we can then commit them separately.

## Notes
- Add new items here as they come up.
- Work through tasks one by one.
- After each task, stop and let the user review it before running `npm run prepush` or making a commit.
- Once the user approves a task, run `npm run prepush`, fix any resulting errors, then commit only the files for that task.
