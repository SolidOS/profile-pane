import "@testing-library/jest-dom";
import fetchMock from "jest-fetch-mock";
import { Buffer } from 'buffer' // https://stackoverflow.com/questions/68707553/uncaught-referenceerror-buffer-is-not-defined
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder

fetchMock.enableMocks();

// Added 2024-09

global.Buffer = Buffer

