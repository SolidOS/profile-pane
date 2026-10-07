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

  // JSDOM axe sees solid-ui-button's shadow DOM as nested interactive content, so
  // hide the custom host and its internal controls before running axe.
  container.querySelectorAll('solid-ui-button').forEach((button) => {
    setTemporaryAttribute(changes, button, 'aria-hidden', 'true')

    button.shadowRoot?.querySelectorAll('button, a, input, [role="button"]').forEach((interactive) => {
      setTemporaryAttribute(changes, interactive, 'aria-hidden', 'true')
    })
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