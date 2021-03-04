import * as t from 'io-ts'
import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  HandlerInputWithAuth,
  makeRoute,
  okRouteResponse,
  RouteError,
  RouteResponse
} from '../route'
import { User } from './userDatabase'

function profile(
  input: HandlerInputWithAuth<unknown, unknown>
): TaskEither<RouteError, RouteResponse<User>> {
  return pipe(
    taskEither.right(input.currentUser),
    taskEither.map(okRouteResponse)
  )
}

export const profileRoute = makeRoute(t.unknown, User, t.unknown, profile)
