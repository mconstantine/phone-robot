import { JsonWebTokenError, sign, SignOptions, verify } from 'jsonwebtoken'
import * as t from 'io-ts'
import { PositiveInteger } from '../globalDomain'
import { pipe } from 'fp-ts/function'
import { Either } from 'fp-ts/Either'
import { RouteError } from '../route'
import { NonEmptyString } from 'io-ts-types'
import { either } from 'fp-ts'

const TokenType = t.keyof(
  {
    USER_ACCESS: true,
    USER_REFRESH: true
  },
  'TokenType'
)
type TokenType = t.TypeOf<typeof TokenType>

function foldTokenType<T>(
  whenUserAccess: () => T,
  whenUserRefresh: () => T
): (type: TokenType) => T {
  return type => {
    switch (type) {
      case 'USER_ACCESS':
        return whenUserAccess()
      case 'USER_REFRESH':
        return whenUserRefresh()
    }
  }
}

interface UserToken {
  type: TokenType
  id: PositiveInteger
}

export function signToken(
  type: TokenType,
  id: PositiveInteger
): Either<RouteError, NonEmptyString> {
  if (!process.env.SECRET) {
    return either.left<RouteError>({
      code: 'UNKNOWN',
      message: 'Unable to sign a token',
      error: new Error('SECRET not found in .env file')
    })
  }

  const options: SignOptions = pipe(
    type,
    foldTokenType<SignOptions>(
      () => ({
        expiresIn: 86400
      }),
      () => ({})
    )
  )

  return either.tryCatch(
    () =>
      sign(
        { type, id } as UserToken,
        process.env.SECRET!,
        options
      ) as NonEmptyString,
    (error): RouteError => ({
      code: 'UNKNOWN',
      message: 'Unable to sign a token',
      error: error as Error
    })
  )
}

export function verifyToken(
  token: NonEmptyString,
  type: TokenType
): Either<RouteError, PositiveInteger> {
  if (!process.env.SECRET) {
    return either.left<RouteError>({
      code: 'UNKNOWN',
      message: 'Unable to verify a token',
      error: new Error('SECRET not found in .env file')
    })
  }

  return pipe(
    either.tryCatch(
      () => verify(token, process.env.SECRET!) as UserToken,
      (error): RouteError => {
        if ((error as JsonWebTokenError).name === 'TokenExpiredError') {
          return {
            code: 'FORBIDDEN',
            message: 'Your access token is expired'
          }
        }

        return {
          code: 'UNKNOWN',
          message: 'Unable to verify a token',
          error: error as Error
        }
      }
    ),
    either.chain((result: UserToken) => {
      if (result.type !== type) {
        return either.left<RouteError>({
          code: 'FORBIDDEN',
          message: 'Your token is invalid'
        })
      }

      return either.right(result.id)
    })
  )
}
