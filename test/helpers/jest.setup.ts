
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

// Jest/jsdom polyfill for custom element form internals methods not implemented by jsdom.
// In jsdom, attachInternals() exists for custom elements, but ElementInternals.prototype
// may lack setFormValue and other form-associated methods used by solid-ui components.
if (typeof (globalThis as any).ElementInternals !== 'undefined') {
  const internalsPrototype = (globalThis as any).ElementInternals.prototype
  if (internalsPrototype && typeof internalsPrototype.setFormValue !== 'function') {
    internalsPrototype.setFormValue = function (_value: unknown) {
      // noop: jsdom does not fully support form-associated custom elements.
    }
  }
  if (internalsPrototype && typeof internalsPrototype.setValidity !== 'function') {
    internalsPrototype.setValidity = function (_flags: unknown, _message?: string) {
      // noop: provide minimal compatibility for custom element validation handling.
    }
  }
}

// Added 2024-09
global.Buffer = Buffer

