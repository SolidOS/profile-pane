//
//   Media input widget
//
//
// Workflow:
// The HTML5 functionality (on mobile) is to prompt for either
// a realtime camera capture, OR a selection from images already on the device
// (eg camera roll).
//
// The solid alternative is to either take a photo
// or access camera roll (etc) OR to access solid cloud storage of favorite photo albums.
// (Especially latest taken ones)
//

// Copied from solid-ui needed to change somethings, have made a PR in solid-ui 
import { widgets, icons, style } from 'solid-ui'
import { IndexedFormula, NamedNode } from 'rdflib'

const cameraIcon = icons.iconBase + 'noun_Camera_1618446_000000.svg' // Get it from github
const retakeIcon = icons.iconBase + 'noun_479395.svg' // Get it from github

const contentType = 'image/png'

/** A control to capture a picture using camera
 * @param {Docuemnt} dom - The Document object
 * @param {IndexedForumla} store - The quadstore to store data in
 * @param {NamedNode} getImageDoc() - NN of the image file to be created
 * @param {function} doneCallback - Called when a picture has been taken
 */
export function cameraCaptureControl (
  dom: HTMLDocument,
  store: IndexedFormula,
  getImageDoc: () => NamedNode,
  doneCallback: (imageDoc: NamedNode | null) => Promise<void>
) {
  const div = dom.createElement('div')
  div.className = 'profile-edit-dialog__camera-control'
  let destination, imageBlob, player, canvas

  const setButtonVisible = (button: HTMLElement, visible: boolean) => {
    button.style.display = visible ? 'inline-flex' : 'none'
  }

  const table = div.appendChild(dom.createElement('table'))
  const mainTR = table.appendChild(dom.createElement('tr'))
  const main = mainTR.appendChild(dom.createElement('td'))
  main.setAttribute('colspan', '4')
  main.style.textAlign = 'center'

  const actionBar = div.appendChild(dom.createElement('div'))
  actionBar.className = 'profile-edit-dialog__camera-control-actions'

  const cancelButton = actionBar.appendChild(widgets.cancelButton(dom))
  cancelButton.classList.add('profile-edit-dialog__camera-control-cancel')
  cancelButton.addEventListener('click', _event => {
    stopVideo()
    doneCallback(null)
  })

  const retakeButton = actionBar.appendChild(widgets.button(dom, retakeIcon, 'Retake'))
  retakeButton.classList.add('profile-edit-dialog__camera-control-action')
  retakeButton.addEventListener('click', _event => {
    retake()
  })
  retakeButton.textContent = 'Retake'
  setButtonVisible(retakeButton, false)

  const shutterButton = actionBar.appendChild(
    widgets.button(dom, icons.iconBase + 'noun_10636.svg', 'Snap')
  )
  shutterButton.classList.add('profile-edit-dialog__camera-control-action')
  shutterButton.addEventListener('click', grabCanvas)
  shutterButton.textContent = 'Take Photo'
  setButtonVisible(shutterButton, false)

  const sendButton = actionBar.appendChild(widgets.continueButton(dom))
  sendButton.classList.add('profile-edit-dialog__camera-control-action')
  sendButton.addEventListener('click', _event => {
    saveBlob(imageBlob, destination)
  })
  sendButton.textContent = 'Use Photo'
  setButtonVisible(sendButton, false)

  function displayPlayer () {
    player = main.appendChild(dom.createElement('video'))
    player.setAttribute('controls', '1')
    player.setAttribute('autoplay', '1')
    player.setAttribute('style', style.controlStyle)
    if (!navigator.mediaDevices) {
      throw new Error('navigator.mediaDevices not available')
    }
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      player.srcObject = stream
      setButtonVisible(shutterButton, true)
      setButtonVisible(sendButton, false)
      setButtonVisible(retakeButton, false)
    }).catch(err => {
      console.error('Unable to start camera preview', err)
      doneCallback(null)
    })
  }

  const constraints = {
    video: {
      facingMode: { ideal: 'environment' }
    }
  }

  function retake () {
    main.removeChild(canvas)
    displayPlayer() // Make new one as old one is stuck black
  }

  function grabCanvas () {
    // Draw the video frame to the canvas.
    canvas = dom.createElement('canvas')
    canvas.setAttribute('width', style.canvasWidth)
    canvas.setAttribute('height', style.canvasHeight)
    canvas.setAttribute('style', style.controlStyle)
    main.appendChild(canvas)

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get canvas context for camera snapshot')
    }
    context.drawImage(player, 0, 0, canvas.width, canvas.height)
    stopVideo()

    player.parentNode.removeChild(player)

    canvas.toBlob(blob => {
      if (!blob) {
        throw new Error('Camera snapshot failed: no image blob produced')
      }
      const msg = `got blob type ${blob.type} size ${blob.size}`
      console.debug(msg)
      destination = getImageDoc()
      imageBlob = blob // save for review
      reviewImage()
      // alert(msg)
    }, contentType) // toBlob
  }

  function reviewImage () {
    setButtonVisible(sendButton, true)
    setButtonVisible(retakeButton, true)
    setButtonVisible(shutterButton, false)
  }

  function stopVideo () {
    if (player && player.srcObject) {
      player.srcObject.getVideoTracks().forEach(track => track.stop())
    }
  }
  function saveBlob (blob, destination) {
    if (!blob || !destination) return
    const contentType = blob.type
    // if (!confirm('Save picture to ' + destination + ' ?')) return
    console.debug(
      'Putting ' + blob.size + ' bytes of ' + contentType + ' to ' + destination
    )
    // @@ TODO Remove casting
    ;(store as any).fetcher
      .webOperation('PUT', destination.uri, {
        data: blob,
        contentType
      })
      .then(
        _resp => {
          console.debug('ok saved ' + destination)
          stopVideo()
          doneCallback(destination)
        },
        err => {
          stopVideo()
          alert(err)
        }
      )
  }

  // Attach the video stream to the video element and autoplay.
  displayPlayer()
  return div
}

/** A button to capture a picture using camera
 * @param {Docuemnt} dom - The Document object
 * @param {IndexedForumla} store - The quadstore to store data in
 * @param {fuunction} getImageDoc - returns NN of the image file to be created
 * @param {function<Node>} doneCallback - called with the image taken
 * @returns {DomElement} - A div element with the button in it
 *
 * This expands the button to a large control when it is pressed
 */

export function cameraButton (
  dom: HTMLDocument,
  store: IndexedFormula,
  getImageDoc: () => NamedNode,
  doneCallback: (imageDoc: NamedNode | null) => Promise<void>
): HTMLElement {
  const div = dom.createElement('div')
  const but = widgets.button(dom, cameraIcon, 'Take picture')
  let control
  async function restoreButton (imageDoc: NamedNode | null) {
    div.removeChild(control)
    div.appendChild(but)
    await doneCallback(imageDoc)
  }
  div.appendChild(but)
  but.addEventListener('click', _event => {
    div.removeChild(but)
    control = cameraCaptureControl(
      dom,
      store,
      getImageDoc,
      restoreButton
    )
    div.appendChild(control)
  })
  return div
}
