import { html, nothing, TemplateResult } from 'lit-html'
import 'solid-ui/components/button'
import { Layout } from '../types'

type ResponsiveActionButtonOptions = {
  layout?: Layout
  className: string
  ariaLabel: string
  variant?: {
    desktop: string
    mobile: string
  }
  onClick: (event: Event) => void
  desktopIcon?: TemplateResult | typeof nothing
  desktopLabel?: string
  mobileIcon?: TemplateResult | typeof nothing
}

export function renderResponsiveActionButton({
  layout = 'desktop',
  className,
  ariaLabel,
  variant = {
    desktop: 'tertiary',
    mobile: 'ghost'
  },
  onClick,
  desktopIcon = nothing,
  desktopLabel,
  mobileIcon = nothing
}: ResponsiveActionButtonOptions): TemplateResult {
  return html`
    <solid-ui-button
      variant=${layout === 'desktop' ? variant.desktop : variant.mobile}
      class=${className}
      aria-label=${ariaLabel}
      @click=${onClick}
    >
      ${layout === 'desktop' ? desktopIcon : nothing}
      ${layout === 'desktop' && desktopLabel ? html`<span class="profile-section-collapsible__action-label">${desktopLabel}</span>` : nothing}
      ${layout === 'mobile' ? mobileIcon : nothing}
    </solid-ui-button>
  `
}
