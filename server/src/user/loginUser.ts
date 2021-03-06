import { boolean, either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { NonEmptyString } from 'io-ts-types'
import { compare } from '../lib/bcryptjs'
import {
  HandlerInput,
  makeRoute,
  okRouteResponse,
  RouteError,
  RouteResponse
} from '../route'
import { createSessionData, SessionData } from './userCommon'
import { getUserByUsername } from './userDatabase'

const LoginInput = t.type(
  {
    username: NonEmptyString,
    password: NonEmptyString
  },
  'LoginInput'
)
type LoginInput = t.TypeOf<typeof LoginInput>

function login(
  input: HandlerInput<LoginInput>
): TaskEither<RouteError, RouteResponse<SessionData>> {
  return pipe(
    getUserByUsername(input.body.username),
    taskEither.chain(
      taskEither.fromOption<RouteError>(() => ({
        code: 'NOT_FOUND',
        message: 'No user found for this username'
      }))
    ),
    taskEither.chain(user =>
      pipe(
        compare(input.body.password, user.password),
        either.chain(
          boolean.fold(
            () =>
              either.left<RouteError>({
                code: 'FORBIDDEN',
                message: 'Wrong password'
              }),
            () => either.right(void 0)
          )
        ),
        taskEither.fromEither,
        taskEither.chain(() =>
          pipe(
            user.approved,
            boolean.fold(
              () =>
                taskEither.left<RouteError>({
                  code: 'FORBIDDEN',
                  message: 'Users must be approved by at least another user'
                }),
              () => taskEither.right(void 0)
            )
          )
        ),
        taskEither.chain(() =>
          taskEither.fromEither(createSessionData(user.id))
        ),
        taskEither.map(okRouteResponse)
      )
    )
  )
}

export const loginRoute = makeRoute(
  LoginInput,
  SessionData,
  t.unknown,
  login,
  false
)
