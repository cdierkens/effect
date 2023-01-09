/**
 * @since 1.0.0
 */
import * as I from "@fp-ts/schema/internal/common"

/**
 * @since 1.0.0
 */
export interface Hook<A> {
  readonly handler: (...typeParameters: ReadonlyArray<A>) => A
}

/**
 * @since 1.0.0
 */
export const hook = (
  handler: (...typeParameters: ReadonlyArray<any>) => any
): Hook<any> => ({ handler })

/**
 * @since 1.0.0
 */
export const getHook = I.getAnnotation

/**
 * @since 1.0.0
 */
export const ArbitraryHookId = "@fp-ts/schema/annotation/ArbitraryHookId"

/**
 * @since 1.0.0
 */
export const DecoderHookId = "@fp-ts/schema/annotation/DecoderHookId"

/**
 * @since 1.0.0
 */
export const EncoderHookId = "@fp-ts/schema/annotation/EncoderHookId"

/**
 * @since 1.0.0
 */
export const GuardHookId = "@fp-ts/schema/annotation/GuardHookId"

/**
 * @since 1.0.0
 */
export const PrettyHookId = "@fp-ts/schema/annotation/PrettyHookId"
