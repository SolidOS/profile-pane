
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

// Workaround for nwsapi (jsdom's CSS selector engine) corrupting complex
// ::slotted() selectors from @awesome.me/webawesome.
//
// webawesome uses ::slotted(:not(img, svg)) which is CSS Selectors Level 4
// (:not() with multiple arguments). nwsapi doesn't support this and corrupts
// it into invalid selectors like 'slot >img,,src,,,.svg,'.
//
// Patch nwsapi's Resolver.compile to silently drop unparseable selectors
// instead of throwing SyntaxError.
//
// See https://github.com/jsdom/jsdom/issues/3762
try {
  const nwsapi = require('nwsapi/src/nwsapi')
  if (nwsapi && nwsapi.Resolver) {
    const origCompile = nwsapi.Resolver.prototype.compile
    nwsapi.Resolver.prototype.compile = function (selector: string, ...args: any[]) {
      try {
        return origCompile.call(this, selector, ...args)
      } catch {
        // Return a no-match resolver for unparseable selectors
        return { matches: () => false, select: () => [] }
      }
    }
  }
} catch { /* nwsapi not directly requireable */ }

// Fallback: if nwsapi patching failed, wrap getComputedStyle and axe's
// internal flattenTree to catch the SyntaxError at a higher level.
if (typeof window !== 'undefined' && !(window as any).__nwsapiPatched) {
  (window as any).__nwsapiPatched = true

  const origGetComputedStyle = window.getComputedStyle
  window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
    try {
      return origGetComputedStyle.call(window, elt, pseudoElt)
    } catch (e) {
      if ((e as Error)?.message?.includes('not a valid selector')) {
        // Return empty style on nwsapi parse failure
        return {} as CSSStyleDeclaration
      }
      throw e
    }
  }
}

// Stub @shoelace-style/localize — it imports browser APIs not available in jsdom
// and is a transitive dependency of @awesome.me/webawesome.
jest.mock('@shoelace-style/localize', () => ({
  LocalizeController: class {},
  registerTranslation: () => {},
}), { virtual: true })

