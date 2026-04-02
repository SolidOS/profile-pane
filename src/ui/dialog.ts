import './styles/dialog.css'

/* Copied from issue-pane, minor typescript adjustments */
let modalOverlay: HTMLDivElement | null = null
let previousFocus: Element | null = null

type DialogButtonValue = boolean | 'save' | null

function ensureModalOverlay (dom: Document): HTMLDivElement {
  // if we previously created an overlay but it was removed from the document
  // (tests clear body), rebuild it.  Checking presence ensures our reference
  // doesn't point at a detached element.
  if (modalOverlay && dom.body.contains(modalOverlay)) return modalOverlay
  // otherwise drop stale reference and create a new element
  modalOverlay = null
  // overlay container
  modalOverlay = dom.createElement('div')
  modalOverlay.id = 'profile-modal'
  modalOverlay.className = 'focus-trap hidden'
  modalOverlay.setAttribute('role', 'presentation')

  modalOverlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
      <h2 id="modal-title"></h2>
      <div id="modal-desc"></div>
      <div id="modal-buttons"></div>
    </div>
  `

  dom.body.appendChild(modalOverlay)

  // keyboard handling (esc/tab)
  modalOverlay.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      // simulate cancel if available
      const cancelBtn = modalOverlay.querySelector('button[data-cancel]') as HTMLButtonElement | null
      if (cancelBtn) cancelBtn.click()
      else closeModal(false)
    } else if (e.key === 'Tab') {
      // simple focus trap: cycle through focusable elements inside overlay
      const focusable = Array.from(
        modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('disabled')) as HTMLElement[]
      if (focusable.length === 0) return
      const idx = focusable.indexOf(dom.activeElement as HTMLElement)
      if (e.shiftKey) {
        if (idx === 0) {
          focusable[focusable.length - 1].focus()
          e.preventDefault()
        }
      } else {
        if (idx === focusable.length - 1) {
          focusable[0].focus()
          e.preventDefault()
        }
      }
    }
  })

  return modalOverlay
}

function hideSiblings (hide: boolean, dom: Document): void {
  const siblings = Array.from(dom.body.children).filter((c) => c !== modalOverlay) as HTMLElement[]
  siblings.forEach((el) => {
    if (hide) el.setAttribute('aria-hidden', 'true')
    else el.removeAttribute('aria-hidden')
  })
}

function openModal ({ title, message, buttons, dom }: { title?: string, message?: string | Node, buttons: Array<{ label: string, value: DialogButtonValue, primary?: boolean, cancel?: boolean }>, dom: Document }) {
  const overlay = ensureModalOverlay(dom)

  previousFocus = dom.activeElement
  hideSiblings(true, dom)
  overlay.classList.remove('hidden')

  overlay.querySelector('#modal-title').textContent = title || ''
  const descEl = overlay.querySelector('#modal-desc') as HTMLDivElement
  if (typeof message === 'string') {
    descEl.textContent = message
  } else {
    // allow passing nodes
    descEl.innerHTML = ''
    descEl.appendChild(message)
  }

  const btnContainer = overlay.querySelector('#modal-buttons') as HTMLDivElement
  btnContainer.innerHTML = ''

  return new Promise<DialogButtonValue>((resolve) => {
    buttons.forEach((btn) => {
      const b = dom.createElement('button')
      b.setAttribute('type', 'button')
      b.textContent = btn.label
      if (btn.primary) b.classList.add('btn-primary')
      if (btn.cancel) b.setAttribute('data-cancel', 'true')
      b.addEventListener('click', () => {
        closeModal(btn.value)
        resolve(btn.value)
      })
      btnContainer.appendChild(b)
    })
    // focus first button
    const first = btnContainer.querySelector('button') as HTMLButtonElement | null
    if (first) first.focus()
  })
}

function closeModal (_result: DialogButtonValue): void {
  if (modalOverlay) {
    const modalDom = modalOverlay.ownerDocument
    modalOverlay.classList.add('hidden')
    hideSiblings(false, modalDom)
    if (previousFocus && 'focus' in previousFocus) (previousFocus as HTMLElement).focus()
  }
}

export function alertDialog (message: string, title = 'Information', dom: Document) {
  return openModal({
    title,
    message,
    buttons: [{ label: 'OK', value: true, primary: true }],
    dom
  })
}

type OpenInputDialogCustom = {
  title: string,
  dom: Document,
  form: HTMLFormElement,
  submitLabel?: string,
  cancelLabel?: string
}

type InputDialogValues = Record<string, string>

export function openInputDialog (options: OpenInputDialogCustom): Promise<InputDialogValues | null> {
  const submitLabel = options.submitLabel || 'Save Changes'
  const cancelLabel = options.cancelLabel || 'Cancel'

  let messageNode: Node
  let form: HTMLFormElement | null = null

  if ('content' in options) {
    messageNode = options.content
    form = options.form || (options.content instanceof HTMLFormElement ? options.content : null)
  } 

  return openModal({
    title: options.title,
    message: messageNode,
    buttons: [
      { label: cancelLabel, value: null, cancel: true },
      { label: submitLabel, value: 'save', primary: true }
    ],
    dom: options.dom
  }).then((result) => {
    if (result !== 'save') return null
    if (!form) return {}

    const data = new FormData(form)
    const values: InputDialogValues = {}
    data.forEach((value, key) => {
      values[key] = String(value)
    })
    return values
  })
}
