import { widgets } from 'solid-ui'
import { formatDisplayError } from '../utils/errorDisplay'

export function complain (div: HTMLElement, d: Document, message: unknown): void {
  div.appendChild(widgets.errorMessageBlock(d, formatDisplayError(message), 'pink'))
}
