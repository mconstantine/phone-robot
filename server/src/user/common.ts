import { Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import * as t from 'io-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { PositiveInteger } from '../globalDomain'
import { RouteError } from '../route'
import { either } from 'fp-ts'
import { signToken } from '../lib/jsonwebtoken'

export const SessionData = t.type({
  accessToken: NonEmptyString,
  refreshToken: NonEmptyString,
  expiration: DateFromISOString
})
export type SessionData = t.TypeOf<typeof SessionData>

export function createSessionData(
  userId: PositiveInteger
): Either<RouteError, SessionData> {
  const expiration = new Date(Date.now() + 86400000)

  return pipe(
    {
      accessToken: signToken('USER_ACCESS', userId),
      refreshToken: signToken('USER_REFRESH', userId)
    },
    sequenceS(either.either),
    either.map(tokens => ({
      ...tokens,
      expiration
    }))
  )
}
