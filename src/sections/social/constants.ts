import { icons } from 'solid-ui'
import { starIcon } from '../../icons-svg/profileIcons'

export const socialMediaFormName = 'socialMedia.ttl' // The name of the file to upload

const FALLBACK_ICON_URI = `${icons.iconBase}noun_10636_grey.svg` // grey disc

export const DEFAULT_ICON_URI = (() => {
	const svgMarkup = (starIcon as any)?.strings?.join('') || ''
	return svgMarkup ? `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}` : FALLBACK_ICON_URI
})()
