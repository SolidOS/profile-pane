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
- [ ] On mobile, the social section edit button should sit to the left of the chevron like the other sections instead of above it.

## Notes
- Add new items here as they come up.
- Work through tasks one by one, validate each change, run `npm run prepush`, fix any resulting errors, then commit.
