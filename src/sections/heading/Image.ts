import { html } from 'lit-html'
import { keyed } from 'lit-html/directives/keyed.js'
import { personInCircleIcon } from '../../icons-svg/profileIcons'

function showImageFallback(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null
  const frame = image?.parentElement
  if (!image || !frame) {
    return
  }

  image.hidden = true
  frame.classList.add('profile__image-frame--fallback')
}

// The same image slot can swap from a failed remote URL to a fresh blob preview.
// Keying the frame by src forces Lit to replace stale fallback-marked DOM.
export const Image = (src: string, alt: string) => html`
  ${keyed(src || '__fallback__', html`
    <div class=${src ? 'profile__image-frame' : 'profile__image-frame profile__image-frame--fallback'}>
      ${src
        ? html`
            <img
              class="profile__hero"
              src=${src}
              alt="${alt}"
              width="140"
              height="140"
              loading="eager"
              @error=${showImageFallback}
            />
          `
        : null}
      <div class="profile__hero-alt" role="img" aria-label="${alt}">
        <span class="profile__hero-icon">${personInCircleIcon}</span>
      </div>
    </div>
  `)}
`
