
import '@testing-library/jest-dom'
import fetchMock from 'jest-fetch-mock'
import { Buffer } from 'buffer' // https://stackoverflow.com/questions/68707553/uncaught-referenceerror-buffer-is-not-defined
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

fetchMock.enableMocks()

// Added 2024-09
global.Buffer = Buffer

