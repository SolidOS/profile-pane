import { scheduleDescriptionOverflowCheck } from './sectionCardHelpers'

export function toggleCollapsibleSection(event: Event): void {
  const button = event.currentTarget as HTMLButtonElement | null
  const section = button?.closest('.profile-section-collapsible') as HTMLElement | null
  const panel = section?.querySelector('.profile-section-collapsible__content') as HTMLElement | null
  if (!button || !section || !panel) return

  const nextExpanded = section.getAttribute('data-expanded') !== 'true'
  section.setAttribute('data-expanded', String(nextExpanded))
  button.setAttribute('aria-expanded', String(nextExpanded))
  panel.setAttribute('aria-hidden', String(!nextExpanded))

  if (nextExpanded && typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scheduleDescriptionOverflowCheck()
      })
    })
  }
}