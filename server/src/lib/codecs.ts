import { either } from 'fp-ts'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'

export function getDecodeErrors(errors: t.Errors): string {
  return PathReporter.report(either.left(errors)).join('\n')
}
