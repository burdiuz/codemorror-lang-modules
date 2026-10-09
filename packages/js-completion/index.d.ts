import type { CompletionSource } from '@codemirror/autocomplete'
import type { Extension } from '@codemirror/state'
import type { LanguageSupport } from '@codemirror/language'

export interface JsCompletionConfig {
  /**
   * Names read from `globalThis` (missing ones are skipped), or a scope object
   * `{name: value}`. Defaults to `DEFAULT_GLOBALS` (no `window`/`document`).
   */
  globals?: string[] | Record<string, unknown>
}

/** Globals suggested by default. */
export const DEFAULT_GLOBALS: string[]

/** Turns `globals` config into a `{name: value}` scope. */
export function resolveScope(globals?: JsCompletionConfig['globals']): Record<string, unknown>

/** Autocompletion source for JS globals and members after a dot. */
export function jsCompletionSource(config?: JsCompletionConfig): CompletionSource

/**
 * Extension adding the source to `support.language`. Pass the same (wrapped, if
 * using tagged-template embeds) support the editor uses.
 */
export function createSupportExtension(
  support: LanguageSupport,
  config?: JsCompletionConfig
): Extension
