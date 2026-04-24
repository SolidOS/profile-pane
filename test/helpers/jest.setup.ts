
import '@testing-library/jest-dom'
import fetchMock from 'jest-fetch-mock'
import { Buffer } from 'buffer' // https://stackoverflow.com/questions/68707553/uncaught-referenceerror-buffer-is-not-defined
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

// Load modules that depend on TextEncoder/TextDecoder only after globals are ready.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const $rdf = require('rdflib');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SolidLogic = require('solid-logic');

(global as any).$rdf = $rdf;
(global as any).SolidLogic = SolidLogic;
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

fetchMock.enableMocks()

// Workaround for axe-core calling canvas.getContext in jsdom
// (jsdom does not implement canvas without installing the canvas package)
if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: function () {
    return {
      canvas: this,
      getImageData: () => ({ data: new Uint8ClampedArray() }),
      putImageData: () => {},
      createImageData: () => [],
      measureText: () => ({ width: 0 }),
      fillText: () => {},
      strokeText: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      rect: () => {},
      fill: () => {},
      stroke: () => {},
    } as any
    }
  })
}

// Added 2024-09
global.Buffer = Buffer

