export const flushAsync = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export async function waitForSelector<T extends Element>(
  root: ParentNode,
  selector: string,
  attempts = 20
): Promise<T> {
  let element = root.querySelector<T>(selector)

  for (let attempt = 0; attempt < attempts && !element; attempt += 1) {
    await flushAsync()
    element = root.querySelector<T>(selector)
  }

  if (!element) {
    throw new Error(`Expected ${selector} to exist`)
  }

  return element
}