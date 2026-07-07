import axe from 'axe-core'

type RestorableAttribute = {
  element: Element
  name: string
  value: string | null
}

function setTemporaryAttribute(
  changes: RestorableAttribute[],
  element: Element,
  name: string,
  value: string
) {
  changes.push({ element, name, value: element.getAttribute(name) })
  element.setAttribute(name, value)
}

export async function runAxe(container: Element) {
  const changes: RestorableAttribute[] = []

  // JSDOM axe cannot inspect the native button inside solid-ui-button's shadow DOM,
  // so tests temporarily mirror the host's button semantics before running axe.
  container.querySelectorAll('solid-ui-button').forEach((button) => {
    if (!button.hasAttribute('role')) {
      setTemporaryAttribute(changes, button, 'role', 'button')
    }

    if (!button.hasAttribute('aria-label')) {
      const fallbackLabel = button.getAttribute('label') || button.textContent?.trim()

      if (fallbackLabel) {
        setTemporaryAttribute(changes, button, 'aria-label', fallbackLabel)
      }
    }
  })

  try {
    return await axe.run(container)
  } finally {
    for (let index = changes.length - 1; index >= 0; index -= 1) {
      const change = changes[index]

      if (change.value === null) {
        change.element.removeAttribute(change.name)
      } else {
        change.element.setAttribute(change.name, change.value)
      }
    }
  }
}