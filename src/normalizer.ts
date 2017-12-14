import { whiteBright } from 'cli-color'
import { cloneDeep } from 'lodash'
import { JSONSchema, NormalizedJSONSchema } from './types/JSONSchema'
import { justName, log, mapDeep, toSafeString } from './utils'
import stringify = require('json-stringify-safe')

type Rule = (schema: JSONSchema, rootSchema: JSONSchema, fileName?: string) => JSONSchema
const rules = new Map<string, Rule>()

rules.set('Destructure unary types', schema => {
  if (schema.type && Array.isArray(schema.type) && schema.type.length === 1) {
    schema.type = schema.type[0]
  }
  return schema
})

rules.set('Add empty `required` property if none is defined', (schema, rootSchema) => {
  if (stringify(schema) === stringify(rootSchema) && !('required' in schema)) {
    schema.required = []
  }
  return schema
})

rules.set('Default additionalProperties to false', (schema, rootSchema) => {
  if (stringify(schema) === stringify(rootSchema) && !('additionalProperties' in schema)) {
    schema.additionalProperties = false
  }
  return schema
})

rules.set('Default top level `$id`', (schema, rootSchema, fileName) => {
  if (!schema['$id'] && stringify(schema) === stringify(rootSchema)) {
    schema['$id'] = toSafeString(justName(fileName))
  }
  return schema
})

export function normalize(schema: JSONSchema, filename?: string): NormalizedJSONSchema {
  let _schema = cloneDeep(schema) as NormalizedJSONSchema
  rules.forEach((rule, key) => {
    _schema = mapDeep(_schema, schema => rule(schema, _schema, filename)) as NormalizedJSONSchema
    log(whiteBright.bgYellow('normalizer'), `Applied rule: "${key}"`)
  })
  return _schema
}
