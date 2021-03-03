import { compareSync, hashSync } from 'bcryptjs'
import { either } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { NonEmptyString } from 'io-ts-types'
import { RouteError } from '../route'

export function hash(
  plainInput: NonEmptyString
): Either<RouteError, NonEmptyString> {
  return either.tryCatch(
    () => hashSync(plainInput, 10) as NonEmptyString,
    (error): RouteError => ({
      code: 'UNKNOWN',
      message: 'Unable to encrypt a string',
      error: error as Error
    })
  )
}

export function compare(
  plainInput: NonEmptyString,
  hash: NonEmptyString
): Either<RouteError, boolean> {
  return either.tryCatch(
    () => compareSync(plainInput, hash),
    (error): RouteError => ({
      code: 'UNKNOWN',
      message: 'Unable to decrypt a string',
      error: error as Error
    })
  )
}
