import * as A from "@fp-ts/codec/Annotation"
import type { AST } from "@fp-ts/codec/AST"
import * as S from "@fp-ts/codec/Schema"
import type { Schema } from "@fp-ts/codec/Schema"
import { identity, pipe } from "@fp-ts/data/Function"
import * as O from "@fp-ts/data/Option"
import Ajv from "ajv"

type JSONSchema =
  | {
    readonly type: "string"
    readonly minLength?: number
    readonly maxLength?: number
  }
  | {
    readonly type: "number"
    readonly exclusiveMaximum?: number
    readonly exclusiveMinimum?: number
    readonly maximum?: number
    readonly minimum?: number
  }
  | { readonly type: "boolean" }

const JSONSchemaAnnotationId: unique symbol = Symbol.for(
  "@fp-ts/codec/JSONSchemaAnnotation"
) as JSONSchemaAnnotationId

/**
 * @since 1.0.0
 * @category symbol
 */
export type JSONSchemaAnnotationId = typeof JSONSchemaAnnotationId

export interface JSONSchemaAnnotation {
  readonly _id: JSONSchemaAnnotationId
  readonly jsonSchemaFor: (
    annotations: A.Annotations,
    ...jsonSchemas: ReadonlyArray<JSONSchema>
  ) => JSONSchema
}

/**
 * @since 1.0.0
 */
export const jsonSchemaAnnotation = (
  jsonSchemaFor: (
    annotations: A.Annotations,
    ...jsonSchemas: ReadonlyArray<JSONSchema>
  ) => JSONSchema
): JSONSchemaAnnotation => ({ _id: JSONSchemaAnnotationId, jsonSchemaFor })

export const isJSONSchemaAnnotation = (u: unknown): u is JSONSchemaAnnotation =>
  typeof u === "object" && u != null && "_id" in u && u["_id"] === JSONSchemaAnnotationId

const go = S.memoize((ast: AST): JSONSchema => {
  switch (ast._tag) {
    case "Declaration": {
      return pipe(
        A.find(ast.annotations, isJSONSchemaAnnotation),
        O.map((annotation) => annotation.jsonSchemaFor(ast.annotations, ...ast.nodes.map(go))),
        O.match(() => {
          throw new Error(
            `Missing "JSONSchemaAnnotation" for ${
              pipe(A.getName(ast.annotations), O.getOrElse("<anonymous data type>"))
            }`
          )
        }, identity)
      )
    }
    case "String": {
      return {
        type: "string",
        minLength: ast.minLength,
        maxLength: ast.maxLength
      }
    }
    case "Number":
      return {
        type: "number",
        minimum: ast.minimum,
        maximum: ast.maximum,
        exclusiveMinimum: ast.exclusiveMinimum,
        exclusiveMaximum: ast.exclusiveMaximum
      }
    case "Boolean": {
      return {
        type: "boolean"
      }
    }
  }
  throw new Error(`Unhandled ${ast._tag}`)
})

export const unsafeJsonSchemaFor = S.memoize(<A>(schema: Schema<A>): JSONSchema => go(schema.ast))

describe("unsafeJsonSchemaFor", () => {
  const jsonSchemaFor_ = unsafeJsonSchemaFor

  it("string", () => {
    const schema = S.string
    const validate = new Ajv().compile(jsonSchemaFor_(schema))
    expect(validate("a")).toEqual(true)
    expect(validate(1)).toEqual(false)
  })

  it("boolean", () => {
    const schema = S.boolean
    const validate = new Ajv().compile(jsonSchemaFor_(schema))
    expect(validate(true)).toEqual(true)
    expect(validate(false)).toEqual(true)
    expect(validate(1)).toEqual(false)
  })

  it("minLength", () => {
    const schema = pipe(S.string, S.minLength(1))
    const validate = new Ajv().compile(jsonSchemaFor_(schema))
    expect(validate("a")).toEqual(true)
    expect(validate("aa")).toEqual(true)

    expect(validate("")).toEqual(false)
  })

  it("maxLength", () => {
    const schema = pipe(S.string, S.maxLength(1))
    const validate = new Ajv().compile(jsonSchemaFor_(schema))
    expect(validate("")).toEqual(true)
    expect(validate("a")).toEqual(true)

    expect(validate("aa")).toEqual(false)
  })

  it("minimum", () => {
    const schema = pipe(S.number, S.minimum(1))
    const validate = new Ajv().compile(jsonSchemaFor_(schema))
    expect(validate(1)).toEqual(true)
    expect(validate(2)).toEqual(true)

    expect(validate(0)).toEqual(false)
  })

  it("maximum", () => {
    const schema = pipe(S.number, S.maximum(1))
    const validate = new Ajv().compile(jsonSchemaFor_(schema))
    expect(validate(0)).toEqual(true)
    expect(validate(1)).toEqual(true)

    expect(validate(2)).toEqual(false)
  })
})
