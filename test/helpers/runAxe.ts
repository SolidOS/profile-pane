import axe from 'axe-core'

export async function runAxe(container: Element) {
  // This false positive is caused by Axe interpreting a custom element's shadow DOM
  // as nested interactive content even though the host remains exposed to the tree.
  // Disable only that rule so button names, aria, and other checks still run.
  return await axe.run(container, {
    rules: {
      'nested-interactive': {
        enabled: false
      }
    }
  })
}