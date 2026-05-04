# Accessibility Smoke Test

Use this short manual smoke test for accessibility-sensitive changes to the profile pane.

## Keyboard-only navigation

- Move through the pane with `Tab` and `Shift+Tab` only.
- Confirm every interactive control is reachable.
- Confirm dialogs open, operate, and close without requiring a mouse.
- Confirm focus returns to a sensible trigger after a dialog closes.

## Screen reader pass

- Run a quick pass with VoiceOver on macOS.
- Confirm headings and landmarks are announced in a sensible order.
- Confirm buttons and links have clear names.
- Confirm dialog title, description, and errors are announced.

## Zoom and reflow

- Check the main profile flows at 200% zoom.
- Check the main profile flows at 400% zoom.
- Confirm core content remains readable and usable without horizontal scrolling where reflow is expected.

## Visible focus

- Confirm the current keyboard focus target is always visually obvious.
- Confirm focus is not hidden by overlays, sticky UI, or clipped containers.

## Status and error announcements

- Trigger at least one validation or save error and confirm it is announced.
- If the change includes save or loading feedback, confirm status updates are announced.