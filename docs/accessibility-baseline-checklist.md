# Accessibility Baseline Checklist

This checklist captures the baseline rules we enforce in profile section markup and verify with axe.

## Semantic structure

- Use semantic sectioning and heading elements (`section`, `header`, `h2`, `h3`, etc.) where appropriate.
- Do not skip heading levels within a section hierarchy.
- Do not render empty headings. If text is optional, render a non-heading element (for example `p`) or do not render the element.

## ARIA usage

- Only use ARIA attributes that are valid for the element role.
- Do not put `aria-label` on a generic element unless it has an appropriate role.
- If labeling a grouped region of plain elements, add a semantic role such as `role="group"` and then apply the label.
- Prefer native semantics first; add ARIA only when native HTML does not provide the needed meaning.

## Text alternatives

- All meaningful images must have accurate `alt` text.
- Decorative icons should use `aria-hidden="true"`.
- Fallback avatar blocks should expose an accessible name when no photo exists.

## Interactive controls

- Buttons and links must have a clear accessible name.
- Icon-only buttons must include an `aria-label` or visible text.
- Interactive controls must remain keyboard reachable and operable.

## Conditional rendering safety

- For optional data, use null-safe access and sensible fallback values.
- Avoid rendering empty semantic containers that can trigger accessibility violations.

## Lists and grouping

- For list content, use proper list semantics (`ul`/`ol` + `li`).
- For grouped non-list content, use a semantic wrapper and only add ARIA where needed.

## Testing workflow

- Run the focused accessibility test after markup changes:
  - `npm test -- test/profile-view.accessibility.test.ts`
- If violations appear, fix semantic/ARIA issues before adding test exceptions.
- Keep fixes in source markup, not in test-only workarounds.

## Common pitfalls this project has hit

- `aria-label` on a `div` without role.
- Rendering optional heading tags with empty content.
- Skipping heading levels by introducing `h4` where no preceding heading level exists.
- Assuming optional profile fields always exist during render.
