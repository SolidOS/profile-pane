/* Generative AI - Model: GPT-5.3-Codex used for configuration logic */
export const LEVELS = {
  trace: 10,
  log: 20,
  warn: 30,
  error: 40,
  silent: 99
} as const

export type DebugLevel = keyof typeof LEVELS
export type DebugWriter = (level: DebugLevel, ...args: unknown[]) => void
export type DebugLogger = {
  trace: (...args: unknown[]) => void,
  log: (...args: unknown[]) => void,
  warn: (...args: unknown[]) => void,
  error: (...args: unknown[]) => void
}

export const DEBUG_LEVEL_OPTIONS = Object.keys(LEVELS) as DebugLevel[]

type ConfigureDebugOptions = {
  level?: DebugLevel,
  writer?: DebugWriter | null
}

type ConfigureDebugForBrowserOptions = {
  defaultLevel?: DebugLevel,
  writer?: DebugWriter | null,
  search?: string,
  storageKey?: string,
  globalKey?: string
}

const DEBUG_QUERY_PARAM = 'debug'
const DEBUG_STORAGE_KEY = 'profile-pane:debug'
const DEBUG_GLOBAL_KEY = '__PROFILE_PANE_DEBUG__'

let currentLevel: DebugLevel = 'warn'
let sink: DebugWriter | null = defaultWriter

function isDebugLevel(value: unknown): value is DebugLevel {
  return typeof value === 'string' && value in LEVELS
}

function getConsole(): Console | null {
  return typeof globalThis.console === 'object' && globalThis.console ? globalThis.console : null
}

function readStoredDebugLevel(storageKey: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function writeStoredDebugLevel(storageKey: string, level: DebugLevel | null): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    if (level === null) {
      window.localStorage.removeItem(storageKey)
      return
    }

    window.localStorage.setItem(storageKey, level)
  } catch {
    // Ignore storage failures in restricted browsing contexts.
  }
}

function readGlobalDebugLevel(globalKey: string): unknown {
  return (globalThis as Record<string, unknown>)[globalKey]
}

function normalizeDebugLevel(value: unknown): DebugLevel | null {
  return isDebugLevel(value) ? value : null
}

function defaultWriter(level: DebugLevel, ...args: unknown[]): void {
  const consoleRef = getConsole()
  if (!consoleRef) return

  if (level === 'trace' && typeof consoleRef.debug === 'function') {
    consoleRef.debug(...args)
    return
  }

  if (level === 'warn' && typeof consoleRef.warn === 'function') {
    consoleRef.warn(...args)
    return
  }

  if (level === 'error' && typeof consoleRef.error === 'function') {
    consoleRef.error(...args)
    return
  }

  if (level === 'log' && typeof consoleRef.info === 'function') {
    consoleRef.info(...args)
    return
  }

  if (typeof consoleRef.log === 'function') {
    consoleRef.log(...args)
  }
}

export function getDebugLevel(): DebugLevel {
  return currentLevel
}

export function configureDebug(options: ConfigureDebugOptions = {}): DebugLevel {
  const level = options.level ?? 'warn'
  currentLevel = level
  sink = options.writer === undefined ? defaultWriter : options.writer
  return currentLevel
}

export function resolveDebugLevelForBrowser(
  options: Omit<ConfigureDebugForBrowserOptions, 'writer'> = {}
): DebugLevel {
  const defaultLevel = options.defaultLevel ?? 'warn'
  const storageKey = options.storageKey ?? DEBUG_STORAGE_KEY
  const globalKey = options.globalKey ?? DEBUG_GLOBAL_KEY

  const search = options.search
    ?? (typeof window !== 'undefined' ? window.location.search : '')

  const params = new URLSearchParams(search)
  const queryLevel = normalizeDebugLevel(params.get(DEBUG_QUERY_PARAM))
  if (queryLevel) {
    return queryLevel
  }

  const storedLevel = normalizeDebugLevel(readStoredDebugLevel(storageKey))
  if (storedLevel) {
    return storedLevel
  }

  const globalLevel = normalizeDebugLevel(readGlobalDebugLevel(globalKey))
  if (globalLevel) {
    return globalLevel
  }

  return defaultLevel
}

export function configureDebugForBrowser(
  options: ConfigureDebugForBrowserOptions = {}
): DebugLevel {
  const level = resolveDebugLevelForBrowser(options)
  return configureDebug({ level, writer: options.writer })
}

export function setBrowserDebugLevel(
  level: DebugLevel,
  options: Pick<ConfigureDebugForBrowserOptions, 'storageKey' | 'writer'> = {}
): DebugLevel {
  writeStoredDebugLevel(options.storageKey ?? DEBUG_STORAGE_KEY, level)
  return configureDebug({ level, writer: options.writer })
}

export function clearBrowserDebugLevel(storageKey = DEBUG_STORAGE_KEY): void {
  writeStoredDebugLevel(storageKey, null)
}

export function isDebugEnabled(level: DebugLevel = 'log'): boolean {
  return LEVELS[level] >= LEVELS[currentLevel]
}

function emit(level: DebugLevel, args: unknown[]): void {
  if (!sink) return
  if (!isDebugEnabled(level)) return
  sink(level, ...args)
}

export function log(...args: unknown[]): void {
  emit('log', args)
}

export function warn(...args: unknown[]): void {
  emit('warn', args)
}

export function error(...args: unknown[]): void {
  emit('error', args)
}

export function trace(...args: unknown[]): void {
  emit('trace', args)
}

export function createDebugLogger(scope: string): DebugLogger {
  const prefix = `[${scope}]`

  return {
    trace: (...args: unknown[]) => trace(prefix, ...args),
    log: (...args: unknown[]) => log(prefix, ...args),
    warn: (...args: unknown[]) => warn(prefix, ...args),
    error: (...args: unknown[]) => error(prefix, ...args)
  }
}
