import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import { verifyToken } from '../lib/jsonwebtoken'
import {
  HandlerInput,
  makeRoute,
  okRouteResponse,
  RouteError,
  RouteResponse
} from '../route'
import { createSessionData, SessionData } from './userCommon'
import { getUserById } from './userDatabase'

const RefreshTokenInput = t.type(
  {
    refreshToken: NonEmptyString
  },
  'RefreshTokenInput'
)
type RefreshTokenInput = t.TypeOf<typeof RefreshTokenInput>

function refreshToken(
  input: HandlerInput<RefreshTokenInput, unknown>
): TaskEither<RouteError, RouteResponse<SessionData>> {
  return pipe(
    verifyToken(input.body.refreshToken, 'USER_REFRESH'),
    taskEither.fromEither,
    taskEither.chain(getUserById),
    taskEither.chain(
      taskEither.fromOption<RouteError>(() => ({
        code: 'NOT_FOUND',
        message: 'The user referenced by the refresh token was not found'
      }))
    ),
    taskEither.chain(user => taskEither.fromEither(createSessionData(user.id))),
    taskEither.map(okRouteResponse)
  )
}

export const refreshTokenRoute = makeRoute(
  RefreshTokenInput,
  SessionData,
  t.unknown,
  refreshToken,
  false
)
