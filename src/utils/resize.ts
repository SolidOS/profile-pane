export function createResizeDrivenSync(
  update: () => void,
  observedElements: Array<HTMLElement | null | undefined>
): () => void {
  let animationFrameId = 0

  const scheduleUpdate = () => {
    if (animationFrameId !== 0) {
      return
    }

    animationFrameId = window.requestAnimationFrame(() => {
      animationFrameId = 0
      update()
    })
  }

  update()

  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId)
      }

      window.removeEventListener('resize', scheduleUpdate)
    }
  }

  const resizeObserver = new ResizeObserver(scheduleUpdate)
  for (const observedElement of observedElements) {
    if (observedElement) {
      resizeObserver.observe(observedElement)
    }
  }

  return () => {
    if (animationFrameId !== 0) {
      window.cancelAnimationFrame(animationFrameId)
    }

    resizeObserver.disconnect()
  }
}
