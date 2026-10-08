import { html } from 'lit-html'
import IconLucideCake from '~icons/lucide/cake'
import IconLucideMapPin from '~icons/lucide/map-pin'
import IconLucideCheck from '~icons/lucide/check'
import IconLucidePlus from '~icons/lucide/plus'
import IconLucideTrash2 from '~icons/lucide/trash-2'
import IconLucideGrid2x2 from '~icons/lucide/grid-2x2'
import IconLucideStar from '~icons/lucide/star'
import IconLucideCircleUser from '~icons/lucide/circle-user'
import IconLucideGlobe from '~icons/lucide/globe'
import IconLucideZap from '~icons/lucide/zap'
import IconLucideMessageSquare from '~icons/lucide/message-square'
import IconLucideMail from '~icons/lucide/mail'
import IconLucideClipboard from '~icons/lucide/clipboard'
import IconLucideX from '~icons/lucide/x'
import IconLucidePencil from '~icons/lucide/pencil'
import IconLucideCamera from '~icons/lucide/camera'
import IconLucideChevronDown from '~icons/lucide/chevron-down'

const registerIcon = (tagName: string, IconClass: any) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, IconClass)
  }
}

registerIcon('icon-lucide-cake', IconLucideCake)
registerIcon('icon-lucide-map-pin', IconLucideMapPin)
registerIcon('icon-lucide-check', IconLucideCheck)
registerIcon('icon-lucide-plus', IconLucidePlus)
registerIcon('icon-lucide-trash-2', IconLucideTrash2)
registerIcon('icon-lucide-grid-2x2', IconLucideGrid2x2)
registerIcon('icon-lucide-star', IconLucideStar)
registerIcon('icon-lucide-circle-user', IconLucideCircleUser)
registerIcon('icon-lucide-globe', IconLucideGlobe)
registerIcon('icon-lucide-zap', IconLucideZap)
registerIcon('icon-lucide-message-square', IconLucideMessageSquare)
registerIcon('icon-lucide-mail', IconLucideMail)
registerIcon('icon-lucide-clipboard', IconLucideClipboard)
registerIcon('icon-lucide-x', IconLucideX)
registerIcon('icon-lucide-pencil', IconLucidePencil)
registerIcon('icon-lucide-camera', IconLucideCamera)
registerIcon('icon-lucide-chevron-down', IconLucideChevronDown)

export const birthdayIcon = html`<icon-lucide-cake style="width: 16px; height: 16px; color: #4A5565;" aria-hidden="true"></icon-lucide-cake>`
export const locationIcon = html`<icon-lucide-map-pin style="width: 16px; height: 16px; color: #4A5565;" aria-hidden="true"></icon-lucide-map-pin>`
export const checkMarkIcon = html`<icon-lucide-check style="width: 14px; height: 14px; color: #7C4DFF;" aria-hidden="true"></icon-lucide-check>`
export const plusDarkIcon = html`<icon-lucide-plus style="width: 14px; height: 14px; color: #314158;" aria-hidden="true"></icon-lucide-plus>`
export const plusIcon = html`<icon-lucide-plus style="width: 12px; height: 12px; color: #7C4DFF;" aria-hidden="true"></icon-lucide-plus>`
export const trashIcon = html`<icon-lucide-trash-2 style="width: 20px; height: 20px; color: #D1D5DC;" aria-hidden="true"></icon-lucide-trash-2>`
export const bentoIcon = html`<icon-lucide-grid-2x2 style="width: 18px; height: 18px; color: #99A1AF;" aria-hidden="true"></icon-lucide-grid-2x2>`
export const starIcon = html`<icon-lucide-star style="width: 30px; height: 30px; color: #F4F4F4;" aria-hidden="true"></icon-lucide-star>`
export const addIcon = html`<icon-lucide-plus style="width: 12px; height: 12px; color: #7C4DFF;" aria-hidden="true"></icon-lucide-plus>`
export const chevronDownIcon = html`<icon-lucide-chevron-down style="width: 18px; height: 18px; color: #6A7282;" aria-hidden="true"></icon-lucide-chevron-down>`
export const personInCircleIcon = html`<icon-lucide-circle-user style="width: 64px; height: 64px; color: #CBD5E1;" aria-hidden="true"></icon-lucide-circle-user>`
export const globeIcon = html`<icon-lucide-globe style="width: 48px; height: 48px; color: #E5E7EB;" aria-hidden="true"></icon-lucide-globe>`
export const lighteningIcon = html`<icon-lucide-zap style="width: 37px; height: 40px; color: #E5E7EB;" aria-hidden="true"></icon-lucide-zap>`
export const commentIcon = html`<icon-lucide-message-square style="width: 32px; height: 32px; color: #E5E7EB;" aria-hidden="true"></icon-lucide-message-square>`
export const envelopeIcon = html`<icon-lucide-mail style="width: 48px; height: 48px; color: #E5E7EB;" aria-hidden="true"></icon-lucide-mail>`
export const pasteIcon = html`<icon-lucide-clipboard style="width: 12px; height: 14px; color: #6A7282;" aria-hidden="true"></icon-lucide-clipboard>`
export const closeIcon = html`<icon-lucide-x style="width: 12px; height: 12px; color: #4A5565;" aria-hidden="true"></icon-lucide-x>`
export const editIcon = html`<icon-lucide-pencil style="width: 14px; height: 14px; color: #1E2939;" aria-hidden="true"></icon-lucide-pencil>`
export const deleteIcon = html`<icon-lucide-x style="width: 14px; height: 14px; color: #6A7282;" aria-hidden="true"></icon-lucide-x>`
export const cameraIcon = html`<icon-lucide-camera style="width: 14px; height: 14px; color: #1E2939;" aria-hidden="true"></icon-lucide-camera>`
export const twoDownArrowsIcon = html`<icon-lucide-chevron-down style="width: 16px; height: 16px; color: #7C4DFF;" aria-hidden="true"></icon-lucide-chevron-down>`
