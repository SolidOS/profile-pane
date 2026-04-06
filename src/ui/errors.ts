import { widgets } from 'solid-ui'

export function complain (div: HTMLElement, d: Document, message: unknown): void {
  div.appendChild(widgets.errorMessageBlock(d, message, 'pink'))
}
